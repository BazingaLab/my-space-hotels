import { supabase } from "../config/supabase.js";
import { syncCustomerFromBooking } from "./customerController.js";
import { creditBookingToWallet } from "./walletController.js";
import { calculateGst } from "../utils/gst.js";

// POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { hotel_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, user_id, meal_plan } = req.body;

    if (!hotel_id || !guest_name || !guest_email || !check_in || !check_out) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (check_in < new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ message: "Check-in date cannot be in the past" });
    }

    // Calculate nights & total
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
    if (nights < 1) return res.status(400).json({ message: "Check-out must be after check-in" });

    const { data: hotel, error: hotelError } = await supabase
      .from("hotels")
      .select("price, name, breakfast_available, breakfast_price")
      .eq("id", hotel_id)
      .single();

    if (hotelError || !hotel) return res.status(404).json({ message: "Hotel not found" });

    // Meal plan: only apply the surcharge if the hotel actually offers breakfast —
    // a guest can't force it on by passing the flag if the hotel never enabled it.
    const wantsBreakfast = meal_plan === "breakfast_included" && hotel.breakfast_available;
    const breakfastPricePerNight = wantsBreakfast ? Number(hotel.breakfast_price || 0) : 0;
    const nightlyRate = Number(hotel.price) + breakfastPricePerNight;

    const total_price = nightlyRate * nights;
    // GST slab set by the effective nightly rate (room + breakfast, if chosen) —
    // a bundled booking is one composite supply for GST purposes.
    const { gstRate, gstAmount, grandTotal } = calculateGst(nightlyRate, total_price);

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
          gst_rate: gstRate,
          gst_amount: gstAmount,
          grand_total: grandTotal,
          meal_plan: wantsBreakfast ? "breakfast_included" : "room_only",
          breakfast_price_applied: breakfastPricePerNight,
          status: "confirmed",
          user_id: user_id || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Auto-create / update CRM customer record
    try {
      const customer = await syncCustomerFromBooking(data);
      if (customer) {
        await supabase.from("bookings").update({ customer_id: customer.id }).eq("id", data.id);
        data.customer_id = customer.id;
      }
    } catch (e) { console.error("Customer sync failed:", e.message); }

    // Credit hotel wallet (net of commission) — still based on pre-tax total_price
    try { await creditBookingToWallet(data); }
    catch (e) { console.error("Wallet credit failed:", e.message); }

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
      .select("*, hotels!hotel_id(name, city, cover_image)")
      .ilike("guest_email", req.params.email)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ count: data.length, bookings: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET /api/bookings/user/:userId
// Returns bookings by user_id OR by the account email — so bookings
// always show regardless of what email the user typed at checkout.
export const getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Step 1: get the account email (service role can access auth.admin)
    const { data: { user }, error: authErr } = await supabase.auth.admin.getUserById(userId);
    const userEmail = user?.email || null;

    // Step 2: bookings linked by user_id
    const { data: byId, error: e1 } = await supabase
      .from("bookings")
      .select("*, hotels!hotel_id(name, city, cover_image)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (e1) throw e1;

    // Step 3: bookings linked by account email (catches typed-different-email case)
    let byEmail = [];
    if (userEmail) {
      const { data } = await supabase
        .from("bookings")
        .select("*, hotels!hotel_id(name, city, cover_image)")
        .ilike("guest_email", userEmail)
        .order("created_at", { ascending: false });
      byEmail = data || [];
    }

    // Step 4: merge and deduplicate
    const seen = new Set();
    const combined = [...(byId || []), ...byEmail].filter(b => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ count: combined.length, bookings: combined });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};