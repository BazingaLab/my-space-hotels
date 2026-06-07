import express from "express";
import { create, byHotel } from "../controllers/reviewController.js";
const router = express.Router();
router.post("/", create);
router.get("/hotel/:hotelId", byHotel);
export default router;
