import { supabase } from "../config/supabase.js";
import { ensureWallet } from "./walletController.js";

// GET /api/admin/role/:user_id
// Protected by `authenticate` only (any logged-in user may check a role) —
// but always returns the AUTHENTICATED caller's own role, never whatever
// :user_id happens to be in the URL. There's no legitimate case in this app
// for checking someone else's role, and trusting the URL param was exactly
// the original vulnerability here.
export const getUserRole = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", req.user.id)
      .single();
    if (error) return res.json({ role: "guest" });
    res.json({ role: data.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/promote — super_admin only (enforced in adminRoutes.js).
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

// GET /api/admin/users — super_admin only.
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

// GET /api/admin/hotels
// super_admin: every hotel. hotel_admin: only hotels they own — this is what
// makes it safe for BOTH AdminHotels.jsx (super_admin) and
// HotelPortalContext.jsx (hotel_admin) to keep sharing this one endpoint.
export const adminGetHotels = async (req, res) => {
  try {
    let query = supabase.from("hotels").select("*").order("created_at", { ascending: false });
    if (req.user.role !== "super_admin") {
      query = query.eq("owner_id", req.user.id);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json({ count: data.length, hotels: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate a readable temporary password — used only when the admin doesn't
// type one in themselves.
function genTempPassword() {
  const part = Math.random().toString(36).slice(-6);
  return `MSH-${part}${Math.floor(10 + Math.random() * 89)}`;
}

// Provision (or find) a hotel_admin login for the owner email.
async function provisionOwnerAccount(ownerEmail, customPassword) {
  const email = ownerEmail.toLowerCase().trim();
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find(u => (u.email || "").toLowerCase() === email);

  let ownerId, credentials = null;
  if (existing) {
    ownerId = existing.id;
    if (customPassword) {
      const { error: pwErr } = await supabase.auth.admin.updateUserById(existing.id, { password: customPassword });
      if (pwErr) throw pwErr;
      credentials = { email, tempPassword: customPassword };
    }
  } else {
    const password = customPassword || genTempPassword();
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (cErr) throw cErr;
    ownerId = created.user.id;
    credentials = { email, tempPassword: password };
  }

  await supabase.from("user_roles").upsert([{ user_id: ownerId, role: "hotel_admin" }], { onConflict: "user_id" });
  return { ownerId, credentials };
}

// Fields only a super_admin may set — stripped from the request body for
// hotel_admin callers before anything else touches it. Without this, an
// owner editing their own property through PropertyManager.jsx could also
// reassign who owns it, reset their own commission rate, or rewrite the
// legal/tax details on file — ownership of the hotel row alone isn't
// enough authorization for those specific fields.
const SUPER_ADMIN_ONLY_FIELDS = [
  "owner_id", "owner_email", "owner_password", "commission_percent",
  "agreement_start_date", "agreement_end_date", "gst_number", "pan_number",
];
function stripAdminOnlyFields(body, role) {
  if (role === "super_admin") return body;
  const clean = { ...body };
  for (const f of SUPER_ADMIN_ONLY_FIELDS) delete clean[f];
  return clean;
}

// POST /api/admin/hotels — super_admin only (enforced in adminRoutes.js).
export const adminCreateHotel = async (req, res) => {
  try {
    const hotel = { ...req.body, images: req.body.images || [], amenities: req.body.amenities || [] };
    const ownerPassword = hotel.owner_password;
    delete hotel.owner_password; // never persisted onto the hotels row

    let credentials = null;
    let provisioningError = null;
    if (hotel.owner_email) {
      try {
        const { ownerId, credentials: creds } = await provisionOwnerAccount(hotel.owner_email, ownerPassword);
        hotel.owner_id = ownerId;
        credentials = creds;
      } catch (e) {
        console.error("Owner provisioning failed:", e.message);
        provisioningError = e.message;
      }
    }

    const { data, error } = await supabase.from("hotels").insert([hotel]).select().single();
    if (error) throw error;
    try { await ensureWallet(data.id); } catch (e) { console.error("Wallet create failed:", e.message); }

    res.status(201).json({ ...data, ownerCredentials: credentials, ownerProvisioningError: provisioningError });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/admin/hotels/:id
// super_admin: full access to any hotel. hotel_admin: only their own hotel
// (enforced by requireHotelOwnership in adminRoutes.js), and only to
// non-financial/non-account fields — an owner can update their listing,
// not their own commission rate or who owns it.
export const adminUpdateHotel = async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase.from("hotels").select("owner_id, owner_email").eq("id", req.params.id).single();
    if (fetchErr) throw fetchErr;

    const patch = { ...stripAdminOnlyFields(req.body, req.user.role), updated_at: new Date().toISOString() };
    const ownerPassword = req.user.role === "super_admin" ? req.body.owner_password : null;

    let credentials = null;
    let provisioningError = null;

    // owner_email is stripped out already for hotel_admin, so this branch
    // only ever actually runs for super_admin.
    const emailChanged = patch.owner_email && patch.owner_email !== existing.owner_email;
    if (patch.owner_email && (!existing.owner_id || emailChanged || ownerPassword)) {
      try {
        const { ownerId, credentials: creds } = await provisionOwnerAccount(patch.owner_email, ownerPassword);
        patch.owner_id = ownerId;
        credentials = creds;
      } catch (e) {
        console.error("Owner provisioning failed:", e.message);
        provisioningError = e.message;
      }
    }

    const { data, error } = await supabase.from("hotels").update(patch).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json({ ...data, ownerCredentials: credentials, ownerProvisioningError: provisioningError });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST /api/admin/hotels/:id/reset-owner-password — super_admin only.
export const resetOwnerPassword = async (req, res) => {
  try {
    const { data: hotel, error: hErr } = await supabase.from("hotels").select("owner_id, owner_email").eq("id", req.params.id).single();
    if (hErr) throw hErr;
    if (!hotel.owner_id) return res.status(400).json({ message: "This hotel has no owner account yet — set an owner_email and save to create one" });

    const password = req.body?.password || genTempPassword();
    const { error } = await supabase.auth.admin.updateUserById(hotel.owner_id, { password });
    if (error) throw error;

    res.json({ email: hotel.owner_email, tempPassword: password });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/admin/hotels/:id — super_admin only.
export const adminDeleteHotel = async (req, res) => {
  try {
    const { error } = await supabase.from("hotels").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Hotel deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/bookings — every booking across every hotel — super_admin only.
export const adminGetBookings = async (req, res) => {
  try {
    const { data, error } = await supabase.from("bookings").select("*, hotels!hotel_id(name, city, cover_image)").order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, bookings: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/bookings/owner/:owner_id
// hotel_admin can only ever see their OWN bookings — the URL param is
// ignored in favor of the verified caller's id unless they're super_admin,
// who may still look up any owner's bookings by id.
export const hotelAdminGetBookings = async (req, res) => {
  try {
    const owner_id = req.user.role === "super_admin" ? req.params.owner_id : req.user.id;
    const { data: hotels, error: hotelsError } = await supabase.from("hotels").select("id").eq("owner_id", owner_id);
    if (hotelsError) throw hotelsError;
    const hotelIds = hotels.map(h => h.id);
    if (hotelIds.length === 0) return res.json({ count: 0, bookings: [] });
    const { data, error } = await supabase.from("bookings").select("*, hotels!hotel_id(name, city, cover_image)").in("hotel_id", hotelIds).order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, bookings: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/analytics — super_admin only.
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
      summary: {
        totalRevenue,
        totalBookings: bookings.length,
        totalHotels: hotels.length,
        avgNights: bookings.length ? (bookings.reduce((s, b) => s + b.nights, 0) / bookings.length).toFixed(1) : 0,
      },
      monthlyRevenue,
      bookingsPerHotel,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};