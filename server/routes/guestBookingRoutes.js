import express from "express";
import { detail, cancel } from "../controllers/guestBookingController.js";
const router = express.Router();
router.get("/:id", detail);
router.post("/:id/cancel", cancel);
export default router;
