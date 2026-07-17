import { supabase } from "../config/supabase.js";
import { syncCustomerFromBooking } from "./customerController.js";
import { creditBookingToWallet } from "./walletController.js";
import { priceBooking } from "../utils/pricing.js";

// POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { hotel_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, user_id, meal_plan, booking_type, slot_hours, start_time } = req.body;

    if (!hotel_id || !guest_name || !guest_email || !check_in) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (booking_type !== "hourly" && !check_out) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const priced = await priceBooking({ hotel_id, check_in, check_out, meal_plan, booking_type, slot_hours, start_time });

    const { data, error } = await supabase
      .from("bookings")
      .insert([{
        hotel_id, guest_name, guest_email, guest_phone,
        check_in: priced.checkInDate, check_out: priced.checkOutDate,
        guests: guests || 2, nights: priced.nights,
        total_price: priced.total_price,
        gst_rate: priced.gstRate, gst_amount: priced.gstAmount, grand_total: priced.grandTotal,
        meal_plan: priced.mealPlan, breakfast_price_applied: priced.breakfastPricePerNight,
        booking_type: priced.bookingType, slot_hours: priced.slotHours,
        checkin_datetime: priced.checkinDatetime, checkout_datetime: priced.checkoutDatetime,
        status: "confirmed",
        user_id: user_id || null,
      }])
      .select()
      .single();

    if (error) throw error;

    try {
      const customer = await syncCustomerFromBooking(data);
      if (customer) {
        await supabase.from("bookings").update({ customer_id: customer.id }).eq("id", data.id);
        data.customer_id = customer.id;
      }
    } catch (e) { console.error("Customer sync failed:", e.message); }

    try { await creditBookingToWallet(data); }
    catch (e) { console.error("Wallet credit failed:", e.message); }

    res.status(201).json({ message: "Booking confirmed", booking: data });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
export const getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: { user }, error: authErr } = await supabase.auth.admin.getUserById(userId);
    const userEmail = user?.email || null;

    const { data: byId, error: e1 } = await supabase
      .from("bookings")
      .select("*, hotels!hotel_id(name, city, cover_image)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (e1) throw e1;

    let byEmail = [];
    if (userEmail) {
      const { data } = await supabase
        .from("bookings")
        .select("*, hotels!hotel_id(name, city, cover_image)")
        .ilike("guest_email", userEmail)
        .order("created_at", { ascending: false });
      byEmail = data || [];
    }

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