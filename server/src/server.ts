import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import http from "http"; // ✅ Import native HTTP module
import { initSocket } from "./socket"; // ✅ Import your new socket manager

// Import Routes
import authRoutes from "./routes/authRoutes";
import householdRoutes from "./routes/householdRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import choreRoutes from "./routes/choreRoutes";
import sendEmail from "./utils/sendEmail";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app)

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/chores", choreRoutes);

// ✅ Initialize the real-time socket cluster layer
initSocket(server);

// --- TEMPORARY TEST ROUTE ---
// app.get("/api/test-email", async (req, res) => {
//   try {
//     await sendEmail({
//       to: "put.your.actual.email.here@gmail.com", // <-- REPLACE THIS WITH YOUR REAL EMAIL!
//       subject: "RoomieOS Engine Test",
//       title: "🚀 Systems Online",
//       body: "If you are reading this, your RoomieOS email engine is fully authorized and operational. Great job!",
//       ctaText: "Let's Deploy",
//       ctaLink: "http://localhost:5173"
//     });
//     res.send("Email fired! Go check your inbox.");
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Failed to send email. Check your server console.");
//   }
// });
// ----------------------------

// Your normal routes are down here...
app.use("/api/auth", authRoutes);
// ...

// Basic test route
app.get("/", (req, res) => {
  res.send("RoomieOS API is running...");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server locked and loaded on http://localhost:${PORT}`);
});