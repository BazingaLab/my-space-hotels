import express from "express";
import { createBooking, getBookingsByEmail, getBookingsByUser } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", createBooking);
router.get("/user/:userId", getBookingsByUser);  // must come before /:email
router.get("/:email", getBookingsByEmail);

export default router;
