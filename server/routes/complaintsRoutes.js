import express from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { list, get, create, update, resolve, assign } from "../controllers/complaintsController.js";
const router = express.Router();

router.use(authenticate);

// Any logged-in guest may file a complaint about their own stay.
router.post("/", create);

// Viewing the queue and managing complaints (priority, resolution,
// assignment) is staff-only — matches /admin/complaints (ProtectedRoute
// requireAdmin) in the frontend.
router.get("/", requireRole("super_admin"), list);
router.get("/:id", requireRole("super_admin"), get);
router.patch("/:id", requireRole("super_admin"), update);
router.post("/:id/resolve", requireRole("super_admin"), resolve);
router.post("/:id/assign", requireRole("super_admin"), assign);

export default router;
