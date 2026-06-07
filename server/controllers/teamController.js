import { supabase } from "../config/supabase.js";
import { audit } from "../audit.js";

// GET /api/team — full roster, with the manager each person reports to
export const list = async (req, res) => {
  try {
    const { role, search } = req.query;
    let q = supabase.from("team_members")
      .select("*, manager:reports_to(id, name, team_role)")
      .order("created_at", { ascending: false });
    if (role) q = q.eq("team_role", role);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,region.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ count: data.length, members: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/team — add a staff member
export const create = async (req, res) => {
  try {
    const { data, error } = await supabase.from("team_members").insert([req.body]).select().single();
    if (error) throw error;
    await audit({ action: "create", entityType: "team_member", entityId: data.id, afterData: data });
    res.status(201).json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// PATCH /api/team/:id — edit role, region, reporting line, active status
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from("team_members").update(req.body).eq("id", id).select().single();
    if (error) throw error;
    await audit({ action: "update", entityType: "team_member", entityId: id, afterData: data });
    res.json(data);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

// DELETE /api/team/:id
export const remove = async (req, res) => {
  try {
    const { error } = await supabase.from("team_members").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Team member removed" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/team/stats — counts per role for KPI cards
export const stats = async (req, res) => {
  try {
    const { data, error } = await supabase.from("team_members").select("team_role, is_active");
    if (error) throw error;
    const byRole = data.reduce((a, m) => { a[m.team_role] = (a[m.team_role] || 0) + 1; return a; }, {});
    res.json({ total: data.length, active: data.filter(m => m.is_active).length, byRole });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
