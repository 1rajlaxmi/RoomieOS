import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import http from "http"; // ✅ Import native HTTP module
import { initSocket } from "./socket"; // ✅ Import your new socket manager
import rateLimit from "express-rate-limit";

// Import Routes
import authRoutes from "./routes/authRoutes";
import householdRoutes from "./routes/householdRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import choreRoutes from "./routes/choreRoutes";
//import sendEmail from "./utils/sendEmail";
import eventRoutes from "./routes/eventRoutes";
import reportRoutes from "./routes/reportRoutes";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app)

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Allows your frontend URL
    credentials: true, // Crucial! Allows the browser to accept secure cookie/auth handshakes
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// =========================================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window duration
  max: 20, // Strict maximum limit: 20 authentication attempts per window window
  message: {
    message: "Too many login/registration attempts from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true, // Return standard rate limit info headers
  legacyHeaders: false, // Disable X-RateLimit-* legacy headers
});

// Apply the strict guard middleware exclusively to authentication route routes
app.use("/api/auth", authLimiter);
// =========================================================

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/chores", choreRoutes);

app.use("/api/events", eventRoutes);
app.use("/api/reports", reportRoutes);


// ✅ Initialize the real-time socket cluster layer
initSocket(server);


// Basic test route
app.get("/", (req, res) => {
  res.send("RoomieOS API is running...");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server locked and loaded on http://localhost:${PORT}`);
});