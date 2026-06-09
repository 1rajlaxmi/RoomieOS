import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  addExpense,
  getHouseholdExpenses,
} from "../controllers/expenseController";

const router = express.Router();

// Both routes are protected. You must be logged in to add or view expenses.
router.post("/", protect, addExpense);
router.get("/", protect, getHouseholdExpenses);

export default router;