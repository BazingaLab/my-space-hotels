import { supabase } from "./config/supabase.js";
export async function audit({ userId = null, userEmail = null, action, entityType, entityId = null, beforeData = null, afterData = null, metadata = null }) {
  try {
    await supabase.from("audit_logs").insert([{
      user_id: userId, user_email: userEmail, action, entity_type: entityType,
      entity_id: entityId, before_data: beforeData, after_data: afterData, metadata,
    }]);
  } catch (err) { console.error("Audit log failed:", err.message); }
}
