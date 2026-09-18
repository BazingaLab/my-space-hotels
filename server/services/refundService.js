import { supabase } from "../config/supabase.js";
import { createRefund } from "../config/razorpay.js";

// A booking only goes through the real Razorpay refund path when there's
// an actual captured payment to refund — pay-at-hotel bookings, goodwill
// credits with no payment behind them, or bookings that were never
// actually captured all fall through to the bookkeeping-only
// rpc_refund_booking path instead. Shared by bookingMgmtController's
// dedicated /refund endpoint and guestBookingController's cancellation,
// so both agree on the same eligibility rule.
export const RAZORPAY_REFUND_ELIGIBLE_STATUSES = ["paid", "partial"];

export function isRazorpayRefundEligible(booking) {
  return booking.payment_mode === "prepaid"
    && !!booking.razorpay_payment_id
    && RAZORPAY_REFUND_ELIGIBLE_STATUSES.includes(booking.payment_status);
}

export async function commitBookkeepingRefund({ id, amount, reference, reason, actorId }) {
  const { data: updated, error } = await supabase.rpc("rpc_refund_booking", {
    p_booking_id: id,
    p_amount: Number(amount),
    p_reference: reference,
    p_reason: reason || null,
    p_actor_id: actorId,
  });
  return { updated, error };
}

// The full two-phase Razorpay refund: reserve (dedups on booking+reference
// before Razorpay is ever called) -> call Razorpay -> commit via the
// existing rpc_refund_booking. Returns a plain result object describing
// the outcome rather than writing an HTTP response itself, so callers
// (the dedicated refund endpoint, guest cancellation) can each phrase
// their own response/message around the same underlying operation.
//
// Possible outcomes:
//   "duplicate"              - this exact (booking, reference) was already reserved; no Razorpay call made here
//   "invalid"                - basic validation failed (bad amount/booking/status) before any Razorpay call
//   "gateway_failed"         - Razorpay rejected the refund; nothing local was touched
//   "reconciliation_required"- Razorpay succeeded but the local commit failed; razorpay_refund_id is real and must not be re-used for another gateway call
//   "completed"              - Razorpay succeeded and local bookkeeping is recorded
export async function processRazorpayRefund({ bookingId, razorpayPaymentId, amount, reference, reason, actorId }) {
  const { data: attempt, error: reserveErr } = await supabase.rpc("rpc_reserve_refund_attempt", {
    p_booking_id: bookingId,
    p_razorpay_payment_id: razorpayPaymentId,
    p_amount: Number(amount),
    p_reference: reference,
    p_actor_id: actorId,
  });
  if (reserveErr) {
    if (reserveErr.code === "MSH03") {
      // A prior attempt for this exact (booking, reference) already
      // exists — but "duplicate" alone doesn't mean it SUCCEEDED. Look
      // up what actually happened to it so the caller doesn't assume
      // success for an attempt that genuinely failed at the gateway.
      const { data: existing } = await supabase.from("razorpay_refund_attempts")
        .select("status, razorpay_refund_id")
        .eq("booking_id", bookingId).eq("reference", reference).maybeSingle();
      return {
        outcome: "duplicate",
        existingStatus: existing?.status || "unknown",
        razorpay_refund_id: existing?.razorpay_refund_id || null,
        message: "This refund reference has already been used for this booking",
      };
    }
    if (reserveErr.code === "MSH02" || reserveErr.code === "MSH01") return { outcome: "invalid", message: reserveErr.message };
    throw reserveErr;
  }

  let razorpayRefund;
  try {
    razorpayRefund = await createRefund({ paymentId: razorpayPaymentId, amountRupees: Number(amount), reference, reason });
  } catch (gatewayErr) {
    await supabase.from("razorpay_refund_attempts")
      .update({ status: "failed", error_detail: gatewayErr.message, updated_at: new Date().toISOString() })
      .eq("id", attempt.id);
    return { outcome: "gateway_failed", message: `Razorpay refund failed: ${gatewayErr.message}` };
  }

  const { updated, error: commitErr } = await commitBookkeepingRefund({ id: bookingId, amount, reference, reason, actorId });
  if (commitErr) {
    await supabase.from("razorpay_refund_attempts")
      .update({ status: "gateway_succeeded_local_failed", razorpay_refund_id: razorpayRefund.id, error_detail: commitErr.message, updated_at: new Date().toISOString() })
      .eq("id", attempt.id);
    console.error(`RECONCILIATION REQUIRED: Razorpay refund ${razorpayRefund.id} succeeded for booking ${bookingId} (attempt ${attempt.id}) but local bookkeeping failed: ${commitErr.message}`);
    return {
      outcome: "reconciliation_required",
      razorpay_refund_id: razorpayRefund.id,
      message: `The refund was processed by Razorpay (ref ${razorpayRefund.id}) but could not be recorded internally. This has been flagged for manual reconciliation.`,
    };
  }

  await supabase.from("razorpay_refund_attempts")
    .update({ status: "completed", razorpay_refund_id: razorpayRefund.id, updated_at: new Date().toISOString() })
    .eq("id", attempt.id);
  return { outcome: "completed", booking: updated, razorpay_refund_id: razorpayRefund.id, message: "Refund processed via Razorpay" };
}
