import { supabase } from "../config/supabase.js";

// POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { hotel_id, guest_name, guest_email, guest_phone, check_in, check_out, guests } = req.body;

    if (!hotel_id || !guest_name || !guest_email || !check_in || !check_out) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Calculate nights & total
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
    if (nights < 1) return res.status(400).json({ message: "Check-out must be after check-in" });

    const { data: hotel, error: hotelError } = await supabase
      .from("hotels")
      .select("price, name")
      .eq("id", hotel_id)
      .single();

    if (hotelError || !hotel) return res.status(404).json({ message: "Hotel not found" });

    const total_price = hotel.price * nights;

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          hotel_id,
          guest_name,
          guest_email,
          guest_phone,
          check_in,
          check_out,
          guests: guests || 2,
          nights,
          total_price,
          status: "confirmed",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: "Booking confirmed", booking: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/:email
export const getBookingsByEmail = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, hotels(name, city, cover_image)")
      .eq("guest_email", req.params.email)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ count: data.length, bookings: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
