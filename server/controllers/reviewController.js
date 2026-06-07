import { supabase } from "../config/supabase.js";
import { postLedgerEntry, ensureWallet } from "./walletController.js";

// GET /api/guest-bookings/:id
// Full booking detail for the guest view — includes hotel info and whether
// the booking is still cancellable and whether it's already been reviewed.
export const detail = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, hotels!hotel_id(name, city, property_address, google_map_link, checkin_time, checkout_time, amenities, cover_image, free_cancellation_hours, contact_number)")
      .eq("id", id).single();
    if (error) throw error;

    // Has this booking already been reviewed?
    const { data: review } = await supabase.from("reviews").select("*").eq("booking_id", id).single();

    // Is it still cancellable? Only upcoming bookings, and not already cancelled.
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
// Guest self-cancellation. Reverses the hotel wallet credit. If within the free
// window, marks for full refund; otherwise no automatic refund (admin can adjust).
export const cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const { data: booking, error: bErr } = await supabase.from("bookings").select("*").eq("id", id).single();
    if (bErr) throw bErr;
    if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });

    // Security: the booking must belong to this user (by user_id or email match handled client-side)
    if (user_id && booking.user_id && booking.user_id !== user_id) {
      return res.status(403).json({ message: "Not your booking" });
    }

    const today = new Date();
    const checkIn = new Date(booking.check_in);
    if (checkIn <= today) return res.status(400).json({ message: "Past or active bookings can't be cancelled online. Please contact support." });

    // Determine refund eligibility based on the hotel's free-cancellation window
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

    // Reverse the hotel's wallet credit for this booking
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
          description: `Guest cancellation — booking ${id.slice(0,8)}`,
        });
      }
    } catch (e) { console.error("Wallet reversal failed:", e.message); }

    res.json({ message: fullRefund ? "Booking cancelled — full refund will be processed." : "Booking cancelled. No refund as it's past the free cancellation window.", booking: updated, fullRefund });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
