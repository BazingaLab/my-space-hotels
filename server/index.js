import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import hotelRoutes from "./routes/hotelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL?.split(",") || "*",
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "My Space Hotels API ✦",
    version: "1.0.0",
    endpoints: ["/api/hotels", "/api/bookings"],
  });
});

// Routes
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

// For Vercel serverless deployment
export default app;

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✦ Server running on http://localhost:${PORT}`);
  });
}
