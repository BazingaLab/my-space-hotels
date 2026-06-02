import { supabase } from "../config/supabase.js";
import { audit } from "../audit.js";

// Classification thresholds (by total bookings)
function classify(totalBookings, totalSpent) {
  if (totalBookings >= 10 || totalSpent >= 100000) return "Premium";
  if (totalBookings >= 3 || totalSpent >= 25000) return "Regular";
  return "Basic";
}

// Upsert a customer from a booking and refresh their rollup stats.
// Exported so bookingController can call it.
export async function syncCustomerFromBooking(booking) {
  if (!booking?.guest_email) return null;
  const email = booking.guest_email.toLowerCase().trim();

  // find existing
  const { data: existing } = await supabase
    .from("customers").select("*").eq("email", email).single();

  // recompute stats from all bookings with this email
  const { data: allBookings } = await supabase
    .from("bookings").select("total_price, status").eq("guest_email", booking.guest_email);

  const valid = (allBookings || []).filter(b => b.status !== "cancelled");
  const totalBookings = valid.length;
  const totalSpent = valid.reduce((s, b) => s + Number(b.total_price || 0), 0);
  const classification = classify(totalBookings, totalSpent);
  const loyaltyPoints = Math.floor(totalSpent / 100); // 1 pt per ₹100

  if (existing) {
    const { data } = await supabase.from("customers").update({
      name: booking.guest_name || existing.name,
      phone: booking.guest_phone || existing.phone,
      total_bookings: totalBookings,
      total_spent: totalSpent,
      classification,
      loyalty_points: loyaltyPoints,
    }).eq("id", existing.id).select().single();
    return data;
  } else {
    const { data } = await supabase.from("customers").insert([{
      name: booking.guest_name,
      email,
      phone: booking.guest_phone,
      total_bookings: totalBookings,
      total_spent: totalSpent,
      classification,
      loyalty_points: loyaltyPoints,
    }]).select().single();
    return data;
  }
}

// GET /api/customers
export const list = async (req, res) => {
  try {
    const { classification, search } = req.query;
    let q = supabase.from("customers").select("*").order("total_spent", { ascending: false });
    if (classification) q = q.eq("classification", classification);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ count: data.length, customers: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/customers/:id  (with booking history)
export const get = async (req, res) => {
  try {
    const { data: customer, error } = await supabase
      .from("customers").select("*").eq("id", req.params.id).single();
    if (error) throw error;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, hotels(name, city)")
      .ilike("guest_email", customer.email)
      .order("created_at", { ascending: false });

    res.json({ ...customer, bookings: bookings || [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/customers/:id  (edit profile, manual loyalty adjust, ID proof)
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: before } = await supabase.from("customers").select("*").eq("id", id).single();
    const { data, error } = await supabase.from("customers").update(req.body).eq("id", id).select().single();
    if (error) throw error;
    await audit({ action: "update", entityType: "customer", entityId: id, beforeData: before, afterData: data });
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// GET /api/customers/stats/summary
export const stats = async (req, res) => {
  try {
    const { data, error } = await supabase.from("customers").select("classification, total_spent, loyalty_points");
    if (error) throw error;
    const byClass = data.reduce((a, c) => { a[c.classification] = (a[c.classification] || 0) + 1; return a; }, {});
    const totalRevenue = data.reduce((s, c) => s + Number(c.total_spent || 0), 0);
    const totalPoints = data.reduce((s, c) => s + Number(c.loyalty_points || 0), 0);
    res.json({ total: data.length, byClass, totalRevenue, totalPoints });
  } catch (e) { res.status(500).json({ message: e.message }); }
};