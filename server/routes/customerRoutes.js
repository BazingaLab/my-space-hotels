import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { list, get, update, stats } from "../controllers/customerController.js";
const router = express.Router();

// CRM spans every hotel's guests — super_admin only, matching the
// /admin/customers frontend route (ProtectedRoute requireAdmin).
router.use(authenticate, requireRole("super_admin"));

router.get("/", list);
router.get("/stats/summary", stats);
router.get("/:id", get);
router.patch("/:id", update);
export default router;
