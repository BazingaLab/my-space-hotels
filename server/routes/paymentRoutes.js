import express from "express";
import { createOrderHandler, verifyPayment, webhook } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", createOrderHandler);
router.post("/verify", verifyPayment);
// NOTE: /webhook is mounted separately in index.js with express.raw(),
// ahead of the global express.json() middleware — it is NOT registered
// here so it never accidentally goes through the JSON parser.

export default router;
export { webhook };
