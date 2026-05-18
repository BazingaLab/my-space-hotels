import { supabase } from "../config/supabase.js";

// Submit a new hotel for review
export const submitHotel = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("pending_hotels")
      .insert([req.body])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ message: "Hotel submitted for review", data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all pending hotels (admin)
export const getPendingHotels = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from("pending_hotels").select("*").order("submitted_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ count: data.length, hotels: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get owner's own submissions
export const getMySubmissions = async (req, res) => {
  try {
    const { owner_id } = req.params;
    const { data, error } = await supabase
      .from("pending_hotels")
      .select("*")
      .eq("owner_id", owner_id)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    res.json({ submissions: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve — moves to hotels table + promotes user
export const approveHotel = async (req, res) => {
  try {
    const { id } = req.params;

    // Get pending hotel
    const { data: pending, error: fetchError } = await supabase
      .from("pending_hotels").select("*").eq("id", id).single();
    if (fetchError) throw fetchError;

    // Insert into hotels table
    const { data: hotel, error: insertError } = await supabase
      .from("hotels")
      .insert([{
        name: pending.name,
        city: pending.city,
        state: pending.state,
        country: pending.country,
        description: pending.description,
        short_description: pending.short_description,
        cover_image: pending.cover_image,
        images: pending.images,
        price: pending.price,
        tag: pending.tag,
        amenities: pending.amenities,
        rooms: pending.rooms,
        owner_id: pending.owner_id,
        featured: false,
        available: true,
        rating: 0,
        review_count: 0,
      }])
      .select()
      .single();
    if (insertError) throw insertError;

    // Promote user to hotel_admin
    await supabase.from("user_roles")
      .upsert([{ user_id: pending.owner_id, role: "hotel_admin" }], { onConflict: "user_id" });

    // Update pending status
    await supabase.from("pending_hotels")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", id);

    res.json({ message: "Hotel approved and published", hotel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject
export const rejectHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { error } = await supabase
      .from("pending_hotels")
      .update({ status: "rejected", rejection_reason: reason, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    res.json({ message: "Hotel rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};