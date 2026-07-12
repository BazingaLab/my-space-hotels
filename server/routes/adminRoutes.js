import express from "express";
import { authenticate, requireRole, requireHotelOwnership } from "../middleware/auth.js";
import {
  getUserRole, promoteUser, getAllUsers,
  adminGetHotels, adminCreateHotel, adminUpdateHotel, adminDeleteHotel, resetOwnerPassword,
  adminGetBookings, hotelAdminGetBookings,
  adminGetAnalytics,
} from "../controllers/adminController.js";

const router = express.Router();

// Every route requires a verified session at minimum.
router.use(authenticate);

// Any logged-in user may check their own role.
router.get("/role/:user_id", getUserRole);

// super_admin only — user management, hotel creation/deletion, cross-hotel views.
router.post("/promote", requireRole("super_admin"), promoteUser);
router.get("/users", requireRole("super_admin"), getAllUsers);
router.post("/hotels", requireRole("super_admin"), adminCreateHotel);
router.post("/hotels/:id/reset-owner-password", requireRole("super_admin"), resetOwnerPassword);
router.delete("/hotels/:id", requireRole("super_admin"), adminDeleteHotel);
router.get("/bookings", requireRole("super_admin"), adminGetBookings);
router.get("/analytics", requireRole("super_admin"), adminGetAnalytics);

// super_admin (any hotel) or hotel_admin (own hotel only) — the controller
// itself further scopes what data comes back for hotel_admin.
router.get("/hotels", requireRole("super_admin", "hotel_admin"), adminGetHotels);
router.put("/hotels/:id", requireRole("super_admin", "hotel_admin"), requireHotelOwnership(), adminUpdateHotel);
router.get("/bookings/owner/:owner_id", requireRole("super_admin", "hotel_admin"), hotelAdminGetBookings);

export default router;