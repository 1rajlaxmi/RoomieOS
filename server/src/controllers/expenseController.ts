import { Response } from "express";
import Expense from "../models/Expense";
import Household from "../models/Household";
import { AuthRequest } from "../middleware/authMiddleware";
import sendEmail from "../utils/sendEmail";
import { getIO } from "../socket";
import { Types } from "mongoose";
import User from "../models/User"; // We need this to get your roommates' email addresses

// @desc    Add a new expense and split it equally
// @route   POST /api/expenses
// @access  Private
export const addExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, amount } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ message: "Amount must be a valid positive number." });
      return;
    }

    // 1. Find the household the current user belongs to
    const household = await Household.findOne({ members: req.user?._id });

    if (!household) {
      res.status(400).json({ message: "You must join a household before adding expenses." });
      return;
    }

    // 2. The Math: Divide the amount by the number of roommates
    const totalMembers = household.members.length;
    const splitAmount = parsedAmount / totalMembers; // ✅ FIXED: Using parsedAmount consistently

    // 3. Create the splits array
    const splits = household.members.map((memberId) => {
      const isPayer = memberId.toString() === req.user?._id.toString();
      
      return {
        user: memberId,
        amountOwed: Number(splitAmount.toFixed(2)), 
        isPaid: isPayer 
      };
    });

    // 4. Save the expense to the database
    const expense = await Expense.create({
      description,
      amount: parsedAmount, // ✅ FIXED: Using parsedAmount consistently
      paidBy: req.user?._id as any,
      household: household._id as any,
      splits
    });
    
    // --- SEND AUTOMATED EMAILS ---
    const populatedHousehold = await Household.findById(household._id).populate("members", "name email");
    
    if (populatedHousehold) {
      // ✅ FIXED: Map email delivery promises to resolve them deterministically
      const emailPromises = populatedHousehold.members.map(async (member: any) => {
        if (member._id.toString() !== req.user?._id.toString()) {
          try {
            await sendEmail({
              to: member.email,
              subject: `[RoomieOS] New Expense: ${expense.description}`,
              title: "💸 Bill Split Alert",
              body: `A new bill for "${expense.description}" totaling ₹${expense.amount.toFixed(2)} was just added. Your split has been calculated and is ready for review.`,
              ctaText: "View Dashboard",
              ctaLink: "http://localhost:5173" 
            });
          } catch (emailErr) {
            // Logs mail transport dropouts without breaking the database transaction or crashing server
            console.error(`[Mail Fail] Failed to notify ${member.email}:`, emailErr);
          }
        }
      });

      // Wait until all mapped operations conclude entirely before returning
      await Promise.all(emailPromises);
    }

    // ✅ Retained exact original Socket.io sync call
    if (household) {
      getIO().to(household._id.toString()).emit("expenses_data_changed");
    }
    
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
     res.status(200).json([]);
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

// @desc    Mark a user's split as paid (Settle Up)
// @route   PUT /api/expenses/:expenseId/settle
// @access  Private
export const settleExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { expenseId } = req.params;
    const { userId } = req.body; // The ID of the roommate who paid their debt

    // =========================================================
    // 🛡️ SECURITY GUARD: Sanitize input to prevent CastError/ID spoofing
    // =========================================================
    if (!userId || typeof userId !== "string" || !Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "Invalid user ID format provided for settlement." });
      return;
    }
    // =========================================================

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      res.status(404).json({ message: "Expense not found." });
      return;
    }

    // SECURITY CHECK: Retained exact original check ensuring only the creator/payer marks it settled
    if (expense.paidBy.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: "Only the person who paid the bill can settle this debt." });
      return;
    }

    // Find that specific roommate in the splits array
    const splitIndex = expense.splits.findIndex(
      (split) => split.user.toString() === userId
    );

    if (splitIndex !== -1) {
      // Flip their status to true!
      expense.splits[splitIndex].isPaid = true;
      await expense.save();

      // ✅ Retained exact original Socket.io real-time channel broadcast
      if (expense.household) {
        getIO().to(expense.household.toString()).emit("expenses_data_changed");
      }

      res.status(200).json(expense);
    } else {
      res.status(404).json({ message: "User not found in this expense." });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error settling expense", error });
  }
};