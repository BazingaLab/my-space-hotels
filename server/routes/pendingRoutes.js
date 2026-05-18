import express from "express";
import { submitHotel, getPendingHotels, getMySubmissions, approveHotel, rejectHotel } from "../controllers/pendingController.js";

const router = express.Router();

router.post("/", submitHotel);
router.get("/", getPendingHotels);
router.get("/mine/:owner_id", getMySubmissions);
router.post("/:id/approve", approveHotel);
router.post("/:id/reject", rejectHotel);

export default router;