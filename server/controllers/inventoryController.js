import { supabase } from "../config/supabase.js";
import { audit } from "../audit.js";

const MAX_CALENDAR_DAYS = 92;

// GET /api/inventory/:hotelId/calendar?start_date=&end_date=
// Day-by-day total/booked/blocked/available — the same canonical
// calculation (fn_compute_availability) as everywhere else, called once
// per day (fn_availability_calendar), not a separate implementation.
export const getCalendar = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) return res.status(400).json({ message: "start_date and end_date are required" });
    if (end_date <= start_date) return res.status(400).json({ message: "end_date must be after start_date" });

    const days = (new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24);
    if (days > MAX_CALENDAR_DAYS) return res.status(400).json({ message: `Range too large — max ${MAX_CALENDAR_DAYS} days per request` });

    const { data, error } = await supabase.rpc("fn_availability_calendar", {
      p_hotel_id: hotelId, p_start_date: start_date, p_end_date: end_date,
    });
    if (error) throw error;
    res.json({ days: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/inventory/:hotelId/blocks — active blocks by default, or all
// (including deactivated, for history) with ?include_inactive=true.
export const listBlocks = async (req, res) => {
  try {
    const { hotelId } = req.params;
    let q = supabase.from("inventory_blocks").select("*").eq("hotel_id", hotelId).order("start_date", { ascending: true });
    if (req.query.include_inactive !== "true") q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ count: data.length, blocks: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/inventory/:hotelId/blocks
// Body: { start_date, end_date, quantity, reason, force }
export const createBlock = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { start_date, end_date, quantity, reason, force } = req.body;
    if (!start_date || !end_date || !quantity) {
      return res.status(400).json({ message: "start_date, end_date and quantity are required" });
    }

    const { data, error } = await supabase.rpc("rpc_create_inventory_block", {
      p_hotel_id: hotelId,
      p_start_date: start_date,
      p_end_date: end_date,
      p_quantity: Number(quantity),
      p_reason: reason || null,
      p_actor_id: req.user.id,
      p_force: !!force,
    });
    if (error) {
      if (error.code === "MSH04") return res.status(409).json({ message: error.message, code: "CAPACITY_EXCEEDED" });
      if (error.code === "MSH01") return res.status(400).json({ message: error.message });
      throw error;
    }

    await audit({
      userId: req.user.id, userEmail: req.user.email, action: "block_create", entityType: "inventory_block", entityId: data.id,
      afterData: data, metadata: { hotel_id: hotelId, start_date, end_date, quantity, reason, forced: !!force },
    });
    res.status(201).json({ message: "Inventory blocked", block: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/inventory/blocks/:blockId/deactivate ("unblock"). Soft
// delete — the row stays for the audit trail. No capacity check is
// needed: releasing inventory can never create an over-capacity state.
export const deactivateBlock = async (req, res) => {
  try {
    const { blockId } = req.params;
    const { data: block, error: fErr } = await supabase.from("inventory_blocks").select("*").eq("id", blockId).single();
    if (fErr || !block) return res.status(404).json({ message: "Block not found" });
    if (!block.is_active) return res.status(400).json({ message: "Already unblocked" });

    if (req.user.role !== "super_admin") {
      const { data: hotel } = await supabase.from("hotels").select("owner_id").eq("id", block.hotel_id).single();
      if (hotel?.owner_id !== req.user.id) return res.status(403).json({ message: "You don't have permission to manage this hotel's inventory" });
    }

    const { data, error } = await supabase.from("inventory_blocks")
      .update({ is_active: false, deactivated_by: req.user.id, deactivated_at: new Date().toISOString() })
      .eq("id", blockId).eq("is_active", true).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(400).json({ message: "Already unblocked by another request" });

    await audit({ userId: req.user.id, userEmail: req.user.email, action: "block_deactivate", entityType: "inventory_block", entityId: blockId, beforeData: block, afterData: data, metadata: { hotel_id: block.hotel_id } });
    res.json({ message: "Inventory unblocked", block: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
