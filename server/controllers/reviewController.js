import { supabase } from "../config/supabase.js";

// Recompute a hotel's average rating + count after a review changes.
// Writes to `rating` / `review_count` — the columns every existing page
// (HotelCard, HotelDetail, search results) already reads. The version this
// replaces wrote to rating_avg/rating_count instead, which would have
// updated numbers nothing on the site actually displays.
async function refreshHotelRating(hotelId) {
  const { data: reviews } = await supabase.from("reviews").select("rating").eq("hotel_id", hotelId);
  const count = reviews?.length || 0;
  const avg = count ? +(reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(1) : 0;
  await supabase.from("hotels").update({ rating: avg, review_count: count }).eq("id", hotelId);
  return { avg, count };
}

// POST /api/reviews — guest leaves a review for a stay they actually took.
// Requires authenticate() in reviewRoutes.js. Every identity-bearing field
// (user_id, guest_name, hotel_id) is derived server-side from the verified
// booking record — never trusted from the request body — so a guest can't
// review someone else's stay, invent a hotel_id, or post before check-out.
export const create = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    const ratingNum = Number(rating);

    if (!booking_id || !rating) return res.status(400).json({ message: "booking_id and rating are required" });
    // Server-side bounds check — a client-side star widget can't be trusted
    // alone, since anyone can call this endpoint directly with any number.
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be a whole number from 1 to 5" });
    }
    if (comment && comment.length > 2000) {
      return res.status(400).json({ message: "Review is too long (2000 characters max)" });
    }

    // Fetch the booking and confirm it's actually this guest's, and that
    // the stay is actually over — a booking that's merely confirmed
    // (not yet checked out) can't be reviewed yet.
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id, hotel_id, user_id, guest_email, guest_name, checkin_status")
      .eq("id", booking_id)
      .single();
    if (bookingErr || !booking) return res.status(404).json({ message: "Booking not found" });

    const ownsBooking = booking.user_id === req.user.id
      || (booking.guest_email || "").toLowerCase() === (req.user.email || "").toLowerCase();
    if (!ownsBooking) return res.status(403).json({ message: "This isn't your booking" });

    if (booking.checkin_status !== "checked_out") {
      return res.status(400).json({ message: "You can review a stay once you've checked out" });
    }

    const { data, error } = await supabase.from("reviews").insert([{
      booking_id,
      hotel_id: booking.hotel_id,       // from the verified booking, not the request body
      user_id: req.user.id,             // from the verified session, not the request body
      guest_name: booking.guest_name,   // from the booking on file, not client-supplied
      rating: ratingNum,
      comment: comment || null,
    }]).select().single();

    if (error) {
      // unique(booking_id) constraint — this stay was already reviewed once
      if (error.code === "23505") return res.status(409).json({ message: "You've already reviewed this stay." });
      throw error;
    }

    await refreshHotelRating(booking.hotel_id);
    res.status(201).json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /api/reviews/hotel/:hotelId — public reviews for a hotel listing page.
// No auth required — this is guest-facing display data, same as the
// hotel listing itself.
export const byHotel = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("hotel_id", req.params.hotelId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, reviews: data });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};