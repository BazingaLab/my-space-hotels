import { supabase } from "../config/supabase.js";
import { calculateGst } from "./gst.js";
import { checkAvailability, computeBookingWindow } from "./availability.js";

// Shared by both booking-creation paths (pay-at-hotel and prepaid): the
// availability check and the insert happen as ONE atomic operation in
// Postgres (rpc_create_booking, see 21-financial-integrity.sql), so two
// concurrent requests for the last room can never both succeed — one
// commits, the hotel row's lock makes the other's overlap count include
// the first booking, and it's correctly told the dates are sold out.
export async function insertBookingAtomically({ hotel_id, guest_name, guest_email, guest_phone, priced, guests, status, payment_mode, payment_status, special_request, user_id }) {
  const { data, error } = await supabase.rpc("rpc_create_booking", {
    p_hotel_id: hotel_id,
    p_guest_name: guest_name,
    p_guest_email: guest_email,
    p_guest_phone: guest_phone || null,
    p_check_in: priced.checkInDate,
    p_check_out: priced.checkOutDate,
    p_guests: guests || 2,
    p_nights: priced.nights,
    p_total_price: priced.total_price,
    p_gst_rate: priced.gstRate,
    p_gst_amount: priced.gstAmount,
    p_grand_total: priced.grandTotal,
    p_meal_plan: priced.mealPlan,
    p_breakfast_price_applied: priced.breakfastPricePerNight,
    p_booking_type: priced.bookingType,
    p_slot_hours: priced.slotHours,
    p_checkin_datetime: priced.checkinDatetime,
    p_checkout_datetime: priced.checkoutDatetime,
    p_status: status,
    p_payment_mode: payment_mode || "pay_at_hotel",
    p_payment_status: payment_status || "pending",
    p_special_request: special_request || null,
    p_user_id: user_id || null,
    p_window_start: priced.windowStart,
    p_window_end: priced.windowEnd,
  });
  if (error) {
    // MSH02 is this function's own "sold out" exception (see the SQL) —
    // give it a clean, specific message rather than a raw Postgres error.
    if (error.code === "MSH02" || /sold out/i.test(error.message || "")) {
      throw new Error("Sorry, this hotel is sold out for the selected dates.");
    }
    throw error;
  }
  return data;
}

export async function priceBooking({ hotel_id, check_in, check_out, meal_plan, booking_type, slot_hours, start_time, guests }) {
  const { data: hotel, error } = await supabase
    .from("hotels")
    .select("price, name, breakfast_available, breakfast_price, hourly_available, hourly_price_4h, hourly_price_6h, rooms, checkin_time, checkout_time, max_guests")
    .eq("id", hotel_id).single();
  if (error || !hotel) throw new Error("Hotel not found");

  // Independent of whatever the search page filtered on — a hotel's
  // capacity is re-checked here regardless of how the guest arrived at
  // this booking form (Section 8: submission must validate this itself,
  // not trust that search already did).
  if (guests && hotel.max_guests && Number(guests) > Number(hotel.max_guests)) {
    throw new Error(`This hotel accommodates up to ${hotel.max_guests} guests.`);
  }

  if (booking_type === "hourly") {
    if (!hotel.hourly_available) throw new Error("This hotel doesn't offer hourly bookings");
    if (![4, 6].includes(Number(slot_hours))) throw new Error("Invalid slot duration");
    if (!check_in || !start_time) throw new Error("Missing date or start time");

    const checkinDatetime = new Date(`${check_in}T${start_time}:00Z`); // UTC-anchored — see availability.js nightlyWindow() for why
    if (isNaN(checkinDatetime.getTime())) throw new Error("Invalid date or time");
    if (checkinDatetime <= new Date()) throw new Error("Start time must be in the future");

    const checkoutDatetime = new Date(checkinDatetime.getTime() + Number(slot_hours) * 60 * 60 * 1000);

    const slotPrice = Number(slot_hours) === 4 ? Number(hotel.hourly_price_4h) : Number(hotel.hourly_price_6h);
    if (!slotPrice || slotPrice <= 0) throw new Error("This time slot isn't priced for this hotel yet");

    const availability = await checkAvailability({ hotelId: hotel_id, startDatetime: checkinDatetime, endDatetime: checkoutDatetime });
    if (!availability.available) throw new Error("No rooms available for that time slot — try a different time.");

    const total_price = slotPrice;
    const { gstRate, gstAmount, grandTotal } = calculateGst(slotPrice, total_price);

    return {
      bookingType: "hourly", slotHours: Number(slot_hours), nights: null,
      checkInDate: check_in, checkOutDate: check_in, // same calendar day
      checkinDatetime: checkinDatetime.toISOString(), checkoutDatetime: checkoutDatetime.toISOString(),
      total_price, gstRate, gstAmount, grandTotal,
      mealPlan: "room_only", breakfastPricePerNight: 0,
      // The exact window rpc_create_booking will re-check under a hotel
      // row lock right before inserting — see availability.js.
      windowStart: checkinDatetime.toISOString(), windowEnd: checkoutDatetime.toISOString(),
    };
  }

  // ---- nightly (unchanged behaviour, now in one place) ----
  if (check_in < new Date().toISOString().slice(0, 10)) throw new Error("Check-in date cannot be in the past");

  const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
  if (nights < 1) throw new Error("Check-out must be after check-in");

  const wantsBreakfast = meal_plan === "breakfast_included" && hotel.breakfast_available;
  const breakfastPricePerNight = wantsBreakfast ? Number(hotel.breakfast_price || 0) : 0;
  const nightlyRate = Number(hotel.price) + breakfastPricePerNight;

  const total_price = nightlyRate * nights;
  const { gstRate, gstAmount, grandTotal } = calculateGst(nightlyRate, total_price);

  // Same window a plain nightly booking would occupy — reused so
  // rpc_create_booking's overlap check compares against exactly the
  // dates this function priced, using the hotel's own check-in/out
  // times (defaulting to 14:00/11:00, same default used everywhere
  // else) rather than re-deriving it separately in SQL.
  const { start: windowStart, end: windowEnd } = computeBookingWindow(
    { booking_type: "nightly", check_in, check_out },
    hotel,
  );

  return {
    bookingType: "nightly", slotHours: null, nights,
    checkInDate: check_in, checkOutDate: check_out,
    checkinDatetime: null, checkoutDatetime: null,
    total_price, gstRate, gstAmount, grandTotal,
    mealPlan: wantsBreakfast ? "breakfast_included" : "room_only", breakfastPricePerNight,
    windowStart: windowStart.toISOString(), windowEnd: windowEnd.toISOString(),
  };
}