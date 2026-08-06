import express from "express";
import { authenticate } from "../middleware/auth.js";
import { create, byHotel } from "../controllers/reviewController.js";

const router = express.Router();

// Public — anyone browsing a hotel can see its reviews, no login required.
router.get("/hotel/:hotelId", byHotel);

// Requires a real login — create() derives the guest's identity from the
// verified session token, never from the request body.
router.post("/", authenticate, create);

export default router;