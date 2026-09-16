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
import reviewRoutes from "./routes/reviewRoutes.js";
import guestBookingRoutes from "./routes/guestBookingRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";

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

// Safe diagnostic endpoint — confirms the deployment is alive and which
// Supabase project it's pointed at, WITHOUT ever revealing the service
// role key or any other secret. Only the hostname portion of
// SUPABASE_URL is exposed (the project ref), which is not sensitive —
// it's already public in the client's own VITE_SUPABASE_URL.
app.get("/api/health", (req, res) => {
  let supabaseHost = null;
  try { supabaseHost = new URL(process.env.SUPABASE_URL || "").hostname; } catch { /* leave null if unset/invalid */ }
  res.json({
    status: "ok",
    node_env: process.env.NODE_ENV || null,
    vercel_env: process.env.VERCEL_ENV || null,
    supabase_host: supabaseHost,
  });
});

app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pending", pendingRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/booking-mgmt", bookingMgmtRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/guest-bookings", guestBookingRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/inventory", inventoryRoutes);

// 404 handler — must stay last among route mounts; Express matches in
// registration order, so anything unmatched above falls through to here.
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Central error handler — must be the very last app.use(). Express treats
// this as an error handler specifically because it takes 4 arguments.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
export default app;

// Vercel injects VERCEL=1 into every deployment's runtime regardless of
// what NODE_ENV is configured to — checking that directly (instead of
// assuming NODE_ENV will be exactly "production") is what actually
// distinguishes "running as a Vercel serverless function" from local
// dev, since a Preview deployment can have NODE_ENV set to anything
// (e.g. "staging") without this needing to change.
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}