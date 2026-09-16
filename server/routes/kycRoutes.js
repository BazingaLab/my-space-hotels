import express from "express";
import { authenticate, requireRole, requireHotelOwnership } from "../middleware/auth.js";
import { list, submit, verify, pendingKyc } from "../controllers/kycController.js";
const router = express.Router();

router.use(authenticate);

// Admin-wide review queue and verify/reject actions — super_admin only.
router.get("/pending", requireRole("super_admin"), pendingKyc);
router.patch("/:id/verify", requireRole("super_admin"), verify);

// Hotel-scoped — the owning hotel_admin (their own hotel only) or any
// super_admin. requireHotelOwnership() falls back to req.body.hotel_id
// for the POST, since that route has no :hotelId param.
router.get("/hotel/:hotelId", requireRole("super_admin", "hotel_admin"), requireHotelOwnership("hotelId"), list);
router.post("/", requireRole("super_admin", "hotel_admin"), requireHotelOwnership(), submit);

export default router;