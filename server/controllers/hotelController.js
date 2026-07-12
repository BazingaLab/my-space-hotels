import { supabase } from "../config/supabase.js";

// GET /api/hotels - list with optional filters
export const getHotels = async (req, res) => {
  try {
    const { city, featured, tag, minPrice, maxPrice, search, limit } = req.query;

    let query = supabase.from("hotels").select("*").eq("available", true);

    if (city) query = query.ilike("city", `%${city}%`);
    if (featured === "true") query = query.eq("featured", true);
    if (tag) query = query.eq("tag", tag);
    if (minPrice) query = query.gte("price", Number(minPrice));
    if (maxPrice) query = query.lte("price", Number(maxPrice));
    if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`);
    if (limit) query = query.limit(Number(limit));

    query = query.order("rating", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json({ count: data.length, hotels: data });
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
