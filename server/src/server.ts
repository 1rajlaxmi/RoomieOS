import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";

// Import Routes
import authRoutes from "./routes/authRoutes";
import householdRoutes from "./routes/householdRoutes";
import expenseRoutes from "./routes/expenseRoutes";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/expenses", expenseRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.send("RoomieOS API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});