import express from "express";
import { authenticate, requireRole, requireHotelOwnership } from "../middleware/auth.js";
import { listWallets, getHotelWallet, settle, summary, commissionReport, getGoodBizEligibility } from "../controllers/walletController.js";
const router = express.Router();

router.use(authenticate);

// Cross-hotel views and the settlement (payout) action move or reveal
// money across the whole platform — super_admin only.
router.get("/", requireRole("super_admin"), listWallets);
router.get("/summary", requireRole("super_admin"), summary);
router.get("/commissions", requireRole("super_admin"), commissionReport);
router.post("/settle", requireRole("super_admin"), settle);

// Single-hotel views — the owning hotel_admin (their own hotel only) or
// any super_admin.
router.get("/eligibility/:hotelId", requireRole("super_admin", "hotel_admin"), requireHotelOwnership("hotelId"), getGoodBizEligibility);
router.get("/hotel/:hotelId", requireRole("super_admin", "hotel_admin"), requireHotelOwnership("hotelId"), getHotelWallet);

export default router;