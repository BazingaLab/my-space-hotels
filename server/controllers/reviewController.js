import { supabase } from "../config/supabase.js";

// Recompute a hotel's average rating + count after a review changes.
async function refreshHotelRating(hotelId) {
  const { data: reviews } = await supabase.from("reviews").select("rating").eq("hotel_id", hotelId);
  const count = reviews?.length || 0;
  const avg = count ? +(reviews.reduce((s, r) => s + r.rating, 0) / count).toFixed(2) : 0;
  await supabase.from("hotels").update({ rating_avg: avg, rating_count: count }).eq("id", hotelId);
  return { avg, count };
}

// POST /api/reviews — guest leaves a review for a completed booking
export const create = async (req, res) => {
  try {
    const { booking_id, hotel_id, user_id, guest_name, rating, comment } = req.body;
    if (!booking_id || !hotel_id || !rating) return res.status(400).json({ message: "booking_id, hotel_id, rating required" });

    const { data, error } = await supabase.from("reviews").insert([{
      booking_id, hotel_id, user_id, guest_name, rating: Number(rating), comment,
    }]).select().single();
    if (error) {
      // unique(booking_id) violation -> already reviewed
      if (error.code === "23505") return res.status(409).json({ message: "You've already reviewed this stay." });
      throw error;
    }
    await refreshHotelRating(hotel_id);
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/reviews/hotel/:hotelId — public reviews for a hotel
export const byHotel = async (req, res) => {
  try {
    const { data, error } = await supabase.from("reviews").select("*").eq("hotel_id", req.params.hotelId).order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, reviews: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};