import { supabase } from "../config/supabase.js";
import { audit } from "../audit.js";

export const list = async (req, res) => {
  try {
    const { status, priority, hotel_id, search } = req.query;
    let q = supabase.from("complaints").select(`*, hotels:hotel_id (id, name, city)`).order("created_at", { ascending: false });
    if (status) q = q.eq("resolution_status", status);
    if (priority) q = q.eq("priority", priority);
    if (hotel_id) q = q.eq("hotel_id", hotel_id);
    if (search) q = q.or(`issue_type.ilike.%${search}%,notes.ilike.%${search}%,guest_name.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ count: data.length, complaints: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const get = async (req, res) => {
  try {
    const { data, error } = await supabase.from("complaints").select(`*, hotels:hotel_id (id, name, city)`).eq("id", req.params.id).single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const create = async (req, res) => {
  try {
    const payload = { ...req.body, resolution_status: "open", priority: req.body.priority || "medium", complaint_id: req.body.complaint_id || `CMP-${Date.now()}` };
    const { data, error } = await supabase.from("complaints").insert([payload]).select().single();
    if (error) throw error;
    await audit({ userId: payload.user_id, action: "create", entityType: "complaint", entityId: data.id, afterData: data });
    res.status(201).json({ message: "Complaint submitted", complaint: data });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: before } = await supabase.from("complaints").select("*").eq("id", id).single();
    const { data, error } = await supabase.from("complaints").update(req.body).eq("id", id).select().single();
    if (error) throw error;
    await audit({ action: "update", entityType: "complaint", entityId: id, beforeData: before, afterData: data });
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

export const resolve = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;
    const { data, error } = await supabase.from("complaints").update({ resolution_status: "resolved", notes: resolution_notes, resolved_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    await audit({ action: "resolve", entityType: "complaint", entityId: id, afterData: data });
    res.json({ message: "Complaint resolved", complaint: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const assign = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_team_member } = req.body;
    const { data, error } = await supabase.from("complaints").update({ assigned_team_member, resolution_status: "in_progress" }).eq("id", id).select().single();
    if (error) throw error;
    res.json({ message: "Assigned", complaint: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
