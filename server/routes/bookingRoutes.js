import express from "express";
import { createBooking, getBookingsByEmail, getBookingsByUser } from "../controllers/bookingController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createBooking);
// authenticate(): these return a guest's full booking history (name, email,
// phone, prices, special requests) — must be restricted to the account
// owner or a super_admin, not open to anyone who knows/guesses an id/email.
router.get("/user/:userId", authenticate, getBookingsByUser);  // must come before /:email
router.get("/:email", authenticate, getBookingsByEmail);

export default router;
