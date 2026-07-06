import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import hotelRoutes from "./routes/hotelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pendingRoutes from "./routes/pendingRoutes.js";
import complaintsRoutes from "./routes/complaintsRoutes.js";
import paymentRoutes, { webhook as razorpayWebhook } from "./routes/paymentRoutes.js";
import bookingMgmtRoutes from "./routes/bookingMgmtRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL?.split(",") || "*",
  credentials: true,
}));

// Razorpay webhook MUST be mounted with express.raw() and BEFORE
// express.json() below — its signature is computed over the exact raw
// request bytes, which express.json() would otherwise consume/reparse.
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "My Space Hotels API ✦", version: "1.0.0" });
});

app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pending", pendingRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/booking-mgmt", bookingMgmtRoutes);
app.use("/api/wallets", walletRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}