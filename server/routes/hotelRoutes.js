import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
  getHotels,
  getHotelById,
  getFeaturedHotels,
  getPopularDestinations,
  suggestHotels,
  createHotel,
  getHotelAvailability,
} from "../controllers/hotelController.js";

const router = express.Router();

router.get("/", getHotels);
router.get("/featured/list", getFeaturedHotels);
router.get("/destinations/popular", getPopularDestinations);
router.get("/suggest", suggestHotels);
router.get("/:id/availability", getHotelAvailability);
router.get("/:id", getHotelById);

// Direct hotel creation bypasses onboarding (owner provisioning, KYC,
// pending-review) entirely — real hotel creation goes through
// /api/admin/hotels (adminCreateHotel) or the pending-hotel approval
// flow. This endpoint is unused by the current frontend; still gate it
// to super_admin rather than leave a live, unauthenticated way to
// insert arbitrary hotel rows.
router.post("/", authenticate, requireRole("super_admin"), createHotel);

export default router;