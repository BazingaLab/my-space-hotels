import express from "express";
import {
  getHotels,
  getHotelById,
  getFeaturedHotels,
  getPopularDestinations,
  suggestHotels,
  createHotel,
} from "../controllers/hotelController.js";

const router = express.Router();

router.get("/", getHotels);
router.get("/featured/list", getFeaturedHotels);
router.get("/destinations/popular", getPopularDestinations);
router.get("/suggest", suggestHotels);
router.get("/:id", getHotelById);
router.post("/", createHotel);

export default router;