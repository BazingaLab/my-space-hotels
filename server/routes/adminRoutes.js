import express from "express";
import {
  getUserRole, promoteUser, getAllUsers,
  adminGetHotels, adminCreateHotel, adminUpdateHotel, adminDeleteHotel,
  adminGetBookings, hotelAdminGetBookings,
  adminGetAnalytics,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/role/:user_id", getUserRole);
router.post("/promote", promoteUser);
router.get("/users", getAllUsers);
router.get("/hotels", adminGetHotels);
router.post("/hotels", adminCreateHotel);
router.put("/hotels/:id", adminUpdateHotel);
router.delete("/hotels/:id", adminDeleteHotel);
router.get("/bookings", adminGetBookings);
router.get("/bookings/owner/:owner_id", hotelAdminGetBookings);
router.get("/analytics", adminGetAnalytics);

export default router;