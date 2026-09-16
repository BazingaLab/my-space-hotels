import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { list, create, update, remove, stats } from "../controllers/teamController.js";
const router = express.Router();

// Staff directory / HR hierarchy — super_admin only, matching the
// /admin/team frontend route (ProtectedRoute requireAdmin).
router.use(authenticate, requireRole("super_admin"));

router.get("/", list);
router.get("/stats", stats);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);
export default router;
