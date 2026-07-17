import { supabase } from "../config/supabase.js";

// The [start, end) instant a booking actually occupies. Nightly bookings use
// the hotel's configured check-in/check-out times (defaulting to 14:00/11:00,
// same defaults used everywhere else in this app); hourly bookings use their
// exact stored timestamps.
function nightlyWindow(booking, hotel) {
  const checkinTime = hotel.checkin_time || "14:00";
  const checkoutTime = hotel.checkout_time || "11:00";
  return {
    start: new Date(`${booking.check_in}T${checkinTime}:00`),
    end: new Date(`${booking.check_out}T${checkoutTime}:00`),
  };
}
function bookingWindow(booking, hotel) {
  if (booking.booking_type === "hourly" && booking.checkin_datetime && booking.checkout_datetime) {
    return { start: new Date(booking.checkin_datetime), end: new Date(booking.checkout_datetime) };
  }
  return nightlyWindow(booking, hotel);
}

// Checks whether a new [startDatetime, endDatetime) booking fits within the
// hotel's room count, against every other non-cancelled booking whose date
// range could overlap it — a multi-night nightly stay started days earlier
// still counts if it spans the requested slot. Deliberately simple: computed
// in memory, no per-room assignment — matches the fact that nothing in this
// app tracks individual rooms, only a total count per hotel.
export async function checkAvailability({ hotelId, startDatetime, endDatetime, excludeBookingId = null }) {
  const { data: hotel, error: hotelErr } = await supabase
    .from("hotels").select("rooms, checkin_time, checkout_time").eq("id", hotelId).single();
  if (hotelErr || !hotel) throw new Error("Hotel not found");

  const startDateStr = startDatetime.toISOString().slice(0, 10);
  const endDateStr = endDatetime.toISOString().slice(0, 10);

  const { data: candidates, error } = await supabase
    .from("bookings")
    .select("id, check_in, check_out, booking_type, checkin_datetime, checkout_datetime, status")
    .eq("hotel_id", hotelId)
    .neq("status", "cancelled")
    .lte("check_in", endDateStr)
    .gte("check_out", startDateStr);
  if (error) throw error;

  const overlapping = candidates.filter(b => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    const { start, end } = bookingWindow(b, hotel);
    return start < endDatetime && end > startDatetime; // standard interval overlap test
  });

  return {
    available: overlapping.length < Number(hotel.rooms || 0),
    roomsBooked: overlapping.length,
    totalRooms: Number(hotel.rooms || 0),
  };
}