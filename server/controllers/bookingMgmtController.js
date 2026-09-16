import { supabase } from "../config/supabase.js";
import { audit } from "../audit.js";
import { createRefund } from "../config/razorpay.js";

// A booking only goes through the real Razorpay refund path when there's
// an actual captured payment to refund — pay-at-hotel bookings, goodwill
// credits with no payment behind them, or bookings that were never
// actually captured all fall through to the original bookkeeping-only
// rpc_refund_booking path, unchanged.
const RAZORPAY_REFUND_ELIGIBLE_STATUSES = ["paid", "partial"];

// Compute the lifecycle bucket a booking falls into based on today's date.
// Used to keep statuses fresh without a cron job.
function deriveStatus(b) {
  if (b.status === "cancelled") return "cancelled";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ci = new Date(b.check_in), co = new Date(b.check_out);
  if (ci > today) return "upcoming";
  if (co < today) return "closed";
  return "active";
}

// True if this user may act on this booking: super_admin always;
// hotel_admin only if they own the hotel the booking belongs to. The
// route can't check this by URL param (only a booking id is present),
// so it's resolved here once the booking's hotel_id is known — this is
// what stops a hotel_admin from cancelling/checking-in a booking that
// belongs to a hotel they don't own just by guessing its id.
async function canAccessBooking(booking, user) {
  if (user.role === "super_admin") return true;
  const { data: hotel } = await supabase.from("hotels").select("owner_id").eq("id", booking.hotel_id).single();
  return hotel?.owner_id === user.id;
}

