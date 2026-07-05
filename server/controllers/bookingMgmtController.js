import { supabase } from "../config/supabase.js";
import { audit } from "../audit.js";
import { postLedgerEntry, ensureWallet } from "./walletController.js";

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
export const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, reimbursement } = req.body;

    const { data: booking, error: bErr } = await supabase
      .from("bookings").select("*").eq("id", id).single();
    if (bErr) throw bErr;
    if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

    // Mark cancelled
    const { data: updated, error } = await supabase.from("bookings").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
      reimbursement: Number(reimbursement) || 0,
      payment_status: Number(reimbursement) > 0 ? "refunded" : booking.payment_status,
    }).eq("id", id).select().single();
    if (error) throw error;

    // Reverse the wallet credit for this booking (find original credit amount)
    try {
      const wallet = await ensureWallet(booking.hotel_id);
      const { data: creditEntry } = await supabase
        .from("ledger_entries").select("amount")
        .eq("ref_type", "booking").eq("ref_id", id).eq("direction", "credit")
        .order("created_at", { ascending: false }).limit(1).single();
      if (creditEntry) {
        await postLedgerEntry({
          walletId: wallet.id, amount: creditEntry.amount, direction: "debit",
          refType: "cancellation", refId: id,
          description: `Reversal — booking ${id.slice(0,8)} cancelled`,
        });
      }
    } catch (e) { console.error("Wallet reversal failed:", e.message); }

    await audit({ action: "cancel", entityType: "booking", entityId: id, beforeData: booking, afterData: updated, metadata: { reason } });
    res.json({ message: "Booking cancelled", booking: updated });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/booking-mgmt/:id/transfer
// Moves a booking to another hotel. Reverses the credit on the old hotel's
// wallet and credits the new hotel (net of its commission).
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

    // Update booking to new hotel, remembering where it came from
    const { data: updated, error } = await supabase.from("bookings").update({
      hotel_id: new_hotel_id,
      transferred_from_hotel: oldHotelId,
    }).eq("id", id).select().single();
    if (error) throw error;

    // Wallet adjustments: debit old hotel, credit new hotel (net of commission)
    try {
      const oldWallet = await ensureWallet(oldHotelId);
      const { data: creditEntry } = await supabase
        .from("ledger_entries").select("amount")
        .eq("ref_type", "booking").eq("ref_id", id).eq("direction", "credit")
        .order("created_at", { ascending: false }).limit(1).single();
      if (creditEntry) {
        await postLedgerEntry({ walletId: oldWallet.id, amount: creditEntry.amount, direction: "debit", refType: "transfer_out", refId: id, description: `Transfer out — booking ${id.slice(0,8)}` });
      }
      // Credit new hotel net of its commission
      const { data: newHotel } = await supabase.from("hotels").select("commission_percent").eq("id", new_hotel_id).single();
      const commissionPct = Number(newHotel?.commission_percent || 0);
      const net = +(Number(booking.total_price) * (1 - commissionPct / 100)).toFixed(2);
      const newWallet = await ensureWallet(new_hotel_id);
      await postLedgerEntry({ walletId: newWallet.id, amount: net, direction: "credit", refType: "transfer_in", refId: id, description: `Transfer in — booking ${id.slice(0,8)}` });
    } catch (e) { console.error("Transfer wallet adjust failed:", e.message); }

    await audit({ action: "transfer", entityType: "booking", entityId: id, metadata: { from: oldHotelId, to: new_hotel_id } });
    res.json({ message: "Booking transferred", booking: updated });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/booking-mgmt/:id
// Update payment status/mode, discount, special request, etc.
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ["payment_status", "payment_mode", "discount", "special_request", "guests"];
    const patch = {};
    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

    const { data, error } = await supabase.from("bookings").update(patch).eq("id", id).select().single();
    if (error) throw error;
    await audit({ action: "update", entityType: "booking", entityId: id, afterData: data });
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
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

    const { data, error } = await supabase.from("bookings").update({
      checkin_status: "checked_in", checked_in_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    if (error) throw error;

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

    const { data, error } = await supabase.from("bookings").update({
      checkin_status: "checked_out", checked_out_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    if (error) throw error;

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

    const { data, error } = await supabase.from("bookings").update({ checkin_status: "no_show" }).eq("id", id).select().single();
    if (error) throw error;

    await audit({ action: "no_show", entityType: "booking", entityId: id, beforeData: booking, afterData: data });
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
};