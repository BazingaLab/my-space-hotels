import express from "express";
import { authenticate } from "../middleware/auth.js";
import { detail, cancel } from "../controllers/guestBookingController.js";

const router = express.Router();

// Both routes need a verified session — detail() and cancel() each still
// independently confirm the booking actually belongs to req.user, so this
// is "logged in AND it's yours," not just "logged in."
router.use(authenticate);

router.get("/:id", detail);
router.post("/:id/cancel", cancel);

export default router;