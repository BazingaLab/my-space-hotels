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
    // Nightly bookings need a check-out date; hourly bookings compute their
    // own end time from start_time + slot_hours, so check_out is optional.
    if (booking_type !== "hourly" && !check_out) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // priceBooking() handles both nightly and hourly pricing, GST, and
    // (for hourly) the availability check — kept in one shared place so
    // this and the Razorpay create-order path can never drift apart.
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

    // Auto-create / update CRM customer record — best-effort, never blocks
    // the booking itself from succeeding if this fails.
    try {
      const customer = await syncCustomerFromBooking(data);
      if (customer) {
        await supabase.from("bookings").update({ customer_id: customer.id }).eq("id", data.id);
        data.customer_id = customer.id;
      }
    } catch (e) { console.error("Customer sync failed:", e.message); }

    // Credit hotel wallet (net of commission) — also best-effort.
    try { await creditBookingToWallet(data); }
    catch (e) { console.error("Wallet credit failed:", e.message); }

    res.status(201).json({ message: "Booking confirmed", booking: data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/bookings/:email
// Legacy/guest lookup path — includes an embedded `reviews` array per
// booking (via the reviews.booking_id foreign key) so the frontend can
// tell, without a second request, whether each stay's already been
// reviewed. Empty array = not reviewed yet.
export const getBookingsByEmail = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, hotels!hotel_id(name, city, cover_image), reviews(id, rating)")
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
// Same embedded `reviews` array as above, for the same reason.
export const getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Step 1: get the account email (service role can access auth.admin)
    const { data: { user }, error: authErr } = await supabase.auth.admin.getUserById(userId);
    const userEmail = user?.email || null;

    // Step 2: bookings linked by user_id
    const { data: byId, error: e1 } = await supabase
      .from("bookings")
      .select("*, hotels!hotel_id(name, city, cover_image), reviews(id, rating)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (e1) throw e1;

    // Step 3: bookings linked by account email (catches typed-different-email case)
    let byEmail = [];
    if (userEmail) {
      const { data } = await supabase
        .from("bookings")
        .select("*, hotels!hotel_id(name, city, cover_image), reviews(id, rating)")
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