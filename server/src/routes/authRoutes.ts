import express from "express";
import { registerUser, loginUser, forgotPassword, resetPassword } from "../controllers/authController";

const router = express.Router();

// Define the standard authentication routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// ✅ NEW: Password Recovery Flow Endpoints
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

export default router;