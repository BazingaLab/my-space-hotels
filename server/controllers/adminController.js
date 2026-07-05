import { supabase } from "../config/supabase.js";
import { ensureWallet } from "./walletController.js";

// GET /api/admin/role/:user_id
// Role lookup uses the service_role key so it bypasses RLS — the frontend
// must never query user_roles directly (RLS returns 500). Defaults to "guest"
// if the user has no row, so unknown users are treated as least-privileged.
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

// POST /api/admin/promote
// Promote/demote a user. Only hotel_admin or guest can be set here
// (super_admin is granted manually in the DB for safety). When promoting to
// hotel_admin with a hotel_id, that hotel is assigned to them as owner.
export const promoteUser = async (req, res) => {
  try {
    const { user_id, role, hotel_id } = req.body;
    if (!["hotel_admin", "guest"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    // upsert on user_id so a user only ever has one role row
    const { data, error } = await supabase
      .from("user_roles")
      .upsert([{ user_id, role }], { onConflict: "user_id" })
      .select().single();
    if (error) throw error;
    // Link the hotel to its new owner
    if (hotel_id && role === "hotel_admin") {
      await supabase.from("hotels").update({ owner_id: user_id }).eq("id", hotel_id);
    }
    res.json({ message: `User promoted to ${role}`, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/users
// Auth users live in auth.users (only reachable via auth.admin), roles live in
// user_roles. We fetch both and merge them so the admin sees email + role together.
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

// GET /api/admin/hotels — all hotels, newest first
export const adminGetHotels = async (req, res) => {
  try {
    const { data, error } = await supabase.from("hotels").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, hotels: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate a readable temporary password for first-time owner login.
function genTempPassword() {
  const part = Math.random().toString(36).slice(-6);
  return `MSH-${part}${Math.floor(10 + Math.random() * 89)}`;
}

// Provision (or find) a hotel_admin login for the owner email.
// Returns { ownerId, credentials } where credentials is non-null only when a
// brand-new account was created (so we can show the temp password once).
async function provisionOwnerAccount(ownerEmail) {
  const email = ownerEmail.toLowerCase().trim();

  // Is there already an auth user with this email?
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find(u => (u.email || "").toLowerCase() === email);

  let ownerId, credentials = null;
  if (existing) {
    ownerId = existing.id;
  } else {
    // Create a new confirmed auth user with a temp password
    const tempPassword = genTempPassword();
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true,
    });
    if (cErr) throw cErr;
    ownerId = created.user.id;
    credentials = { email, tempPassword };
  }

  // Ensure they have the hotel_admin role (upsert so we never duplicate)
  await supabase.from("user_roles").upsert([{ user_id: ownerId, role: "hotel_admin" }], { onConflict: "user_id" });
  return { ownerId, credentials };
}

// POST /api/admin/hotels
// Creates a hotel + wallet. If an owner_email is supplied, also provisions a
// hotel_admin login for that owner and links the hotel to them. Returns any
// generated credentials so the admin can hand them to the owner.
export const adminCreateHotel = async (req, res) => {
  try {
    const hotel = { ...req.body, images: req.body.images || [], amenities: req.body.amenities || [] };

    // Provision owner login first so we can stamp owner_id onto the hotel
    let credentials = null;
    let provisioningError = null;
    if (hotel.owner_email) {
      try {
        const { ownerId, credentials: creds } = await provisionOwnerAccount(hotel.owner_email);
        hotel.owner_id = ownerId;
        credentials = creds;
      } catch (e) {
        console.error("Owner provisioning failed:", e.message);
        provisioningError = e.message;
        // don't block hotel creation if owner provisioning fails
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

// PUT /api/admin/hotels/:id — full update; stamps updated_at.
// Also provisions the owner's login if the hotel doesn't have one yet (or the
// owner_email changed) — covers hotels created before owner_email was set,
// or where the first provisioning attempt failed silently.
export const adminUpdateHotel = async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase.from("hotels").select("owner_id, owner_email").eq("id", req.params.id).single();
    if (fetchErr) throw fetchErr;

    const patch = { ...req.body, updated_at: new Date().toISOString() };
    let credentials = null;
    let provisioningError = null;

    const emailChanged = patch.owner_email && patch.owner_email !== existing.owner_email;
    if (patch.owner_email && (!existing.owner_id || emailChanged)) {
      try {
        const { ownerId, credentials: creds } = await provisionOwnerAccount(patch.owner_email);
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

// POST /api/admin/hotels/:id/reset-owner-password
// Generates a fresh temp password for a hotel's existing owner account —
// for when the one-time credentials box was closed before anyone copied it.
export const resetOwnerPassword = async (req, res) => {
  try {
    const { data: hotel, error: hErr } = await supabase.from("hotels").select("owner_id, owner_email").eq("id", req.params.id).single();
    if (hErr) throw hErr;
    if (!hotel.owner_id) return res.status(400).json({ message: "This hotel has no owner account yet — set an owner_email and save to create one" });

    const tempPassword = genTempPassword();
    const { error } = await supabase.auth.admin.updateUserById(hotel.owner_id, { password: tempPassword });
    if (error) throw error;

    res.json({ email: hotel.owner_email, tempPassword });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/admin/hotels/:id
export const adminDeleteHotel = async (req, res) => {
  try {
    const { error } = await supabase.from("hotels").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Hotel deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/bookings — all bookings with their hotel info joined
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
// A hotel owner should only see bookings for hotels they own. We first find
// their hotel IDs, then fetch bookings limited to those — never all bookings.
export const hotelAdminGetBookings = async (req, res) => {
  try {
    const { owner_id } = req.params;
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

// GET /api/admin/analytics
// Computes dashboard figures in JS (small dataset, fine to aggregate in memory).
// Only "confirmed" bookings count toward revenue; cancelled/pending are excluded.
export const adminGetAnalytics = async (req, res) => {
  try {
    // Pull just the columns we need from both tables in parallel
    const [bookingsRes, hotelsRes] = await Promise.all([
      supabase.from("bookings").select("total_price, created_at, status, nights, hotel_id"),
      supabase.from("hotels").select("id, name, city, tag"),
    ]);
    if (bookingsRes.error) throw bookingsRes.error;
    if (hotelsRes.error) throw hotelsRes.error;
    const bookings = bookingsRes.data;
    const hotels = hotelsRes.data;

    const totalRevenue = bookings.filter(b => b.status === "confirmed").reduce((sum, b) => sum + Number(b.total_price), 0);

    // Build last 6 months of revenue (oldest -> newest) for the bar chart
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

    // Per-hotel booking counts + confirmed revenue, ranked high -> low
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