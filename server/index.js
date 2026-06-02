import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import hotelRoutes from "./routes/hotelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import pendingRoutes from "./routes/pendingRoutes.js";
import complaintsRoutes from "./routes/complaintsRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL?.split(",") || "*",
  credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "My Space Hotels API ✦", version: "1.0.0" });
});

app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pending", pendingRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/wallets", walletRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
export default app;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`✦ Server running on http://localhost:${PORT}`));
}