import { supabase } from "../config/supabase.js";
import { audit } from "../audit.js";

// GET /api/kyc/hotel/:hotelId — all docs for a hotel
export const list = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("hotel_id", req.params.hotelId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ count: data.length, documents: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/kyc — owner submits a document record after uploading to storage
export const submit = async (req, res) => {
  try {
    const { hotel_id, owner_id, doc_type, file_url, file_name, file_size } = req.body;
    if (!hotel_id || !doc_type || !file_url) return res.status(400).json({ message: "hotel_id, doc_type, file_url required" });

    // Upsert — one doc per type per hotel (replace if re-uploading same type)
    const { data: existing } = await supabase
      .from("kyc_documents").select("id")
      .eq("hotel_id", hotel_id).eq("doc_type", doc_type).single();

    let data, error;
    if (existing) {
      ({ data, error } = await supabase.from("kyc_documents")
        .update({ file_url, file_name, file_size, status: "pending", rejection_reason: null, reviewed_at: null })
        .eq("id", existing.id).select().single());
    } else {
      ({ data, error } = await supabase.from("kyc_documents")
        .insert([{ hotel_id, owner_id, doc_type, file_url, file_name, file_size }])
        .select().single());
    }
    if (error) throw error;

    // Update hotel KYC status to pending (docs submitted, awaiting admin review)
    await supabase.from("hotels").update({ kyc_status: "pending" }).eq("id", hotel_id);

    res.status(201).json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// PATCH /api/kyc/:id/verify — admin marks a doc as verified or rejected
export const verify = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason, reviewed_by } = req.body;
    if (!["verified", "rejected"].includes(status)) return res.status(400).json({ message: "status must be verified or rejected" });

    const { data, error } = await supabase.from("kyc_documents")
      .update({ status, rejection_reason: rejection_reason || null, reviewed_by, reviewed_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) throw error;

    // Recompute hotel KYC status based on all docs
    const { data: allDocs } = await supabase.from("kyc_documents").select("status").eq("hotel_id", data.hotel_id);
    const statuses = (allDocs || []).map(d => d.status);
    let hotelKyc = "pending";
    if (statuses.every(s => s === "verified")) hotelKyc = "verified";
    else if (statuses.some(s => s === "rejected")) hotelKyc = "rejected";
    await supabase.from("hotels").update({ kyc_status: hotelKyc }).eq("id", data.hotel_id);

    await audit({ action: "kyc_review", entityType: "kyc_document", entityId: id, afterData: data, metadata: { status, reviewed_by } });
    res.json(data);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// GET /api/kyc/pending — admin view of all hotels with pending KYC
export const pendingKyc = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("hotels")
      .select("id, name, city, owner_name, owner_email, kyc_status")
      .in("kyc_status", ["pending", "rejected"])
      .order("name");
    if (error) throw error;
    res.json({ count: data.length, hotels: data });
  } catch (e) { res.status(500).json({ message: e.message }); }
};