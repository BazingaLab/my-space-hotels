import express from "express";
import { list, create, update, remove, stats } from "../controllers/teamController.js";
const router = express.Router();
router.get("/", list);
router.get("/stats", stats);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);
export default router;
