import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { submitHotel, getPendingHotels, getMySubmissions, approveHotel, rejectHotel } from "../controllers/pendingController.js";

const router = express.Router();

router.use(authenticate);

// Any logged-in user may submit a property for review (first-time
// prospective owners aren't hotel_admin yet — that role is only granted
// on approval) and check their own submissions' status.
router.post("/", submitHotel);
router.get("/mine/:owner_id", getMySubmissions);

// Reviewing the queue and approving/rejecting are super_admin only — an
// owner must never be able to approve their own submission.
router.get("/", requireRole("super_admin"), getPendingHotels);
router.post("/:id/approve", requireRole("super_admin"), approveHotel);
router.post("/:id/reject", requireRole("super_admin"), rejectHotel);

export default router;