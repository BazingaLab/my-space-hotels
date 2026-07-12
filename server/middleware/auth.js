import { supabase } from "../config/supabase.js";

// Verifies the Supabase access token sent as "Authorization: Bearer <token>"
// — not a client-supplied user_id, which is what every route trusted before.
// On success, attaches { id, email, role } to req.user for downstream checks.
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing or invalid Authorization header" });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ message: "Invalid or expired session" });

    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
    req.user = { id: user.id, email: user.email, role: roleRow?.role || "guest" };
    next();
  } catch (e) {
    res.status(401).json({ message: "Authentication failed" });
  }
}

// Gate a route to specific roles. Must run after authenticate().
// Usage: requireRole("super_admin") or requireRole("super_admin", "hotel_admin")
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You don't have permission to do that" });
    }
    next();
  };
}

// For hotel-scoped routes: confirms the authenticated user actually owns the
// hotel referenced by the request (checks req.params[paramName], then
// req.params.id, then req.body.hotel_id, in that order). super_admin always
// passes; hotel_admin must own the specific hotel; anyone else is rejected.
export function requireHotelOwnership(paramName = "hotelId") {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role === "super_admin") return next();
    if (req.user.role !== "hotel_admin") return res.status(403).json({ message: "You don't have permission to do that" });

    const hotelId = req.params[paramName] || req.params.id || req.body.hotel_id;
    if (!hotelId) return res.status(400).json({ message: "Missing hotel id" });

    const { data: hotel, error } = await supabase.from("hotels").select("owner_id").eq("id", hotelId).single();
    if (error || !hotel) return res.status(404).json({ message: "Hotel not found" });
    if (hotel.owner_id !== req.user.id) return res.status(403).json({ message: "You don't own this hotel" });

    next();
  };
}