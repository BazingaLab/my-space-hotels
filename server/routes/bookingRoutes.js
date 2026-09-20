import express from "express";
import { authenticate } from "../middleware/auth.js";
import { createBooking, getBookingsByEmail, getBookingsByUser } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", createBooking);
// Both lookups previously had NO authentication at all — anyone could pass
// an arbitrary user id or email and read that person's full booking
// history (guest name, email, phone, prices, special requests). Every
// current caller (MyBookings.jsx, Account.jsx) is already on an
// authenticated, logged-in page, so requiring a session here breaks no
// real use case. Ownership is enforced inside each controller.
router.get("/user/:userId", authenticate, getBookingsByUser);  // must come before /:email
router.get("/:email", authenticate, getBookingsByEmail);

export default router;
