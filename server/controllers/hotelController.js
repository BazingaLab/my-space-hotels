import { supabase } from "../config/supabase.js";
import { computeAvailability, computeBookingWindow } from "../utils/availability.js";

// GET /api/hotels - list with optional filters
export const getHotels = async (req, res) => {
  try {
    const { city, featured, tag, minPrice, maxPrice, search, limit, check_in, check_out, guests } = req.query;

    let query = supabase.from("hotels").select("*").eq("available", true);

    if (city) query = query.ilike("city", `%${city}%`);
    if (featured === "true") query = query.eq("featured", true);
    if (tag) query = query.eq("tag", tag);
    if (minPrice) query = query.gte("price", Number(minPrice));
    if (maxPrice) query = query.lte("price", Number(maxPrice));
    if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`);
    // A discovery filter, not a hard capacity rule — hides hotels that
    // can't fit the party size at all. Booking submission independently
    // re-validates guest count against the specific hotel regardless.
    if (guests) query = query.gte("max_guests", Number(guests));
    // When dates are given, availability filtering below may drop some
    // candidates, so the row limit is applied after that, not here.
    if (limit && !(check_in && check_out)) query = query.limit(Number(limit));

    query = query.order("rating", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    let hotels = data;

    // A hotel showing up in search must actually have inventory for the
    // requested dates — hotel.rooms > 0 is not availability (Section 13).
    // Checked via the same canonical calculation everything else uses,
    // one call per candidate, in parallel.
    if (check_in && check_out && check_out > check_in) {
      const withAvailability = await Promise.all(hotels.map(async (h) => {
        try {
          const { start, end } = computeBookingWindow({ booking_type: "nightly", check_in, check_out }, h);
          const avail = await computeAvailability({ hotelId: h.id, windowStart: start, windowEnd: end });
          return { ...h, available_rooms: avail.available };
        } catch {
          // Don't let one hotel's lookup failure hide it from results —
          // fall back to "unknown" rather than silently excluding it.
          return { ...h, available_rooms: null };
        }
      }));
      hotels = withAvailability.filter(h => h.available_rooms === null || h.available_rooms > 0);
      if (limit) hotels = hotels.slice(0, Number(limit));
    }

    res.json({ count: hotels.length, hotels });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hotels/:id/availability — the canonical availability check,
// exposed for the guest-facing UI (hotel detail / booking page) to show
// a real number instead of hotel.rooms (Section 14: no scarcity claim
// without a real backend calculation behind it). Same calculation the
// search filter above, rpc_create_booking, the owner calendar, and the
// admin view all use.
export const getHotelAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in, check_out, booking_type, start_time, slot_hours } = req.query;
    if (!check_in) return res.status(400).json({ message: "check_in is required" });

    const { data: hotel, error: hErr } = await supabase
      .from("hotels").select("rooms, checkin_time, checkout_time").eq("id", id).single();
    if (hErr || !hotel) return res.status(404).json({ message: "Hotel not found" });

    let start, end;
    if (booking_type === "hourly") {
      if (!start_time || !slot_hours) return res.status(400).json({ message: "start_time and slot_hours are required for hourly availability" });
      start = new Date(`${check_in}T${start_time}:00`);
      end = new Date(start.getTime() + Number(slot_hours) * 60 * 60 * 1000);
    } else {
      if (!check_out) return res.status(400).json({ message: "check_out is required" });
      ({ start, end } = computeBookingWindow({ booking_type: "nightly", check_in, check_out }, hotel));
    }
    if (isNaN(start?.getTime()) || isNaN(end?.getTime()) || end <= start) {
      return res.status(400).json({ message: "Invalid dates" });
    }

    const avail = await computeAvailability({ hotelId: id, windowStart: start, windowEnd: end });
    res.json(avail);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hotels/:id
export const getHotelById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Hotel not found" });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hotels/featured/list
export const getFeaturedHotels = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .eq("featured", true)
      .eq("available", true)
      .order("rating", { ascending: false })
      .limit(6);

    if (error) throw error;
    res.json({ count: data.length, hotels: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hotels/destinations/popular
export const getPopularDestinations = async (req, res) => {
  try {
    const { data, error } = await supabase.from("hotels").select("city, state, cover_image");
    if (error) throw error;

    const grouped = {};
    data.forEach((h) => {
      if (!grouped[h.city]) {
        grouped[h.city] = { name: h.city, state: h.state, image: h.cover_image, count: 0 };
      }
      grouped[h.city].count += 1;
    });

    const destinations = Object.values(grouped).sort((a, b) => b.count - a.count).slice(0, 4);
    res.json({ destinations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/hotels/suggest?q=... — lightweight autocomplete for the search bar.
// Searches hotel name, city, and pincode in one query; returns a short
// ranked list split into direct hotel matches and deduplicated city matches.
export const suggestHotels = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) return res.json({ hotels: [], cities: [] });

    const { data, error } = await supabase
      .from("hotels")
      .select("id, name, city, state, pincode")
      .eq("available", true)
      .or(`name.ilike.%${q}%,city.ilike.%${q}%,pincode.ilike.%${q}%`)
      .limit(20);
    if (error) throw error;

    const qLower = q.toLowerCase();

    // Hotels whose NAME matches — these navigate straight to the hotel
    const hotels = data
      .filter(h => h.name?.toLowerCase().includes(qLower))
      .slice(0, 5)
      .map(h => ({ id: h.id, name: h.name, city: h.city }));

    // Cities matching by name or pincode — deduplicated, these run a city search
    const cityMap = {};
    data.forEach(h => {
      const matches = h.city?.toLowerCase().includes(qLower) || h.pincode?.includes(q);
      if (matches && h.city && !cityMap[h.city]) cityMap[h.city] = { city: h.city, state: h.state };
    });
    const cities = Object.values(cityMap).slice(0, 5);

    res.json({ hotels, cities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/hotels  (admin / seed)
export const createHotel = async (req, res) => {
  try {
    const { data, error } = await supabase.from("hotels").insert([req.body]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
