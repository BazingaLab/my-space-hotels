import { supabase } from "../config/supabase.js";
import { isRazorpayRefundEligible, processRazorpayRefund } from "../services/refundService.js";

// A booking belongs to the caller if either its user_id matches the
// verified session, or its guest_email matches the verified session's
// email (covers a guest who checked out without an account, then later
// signed in using the same address). Never trusts an id/email sent in
// the request itself — that was the actual security gap here.
function ownsBooking(booking, user) {
  if (booking.user_id && booking.user_id === user.id) return true;
  if (booking.guest_email && user.email && booking.guest_email.toLowerCase() === user.email.toLowerCase()) return true;
  return false;
}

// GET /api/guest-bookings/:id
// Full booking detail for the guest view. Requires authenticate() in
// guestBookingRoutes.js, and now also verifies the booking actually
// belongs to the caller — previously any logged-in-or-not visitor with a
// booking's UUID could view another guest's full details.
export const detail = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, hotels!hotel_id(name, city, property_address, google_map_link, checkin_time, checkout_time, amenities, cover_image, free_cancellation_hours, contact_number)")
      .eq("id", id).single();
    if (error || !booking) return res.status(404).json({ message: "Booking not found" });

    if (!ownsBooking(booking, req.user)) {
      return res.status(403).json({ message: "This isn't your booking" });
    }

    // Has this booking already been reviewed? (one review per booking,
    // enforced by a unique constraint on reviews.booking_id)
    const { data: review } = await supabase.from("reviews").select("*").eq("booking_id", id).single();

    // Still cancellable? Only upcoming, not-already-cancelled bookings.
    const today = new Date();
    const checkIn = new Date(booking.check_in);
    const hoursUntil = (checkIn - today) / (1000 * 60 * 60);
    const freeWindow = booking.hotels?.free_cancellation_hours ?? 24;
    const cancellable = booking.status !== "cancelled" && checkIn > today;
    const freeCancellation = hoursUntil >= freeWindow;

    res.json({ ...booking, review: review || null, cancellable, freeCancellation, hoursUntil: Math.round(hoursUntil) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/guest-bookings/:id/cancel
// Guest self-cancellation. Reverses the hotel wallet credit. Ownership now
// comes from the verified session, not a user_id in the request body —
// the old check was skippable just by not sending that field.
// Flips status -> cancelled (+ releases inventory, since availability
// queries filter on status <> 'cancelled') via the existing atomic RPC.
// skipWalletReversal is true for a booking whose money was already
// reversed via processRazorpayRefund — passing p_reimbursement/
// p_new_payment_status as null here leaves those fields exactly as
// that refund call already set them, rather than overwriting them.
// A concurrent duplicate call landing here after another request has
// already finished the status transition is treated as success, not
// an error — cancellation itself is idempotent from the caller's view.
async function finishCancellation({ id, actorId, reimbursement, paymentStatus, skipWalletReversal }) {
  const { data: updated, error } = await supabase.rpc("rpc_cancel_booking", {
    p_booking_id: id,
    p_reason: "Cancelled by guest",
    p_reimbursement: reimbursement,
    p_new_payment_status: paymentStatus,
    p_actor_id: actorId,
    p_skip_wallet_reversal: skipWalletReversal,
  });
  if (error) {
    if (error.code === "MSH02") {
      const { data: current } = await supabase.from("bookings").select("*").eq("id", id).single();
      return { booking: current, error: null };
    }
    return { booking: null, error };
  }
  return { booking: updated, error: null };
}

export const cancel = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: booking, error: bErr } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (bErr || !booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

    if (!ownsBooking(booking, req.user)) {
      return res.status(403).json({ message: "This isn't your booking" });
    }

    const today = new Date();
    const checkIn = new Date(booking.check_in);
    if (checkIn <= today) return res.status(400).json({ message: "Past or active bookings can't be cancelled online. Please contact support." });

    // Refund eligibility based on the hotel's free-cancellation window.
    const { data: hotel } = await supabase.from("hotels").select("free_cancellation_hours").eq("id", booking.hotel_id).single();
    const freeWindow = hotel?.free_cancellation_hours ?? 24;
    const hoursUntil = (checkIn - today) / (1000 * 60 * 60);
    const fullRefund = hoursUntil >= freeWindow;

    // Only a captured Razorpay payment can actually be refunded through
    // the gateway — pay-at-hotel, goodwill, and never-captured bookings
    // fall through to the bookkeeping-only path below, unchanged.
    if (fullRefund && isRazorpayRefundEligible(booking)) {
      // Deterministic, booking-scoped reference — a booking can only be
      // cancelled once, so any retry (double-click, network retry, a
      // second request racing the first) reuses this SAME reference and
      // is caught by rpc_reserve_refund_attempt's uniqueness guard
      // BEFORE Razorpay is called again, rather than issuing a second
      // real refund.
      const result = await processRazorpayRefund({
        bookingId: id, razorpayPaymentId: booking.razorpay_payment_id,
        amount: booking.grand_total, reference: `cancel-${id}`, reason: "Guest cancellation", actorId: req.user.id,
      });

      if (result.outcome === "gateway_failed" || result.outcome === "invalid") {
        // Nothing moved — the booking is deliberately left NOT cancelled
        // so the guest can retry rather than being told it's cancelled
        // when no refund actually happened.
        return res.status(502).json({ message: `Cancellation couldn't be completed: ${result.message}. Your booking has not been cancelled — please try again or contact support.` });
      }

      if (result.outcome === "duplicate") {
        // A previous attempt already reserved this exact reference — but
        // that does NOT by itself mean it succeeded. Check what actually
        // happened to it before deciding whether it's safe to treat this
        // as "already refunded."
        if (result.existingStatus === "completed") {
          const { booking: finished, error } = await finishCancellation({ id, actorId: req.user.id, reimbursement: null, paymentStatus: null, skipWalletReversal: true });
          if (error) throw error;
          return res.json({ message: "Booking cancelled — refund already processed.", booking: finished, fullRefund: true, refundStatus: "completed" });
        }
        if (result.existingStatus === "gateway_succeeded_local_failed") {
          const { booking: finished, error } = await finishCancellation({ id, actorId: req.user.id, reimbursement: null, paymentStatus: null, skipWalletReversal: true });
          if (error) throw error;
          return res.status(207).json({
            message: "Your booking has been cancelled. Your refund was submitted to our payment provider, but we're still confirming it in our system — this can take a little while. Contact support if it doesn't show up soon.",
            booking: finished, fullRefund: true, refundStatus: "reconciliation_required", razorpay_refund_id: result.razorpay_refund_id,
          });
        }
        // existingStatus is "failed" (the earlier attempt genuinely failed
        // at Razorpay — no money moved) or "pending" (one is still in
        // flight) — either way, nothing has actually succeeded, so the
        // booking must NOT be cancelled/marked refunded here. The
        // deterministic reference is already consumed, so an automatic
        // retry can't safely re-attempt the SAME reference; this needs a
        // human to look at it rather than silently reporting success.
        return res.status(502).json({
          message: "Cancellation couldn't be completed — a previous attempt to refund this booking did not succeed. Please contact support rather than retrying.",
        });
      }

      if (result.outcome === "reconciliation_required") {
        // Money already moved at Razorpay; local ledger/booking fields
        // could not be written. Cancel the booking (status/inventory
        // only, no wallet touch — there's nothing consistent to reverse
        // yet) and tell the guest the truth rather than a false "done".
        const { booking: finished, error } = await finishCancellation({ id, actorId: req.user.id, reimbursement: null, paymentStatus: null, skipWalletReversal: true });
        if (error) throw error;
        return res.status(207).json({
          message: "Your booking has been cancelled. Your refund was submitted to our payment provider, but we're still confirming it in our system — this can take a little while. Contact support if it doesn't show up soon.",
          booking: finished, fullRefund: true, refundStatus: "reconciliation_required", razorpay_refund_id: result.razorpay_refund_id,
        });
      }

      // outcome === "completed" — refund succeeded and is recorded; now
      // flip status/inventory, skipping a second wallet reversal since
      // rpc_refund_booking already reversed it under ref_type='refund'.
      const { booking: finished, error } = await finishCancellation({ id, actorId: req.user.id, reimbursement: null, paymentStatus: null, skipWalletReversal: true });
      if (error) {
        console.error(`RECONCILIATION NOTE: booking ${id} refunded (razorpay ${result.razorpay_refund_id}) but the cancelled-status update failed: ${error.message}`);
        return res.status(207).json({
          message: "Your refund was processed, but we couldn't fully update your booking status — contact support if this doesn't resolve shortly.",
          booking: result.booking, fullRefund: true, refundStatus: "completed", razorpay_refund_id: result.razorpay_refund_id,
        });
      }
      return res.json({ message: "Booking cancelled and refund processed.", booking: finished, fullRefund: true, refundStatus: "completed", razorpay_refund_id: result.razorpay_refund_id });
    }

    // ---- Bookkeeping-only path: past free-cancellation window, pay-at-hotel, or never captured ----
    const { booking: updated, error } = await finishCancellation({
      id, actorId: req.user.id,
      reimbursement: fullRefund ? Number(booking.grand_total) : 0,
      paymentStatus: fullRefund ? "refunded" : booking.payment_status,
      skipWalletReversal: false,
    });
    if (error) throw error;

    const message = !fullRefund
      ? "Booking cancelled. No refund as it's past the free cancellation window."
      : "Booking cancelled. No payment was collected for this booking, so there's nothing to refund.";

    res.json({ message, booking: updated, fullRefund, refundStatus: "not_applicable" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
