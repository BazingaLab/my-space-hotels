import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { list, get, update, stats, getMyProfile } from "../controllers/customerController.js";
const router = express.Router();

// Any logged-in guest may read their OWN record — registered before the
// blanket super_admin gate below so it never inherits that requirement.
router.get("/me", authenticate, getMyProfile);

// CRM spans every hotel's guests — super_admin only, matching the
// /admin/customers frontend route (ProtectedRoute requireAdmin).
router.use(authenticate, requireRole("super_admin"));

router.get("/", list);
router.get("/stats/summary", stats);
router.get("/:id", get);
router.patch("/:id", update);
export default router;