// GET /api/booking-mgmt?status=active|upcoming|closed|cancelled
// Lists bookings, recomputing live lifecycle status so the tabs are accurate.
export const list = async (req, res) => {
  try {
    const { status, search } = req.query;
    let q = supabase.from("bookings")
      .select("*, hotels!hotel_id(name, city)")
      .order("created_at", { ascending: false });
    if (search) q = q.or(`guest_name.ilike.%${search}%,guest_email.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;

    // Recompute lifecycle status in-memory (doesn't mutate cancelled ones)
    const withLive = data.map(b => ({ ...b, liveStatus: deriveStatus(b) }));
    const filtered = status ? withLive.filter(b => b.liveStatus === status) : withLive;
    res.json({ count: filtered.length, bookings: filtered });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/booking-mgmt/:id/cancel
// Cancels a booking and REVERSES the hotel's wallet credit (debit entry),
// because that revenue is no longer earned. Optionally records a reimbursement.
//
// The status-guard, the cancellation write, and the wallet reversal are
// now ONE atomic call (rpc_cancel_booking, 21-financial-integrity.sql) —
// previously the wallet reversal was best-effort (wrapped in a
// try/catch that only logged on failure), so a cancellation could
// "succeed" while silently leaving the hotel's wallet still credited
// for a stay that's no longer happening. Now either both land or
// neither does, and calling this twice on the same booking is a clean
// 400 rather than a double reversal.
export const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, reimbursement } = req.body;

    const { data: booking, error: bErr } = await supabase
      .from("bookings").select("*").eq("id", id).single();
    if (bErr) throw bErr;
    if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });
    if (!(await canAccessBooking(booking, req.user))) return res.status(403).json({ message: "You don't have permission to manage this booking" });

    const { data: updated, error } = await supabase.rpc("rpc_cancel_booking", {
      p_booking_id: id,
      p_reason: reason || null,
      p_reimbursement: Number(reimbursement) || 0,
      p_new_payment_status: Number(reimbursement) > 0 ? "refunded" : booking.payment_status,
      p_actor_id: req.user.id,
    });
    if (error) {
      if (error.code === "MSH02") return res.status(400).json({ message: "Already cancelled" });
      throw error;
    }

    await audit({ userId: req.user.id, userEmail: req.user.email, action: "cancel", entityType: "booking", entityId: id, beforeData: booking, afterData: updated, metadata: { reason } });
    res.json({ message: "Booking cancelled", booking: updated });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/booking-mgmt/:id/transfer
// Moves a booking to another hotel. Reverses the credit on the old hotel's
// wallet and credits the new hotel (net of its commission).
//
// The booking's hotel_id change and both wallet adjustments are now ONE
// atomic call (rpc_transfer_booking) — previously the booking was moved
// first and the wallet adjustments were best-effort afterward, so a
// failure partway through could leave hotel A credited for a booking
// hotel B now owns, with no matching credit anywhere for B.
export const transfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_hotel_id } = req.body;
    if (!new_hotel_id) return res.status(400).json({ message: "new_hotel_id required" });

    const { data: booking, error: bErr } = await supabase
      .from("bookings").select("*").eq("id", id).single();
    if (bErr) throw bErr;
    if (booking.hotel_id === new_hotel_id) return res.status(400).json({ message: "Same hotel" });

    const oldHotelId = booking.hotel_id;

    const { data: updated, error } = await supabase.rpc("rpc_transfer_booking", {
      p_booking_id: id,
      p_new_hotel_id: new_hotel_id,
      p_actor_id: req.user.id,
    });
    if (error) {
      if (error.code === "MSH02") return res.status(400).json({ message: error.message });
      if (error.code === "MSH01") return res.status(404).json({ message: error.message });
      throw error;
    }

    await audit({ userId: req.user.id, userEmail: req.user.email, action: "transfer", entityType: "booking", entityId: id, metadata: { from: oldHotelId, to: new_hotel_id } });
    res.json({ message: "Booking transferred", booking: updated });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/booking-mgmt/:id
// Update payment status/mode, discount, special request, etc.
//
// payment_status can NOT be set to 'refunded'/'partial' here — that
// transition must always carry an actual wallet reversal with it, and
// this generic PATCH has no way to do that safely (no amount, no
// reference, no idempotency). Use POST /:id/refund instead, which
// performs the ledger reversal and the status change as one atomic,
// idempotent operation (see rpc_refund_booking, 23-refund-workflow.sql).
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    if (["refunded", "partial"].includes(req.body.payment_status)) {
      return res.status(400).json({ message: "Use POST /api/booking-mgmt/:id/refund to record a refund — payment_status can't be set to refunded/partial directly." });
    }

    const allowed = ["payment_status", "payment_mode", "discount", "special_request", "guests"];
    const patch = {};
    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

    const { data, error } = await supabase.from("bookings").update(patch).eq("id", id).select().single();
    if (error) throw error;
    await audit({ action: "update", entityType: "booking", entityId: id, afterData: data });
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// POST /api/booking-mgmt/:id/refund
// The ONLY way payment_status can become 'refunded'/'partial'. Amount,
// reference (required — the idempotency key) and reason are all
// caller-supplied; the actual wallet reversal, the reimbursement total,
// and the resulting payment_status are computed and written atomically
// by rpc_refund_booking (23-refund-workflow.sql). A booking can be
// refunded without being cancelled (e.g. a service issue during a stay
// that still happened), and can be refunded more than once — repeating
// the SAME reference is rejected as a duplicate rather than double-
// reversing the wallet.
async function commitBookkeepingRefund({ id, amount, reference, reason, actorId }) {
  const { data: updated, error } = await supabase.rpc("rpc_refund_booking", {
    p_booking_id: id,
    p_amount: Number(amount),
    p_reference: reference,
    p_reason: reason || null,
    p_actor_id: actorId,
  });
  return { updated, error };
}

export const refund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reference, reason } = req.body;
    if (!amount || !reference) return res.status(400).json({ message: "amount and reference are required" });
    if (Number(amount) <= 0) return res.status(400).json({ message: "Refund amount must be positive" });

    const { data: booking, error: bErr } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (bErr) throw bErr;
    if (!(await canAccessBooking(booking, req.user))) return res.status(403).json({ message: "You don't have permission to manage this booking" });

    const usesRazorpay = booking.payment_mode === "prepaid"
      && !!booking.razorpay_payment_id
      && RAZORPAY_REFUND_ELIGIBLE_STATUSES.includes(booking.payment_status);

    if (!usesRazorpay) {
      // Pay-at-hotel / goodwill / never-actually-captured — unchanged
      // bookkeeping-only path, exactly as before Phase 7.
      const { updated, error } = await commitBookkeepingRefund({ id, amount, reference, reason, actorId: req.user.id });
      if (error) {
        if (error.code === "MSH03") return res.status(409).json({ message: error.message });
        if (error.code === "MSH02" || error.code === "MSH01") return res.status(400).json({ message: error.message });
        throw error;
      }
      await audit({ userId: req.user.id, userEmail: req.user.email, action: "refund", entityType: "booking", entityId: id, beforeData: booking, afterData: updated, metadata: { amount, reference, reason } });
      return res.json({ message: "Refund recorded", booking: updated, razorpay_refund_id: null });
    }

    // ---- Real Razorpay refund, two-phase ----
    // Phase 1: reserve the attempt. Dedups on (booking_id, reference)
    // BEFORE Razorpay is ever called — a retried/duplicated request
    // with the same reference never reaches the gateway twice.
    const { data: attempt, error: reserveErr } = await supabase.rpc("rpc_reserve_refund_attempt", {
      p_booking_id: id,
      p_razorpay_payment_id: booking.razorpay_payment_id,
      p_amount: Number(amount),
      p_reference: reference,
      p_actor_id: req.user.id,
    });
    if (reserveErr) {
      if (reserveErr.code === "MSH03") return res.status(409).json({ message: "This refund reference has already been used for this booking" });
      if (reserveErr.code === "MSH02" || reserveErr.code === "MSH01") return res.status(400).json({ message: reserveErr.message });
      throw reserveErr;
    }

    // Phase 2: call Razorpay. Any rejection (invalid payment id, amount
    // exceeds what's refundable, already refunded on Razorpay's side,
    // network/gateway failure) lands here — nothing local has moved yet.
    let razorpayRefund;
    try {
      razorpayRefund = await createRefund({ paymentId: booking.razorpay_payment_id, amountRupees: Number(amount), reference, reason });
    } catch (gatewayErr) {
      await supabase.from("razorpay_refund_attempts")
        .update({ status: "failed", error_detail: gatewayErr.message, updated_at: new Date().toISOString() })
        .eq("id", attempt.id);
      return res.status(502).json({ message: `Razorpay refund failed: ${gatewayErr.message}` });
    }

    // Phase 3: commit the existing, already-tested bookkeeping RPC.
    const { updated, error: commitErr } = await commitBookkeepingRefund({ id, amount, reference, reason, actorId: req.user.id });
    if (commitErr) {
      // Razorpay succeeded but the local write failed — never silently
      // drop this. The attempt row is the auditable trail: it already
      // has the amount/reference/booking, now also the real Razorpay
      // refund id, flagged as needing manual reconciliation.
      await supabase.from("razorpay_refund_attempts")
        .update({ status: "gateway_succeeded_local_failed", razorpay_refund_id: razorpayRefund.id, error_detail: commitErr.message, updated_at: new Date().toISOString() })
        .eq("id", attempt.id);
      console.error(`RECONCILIATION REQUIRED: Razorpay refund ${razorpayRefund.id} succeeded for booking ${id} (attempt ${attempt.id}) but local bookkeeping failed: ${commitErr.message}`);
      return res.status(500).json({
        message: `The refund was processed by Razorpay (ref ${razorpayRefund.id}) but could not be recorded internally. This has been flagged for manual reconciliation.`,
        razorpay_refund_id: razorpayRefund.id,
      });
    }

    await supabase.from("razorpay_refund_attempts")
      .update({ status: "completed", razorpay_refund_id: razorpayRefund.id, updated_at: new Date().toISOString() })
      .eq("id", attempt.id);
    await audit({ userId: req.user.id, userEmail: req.user.email, action: "refund", entityType: "booking", entityId: id, beforeData: booking, afterData: updated, metadata: { amount, reference, reason, razorpay_refund_id: razorpayRefund.id } });
    res.json({ message: "Refund processed via Razorpay", booking: updated, razorpay_refund_id: razorpayRefund.id });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/booking-mgmt/stats — counts per lifecycle bucket for KPI cards
export const stats = async (req, res) => {
  try {
    const { data, error } = await supabase.from("bookings").select("status, check_in, check_out, total_price");
    if (error) throw error;
    const buckets = { active: 0, upcoming: 0, closed: 0, cancelled: 0 };
    let revenue = 0;
    for (const b of data) {
      const s = deriveStatus(b);
      buckets[s] = (buckets[s] || 0) + 1;
      if (s !== "cancelled") revenue += Number(b.total_price || 0);
    }
    res.json({ ...buckets, total: data.length, revenue });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/booking-mgmt/:id/checkin — front-desk marks the guest as arrived.
export const checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: booking, error: bErr } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (bErr) throw bErr;
    if (booking.status === "cancelled") return res.status(400).json({ message: "Booking is cancelled" });
    if (booking.checkin_status === "checked_in") return res.status(400).json({ message: "Already checked in" });
    if (booking.checkin_status === "checked_out") return res.status(400).json({ message: "Guest has already checked out" });
    if (!(await canAccessBooking(booking, req.user))) return res.status(403).json({ message: "You don't have permission to manage this booking" });

    // Guarded by checkin_status = 'not_arrived' so this only ever
    // transitions the row once, even if two check-in requests for the
    // same booking land at nearly the same time.
    const { data, error } = await supabase.from("bookings").update({
      checkin_status: "checked_in", checked_in_at: new Date().toISOString(),
    }).eq("id", id).eq("checkin_status", booking.checkin_status || "not_arrived").select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(400).json({ message: "Check-in status changed by another request — please refresh" });

    await audit({ action: "checkin", entityType: "booking", entityId: id, beforeData: booking, afterData: data });
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// POST /api/booking-mgmt/:id/checkout — front-desk marks the guest as departed.
export const checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: booking, error: bErr } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (bErr) throw bErr;
    if (booking.checkin_status !== "checked_in") return res.status(400).json({ message: "Guest hasn't checked in yet" });
    if (!(await canAccessBooking(booking, req.user))) return res.status(403).json({ message: "You don't have permission to manage this booking" });

    const { data, error } = await supabase.from("bookings").update({
      checkin_status: "checked_out", checked_out_at: new Date().toISOString(),
    }).eq("id", id).eq("checkin_status", "checked_in").select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(400).json({ message: "Check-in status changed by another request — please refresh" });

    await audit({ action: "checkout", entityType: "booking", entityId: id, beforeData: booking, afterData: data });
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// POST /api/booking-mgmt/:id/no-show — guest never arrived for their stay.
export const markNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: booking, error: bErr } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (bErr) throw bErr;
    if (booking.status === "cancelled") return res.status(400).json({ message: "Booking is cancelled" });
    if (booking.checkin_status !== "not_arrived") return res.status(400).json({ message: "Guest has already checked in or checked out" });
    if (!(await canAccessBooking(booking, req.user))) return res.status(403).json({ message: "You don't have permission to manage this booking" });

    const { data, error } = await supabase.from("bookings").update({ checkin_status: "no_show" })
      .eq("id", id).eq("checkin_status", "not_arrived").select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(400).json({ message: "Check-in status changed by another request — please refresh" });

    await audit({ action: "no_show", entityType: "booking", entityId: id, beforeData: booking, afterData: data });
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
};
