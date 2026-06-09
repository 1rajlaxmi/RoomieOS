import { Response } from "express";
import Expense from "../models/Expense";
import Household from "../models/Household";
import { AuthRequest } from "../middleware/authMiddleware";

// @desc    Add a new expense and split it equally
// @route   POST /api/expenses
// @access  Private
export const addExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, amount } = req.body;

    // 1. Find the household the current user belongs to
    const household = await Household.findOne({ members: req.user?._id });

    if (!household) {
      res.status(400).json({ message: "You must join a household before adding expenses." });
      return;
    }

    // 2. The Math: Divide the amount by the number of roommates
    const totalMembers = household.members.length;
    const splitAmount = amount / totalMembers;

    // 3. Create the splits array
    const splits = household.members.map((memberId) => {
      // We convert Mongoose ObjectIDs to strings to safely compare them
      const isPayer = memberId.toString() === req.user?._id.toString();
      
      return {
        user: memberId,
        amountOwed: Number(splitAmount.toFixed(2)), // Round to 2 decimal places for currency
        isPaid: isPayer // The person who paid instantly has their share marked as paid
      };
    });

    // 4. Save the expense to the database
    const expense = await Expense.create({
      description,
      amount: Number(amount),
      paidBy: req.user?._id as any,
      household: household._id as any,
      splits
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server error creating expense", error });
  }
};

// @desc    Get all expenses for the user's household
// @route   GET /api/expenses
// @access  Private
export const getHouseholdExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Find the user's household
    const household = await Household.findOne({ members: req.user?._id });

    if (!household) {
      res.status(404).json({ message: "Household not found." });
      return;
    }

    // 2. Fetch all expenses linked to this household
    const expenses = await Expense.find({ household: household._id })
      .populate("paidBy", "name email") // Get the name of who paid
      .populate("splits.user", "name email") // Get the names of everyone who owes money
      .sort({ date: -1 }); // Sort by newest first

    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching expenses", error });
  }
};