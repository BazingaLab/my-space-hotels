import express from "express";
import { list, submit, verify, pendingKyc } from "../controllers/kycController.js";
const router = express.Router();
router.get("/pending", pendingKyc);
router.get("/hotel/:hotelId", list);
router.post("/", submit);
router.patch("/:id/verify", verify);
export default router;