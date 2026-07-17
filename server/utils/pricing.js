import { supabase } from "../config/supabase.js";
import { calculateGst } from "./gst.js";
import { checkAvailability } from "./availability.js";

// Shared by both booking-creation paths (pay-at-hotel and prepaid).
export async function priceBooking({ hotel_id, check_in, check_out, meal_plan, booking_type, slot_hours, start_time }) {
  const { data: hotel, error } = await supabase
    .from("hotels")
    .select("price, name, breakfast_available, breakfast_price, hourly_available, hourly_price_4h, hourly_price_6h, rooms, checkin_time, checkout_time")
    .eq("id", hotel_id).single();
  if (error || !hotel) throw new Error("Hotel not found");

  if (booking_type === "hourly") {
    if (!hotel.hourly_available) throw new Error("This hotel doesn't offer hourly bookings");
    if (![4, 6].includes(Number(slot_hours))) throw new Error("Invalid slot duration");
    if (!check_in || !start_time) throw new Error("Missing date or start time");

    const checkinDatetime = new Date(`${check_in}T${start_time}:00`);
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

  return {
    bookingType: "nightly", slotHours: null, nights,
    checkInDate: check_in, checkOutDate: check_out,
    checkinDatetime: null, checkoutDatetime: null,
    total_price, gstRate, gstAmount, grandTotal,
    mealPlan: wantsBreakfast ? "breakfast_included" : "room_only", breakfastPricePerNight,
  };
}