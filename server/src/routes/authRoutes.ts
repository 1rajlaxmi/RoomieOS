import express from "express";
import { registerUser, loginUser } from "../controllers/authController";

const router = express.Router();

// Define the routes
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;