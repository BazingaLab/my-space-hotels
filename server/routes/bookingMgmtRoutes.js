import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { list, cancel, transfer, update, refund, stats, checkIn, checkOut, markNoShow } from "../controllers/bookingMgmtController.js";
const router = express.Router();

router.use(authenticate);

// Cross-hotel listing/reporting and cross-hotel actions (transfer moves
// money between two arbitrary hotels' wallets; update edits payment
// status/mode) — super_admin only. Only ever called from
// AdminBookingLifecycle.jsx, which is itself a super_admin-only route.
router.get("/", requireRole("super_admin"), list);
router.get("/stats", requireRole("super_admin"), stats);
router.post("/:id/transfer", requireRole("super_admin"), transfer);
router.patch("/:id", requireRole("super_admin"), update);

// Per-booking front-desk actions — super_admin (any hotel) or hotel_admin
// (their own hotel's bookings only). The route can't check ownership by
// URL param since only a booking id is present, not a hotel id — each
// controller looks up the booking's hotel and verifies ownership itself
// (see canAccessBooking() in bookingMgmtController.js) once the booking
// row is in hand, rather than trusting the id in the URL.
router.post("/:id/cancel", requireRole("super_admin", "hotel_admin"), cancel);
router.post("/:id/checkin", requireRole("super_admin", "hotel_admin"), checkIn);
router.post("/:id/checkout", requireRole("super_admin", "hotel_admin"), checkOut);
router.post("/:id/no-show", requireRole("super_admin", "hotel_admin"), markNoShow);
router.post("/:id/refund", requireRole("super_admin", "hotel_admin"), refund);

export default router;