import { supabase } from "../config/supabase.js";

// The [start, end) instant a booking actually occupies. Nightly bookings use
// the hotel's configured check-in/check-out times (defaulting to 14:00/11:00,
// same defaults used everywhere else in this app); hourly bookings use their
// exact stored timestamps.
function nightlyWindow(booking, hotel) {
  // Postgres `time` columns round-trip through PostgREST as "HH:MM:SS",
  // not the "HH:MM" the fallback defaults below use — slice(0, 5) so both
  // shapes end up as "HH:MM" before the ":00" seconds suffix is appended.
  const checkinTime = (hotel.checkin_time || "14:00").slice(0, 5);
  const checkoutTime = (hotel.checkout_time || "11:00").slice(0, 5);
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

// Exported so pricing.js can compute the SAME [start, end) window for a
// booking that hasn't been inserted yet, and pass it to
// rpc_create_booking — the atomic, DB-level version of this same
// overlap check (see 21-financial-integrity.sql). Keeping one
// definition of "what window does this booking occupy" means the
// pre-flight check below and the authoritative check at insert time
// can never quietly disagree.
export function computeBookingWindow(booking, hotel) {
  return bookingWindow(booking, hotel);
}

// The canonical availability calculation lives in Postgres
// (fn_compute_availability, server/db/24-inventory-blocking.sql) — the
// SAME function rpc_create_booking checks atomically at insert time,
// the owner calendar renders, and the admin view reads. This is a thin
// wrapper so every other piece of Node code (hotelController's search
// filter and availability endpoint, pricing.js's pre-flight hourly
// check) goes through that one function instead of each keeping its
// own copy of the overlap math.
export async function computeAvailability({ hotelId, windowStart, windowEnd, excludeBookingId = null }) {
  const { data, error } = await supabase.rpc("fn_compute_availability", {
    p_hotel_id: hotelId,
    p_window_start: windowStart instanceof Date ? windowStart.toISOString() : windowStart,
    p_window_end: windowEnd instanceof Date ? windowEnd.toISOString() : windowEnd,
    p_exclude_booking_id: excludeBookingId,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Hotel not found");
  return {
    total: row.total_rooms,
    booked: row.booked,
    blocked: row.blocked,
    // Guest-facing callers should never see/act on a negative number —
    // an intentionally over-blocked hotel is a real state (Section 5),
    // just not one a guest can book into.
    available: Math.max(row.available, 0),
    rawAvailable: row.available,
  };
}

// Back-compat shape for pricing.js's hourly pre-flight check.
export async function checkAvailability({ hotelId, startDatetime, endDatetime, excludeBookingId = null }) {
  const avail = await computeAvailability({ hotelId, windowStart: startDatetime, windowEnd: endDatetime, excludeBookingId });
  return {
    available: avail.available > 0,
    roomsBooked: avail.booked + avail.blocked,
    totalRooms: avail.total,
  };
}