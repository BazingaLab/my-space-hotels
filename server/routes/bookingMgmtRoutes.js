import express from "express";
import { list, cancel, transfer, update, stats } from "../controllers/bookingMgmtController.js";
const router = express.Router();
router.get("/", list);
router.get("/stats", stats);
router.post("/:id/cancel", cancel);
router.post("/:id/transfer", transfer);
router.patch("/:id", update);
export default router;
