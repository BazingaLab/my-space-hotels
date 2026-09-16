import { supabase } from "../config/supabase.js";

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

    // The status guard, the cancellation write, and the wallet reversal
    // are one atomic call (rpc_cancel_booking, 21-financial-integrity.sql)
    // — previously the reversal was best-effort (a swallowed try/catch),
    // so a cancellation could go through while silently leaving the
    // hotel's wallet still credited. This also makes double-clicking
    // cancel a clean no-op-with-error instead of a double reversal.
    const { data: updated, error } = await supabase.rpc("rpc_cancel_booking", {
      p_booking_id: id,
      p_reason: "Cancelled by guest",
      p_reimbursement: fullRefund ? Number(booking.total_price) : 0,
      p_new_payment_status: fullRefund ? "refunded" : booking.payment_status,
      p_actor_id: req.user.id,
    });
    if (error) {
      if (error.code === "MSH02") return res.status(400).json({ message: "Already cancelled" });
      throw error;
    }

    res.json({
      message: fullRefund
        ? "Booking cancelled — full refund will be processed."
        : "Booking cancelled. No refund as it's past the free cancellation window.",
      booking: updated, fullRefund,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
