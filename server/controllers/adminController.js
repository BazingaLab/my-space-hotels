import { supabase } from "../config/supabase.js";

export const getUserRole = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user_id)
      .single();
    if (error) return res.json({ role: "guest" });
    res.json({ role: data.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const promoteUser = async (req, res) => {
  try {
    const { user_id, role, hotel_id } = req.body;
    if (!["hotel_admin", "guest"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const { data, error } = await supabase
      .from("user_roles")
      .upsert([{ user_id, role }], { onConflict: "user_id" })
      .select().single();
    if (error) throw error;
    if (hotel_id && role === "hotel_admin") {
      await supabase.from("hotels").update({ owner_id: user_id }).eq("id", hotel_id);
    }
    res.json({ message: `User promoted to ${role}`, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { data: roles, error } = await supabase.from("user_roles").select("*");
    if (error) throw error;
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;
    const merged = users.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || "",
      created_at: u.created_at,
      role: roles.find(r => r.user_id === u.id)?.role || "guest",
    }));
    res.json({ users: merged });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminGetHotels = async (req, res) => {
  try {
    const { data, error } = await supabase.from("hotels").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, hotels: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminCreateHotel = async (req, res) => {
  try {
    const hotel = { ...req.body, images: req.body.images || [], amenities: req.body.amenities || [] };
    const { data, error } = await supabase.from("hotels").insert([hotel]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const adminUpdateHotel = async (req, res) => {
  try {
    const { data, error } = await supabase.from("hotels").update({ ...req.body, updated_at: new Date().toISOString() }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const adminDeleteHotel = async (req, res) => {
  try {
    const { error } = await supabase.from("hotels").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Hotel deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminGetBookings = async (req, res) => {
  try {
    const { data, error } = await supabase.from("bookings").select("*, hotels(name, city, cover_image)").order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, bookings: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const hotelAdminGetBookings = async (req, res) => {
  try {
    const { owner_id } = req.params;
    const { data: hotels, error: hotelsError } = await supabase.from("hotels").select("id").eq("owner_id", owner_id);
    if (hotelsError) throw hotelsError;
    const hotelIds = hotels.map(h => h.id);
    if (hotelIds.length === 0) return res.json({ count: 0, bookings: [] });
    const { data, error } = await supabase.from("bookings").select("*, hotels(name, city, cover_image)").in("hotel_id", hotelIds).order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, bookings: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const adminGetAnalytics = async (req, res) => {
  try {
    const [bookingsRes, hotelsRes] = await Promise.all([
      supabase.from("bookings").select("total_price, created_at, status, nights, hotel_id"),
      supabase.from("hotels").select("id, name, city, tag"),
    ]);
    if (bookingsRes.error) throw bookingsRes.error;
    if (hotelsRes.error) throw hotelsRes.error;
    const bookings = bookingsRes.data;
    const hotels = hotelsRes.data;
    const totalRevenue = bookings.filter(b => b.status === "confirmed").reduce((sum, b) => sum + Number(b.total_price), 0);
    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.toLocaleString("default", { month: "short" });
      const revenue = bookings.filter(b => {
        const bd = new Date(b.created_at);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear() && b.status === "confirmed";
      }).reduce((sum, b) => sum + Number(b.total_price), 0);
      monthlyRevenue.push({ month, revenue });
    }
    const bookingsPerHotel = hotels.map(h => ({
      name: h.name, city: h.city,
      bookings: bookings.filter(b => b.hotel_id === h.id).length,
      revenue: bookings.filter(b => b.hotel_id === h.id && b.status === "confirmed").reduce((sum, b) => sum + Number(b.total_price), 0),
    })).sort((a, b) => b.revenue - a.revenue);
    res.json({
      summary: { totalRevenue, totalBookings: bookings.length, totalHotels: hotels.length, avgNights: bookings.length ? (bookings.reduce((s, b) => s + b.nights, 0) / bookings.length).toFixed(1) : 0 },
      monthlyRevenue, bookingsPerHotel,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};