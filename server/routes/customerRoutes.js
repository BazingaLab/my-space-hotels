import express from "express";
import { list, get, update, stats } from "../controllers/customerController.js";
const router = express.Router();
router.get("/", list);
router.get("/stats/summary", stats);
router.get("/:id", get);
router.patch("/:id", update);
export default router;
