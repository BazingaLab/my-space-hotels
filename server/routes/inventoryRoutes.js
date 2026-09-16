import express from "express";
import { authenticate, requireRole, requireHotelOwnership } from "../middleware/auth.js";
import { getCalendar, listBlocks, createBlock, deactivateBlock } from "../controllers/inventoryController.js";

const router = express.Router();

router.use(authenticate);

// Hotel-scoped — super_admin (any hotel) or the owning hotel_admin only.
router.get("/:hotelId/calendar", requireRole("super_admin", "hotel_admin"), requireHotelOwnership("hotelId"), getCalendar);
router.get("/:hotelId/blocks", requireRole("super_admin", "hotel_admin"), requireHotelOwnership("hotelId"), listBlocks);
router.post("/:hotelId/blocks", requireRole("super_admin", "hotel_admin"), requireHotelOwnership("hotelId"), createBlock);

// Block-scoped — the route only has a block id, not a hotel id, so
// ownership is resolved inside the controller once the block's
// hotel_id is known (same pattern as canAccessBooking in
// bookingMgmtController.js).
router.post("/blocks/:blockId/deactivate", requireRole("super_admin", "hotel_admin"), deactivateBlock);

export default router;
