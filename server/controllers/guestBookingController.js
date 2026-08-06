import { supabase } from "../config/supabase.js";
import { postLedgerEntry, ensureWallet } from "./walletController.js";

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

    const { data: updated, error } = await supabase.from("bookings").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: "Cancelled by guest",
      reimbursement: fullRefund ? Number(booking.total_price) : 0,
      payment_status: fullRefund ? "refunded" : booking.payment_status,
    }).eq("id", id).select().single();
    if (error) throw error;

    // Reverse the hotel's wallet credit for this booking — best-effort,
    // never blocks the cancellation itself from succeeding.
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
          description: `Guest cancellation — booking ${id.slice(0, 8)}`,
        });
      }
    } catch (e) { console.error("Wallet reversal failed:", e.message); }

    res.json({
      message: fullRefund
        ? "Booking cancelled — full refund will be processed."
        : "Booking cancelled. No refund as it's past the free cancellation window.",
      booking: updated, fullRefund,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};