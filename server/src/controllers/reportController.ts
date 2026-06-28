import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Household from "../models/Household";
import Chore from "../models/Chore";
import Expense from "../models/Expense";

export const getMonthlyReportCard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const household = await Household.findOne({ members: userId }).populate("members", "name");

    if (!household) {
      res.status(400).json({ message: "No operational room found." });
      return;
    }

    // Target window constraints (Last 30 Days)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 30);

    // 🧹 1. CHORE CHAMPION CALCULATOR AGGREGATION
    const choreStats = await Chore.aggregate([
      { $match: { household: household._id, isCompleted: true, updatedAt: { $gte: targetDate } } },
      { $group: { _id: "$assignedTo", completedCount: { $sum: 1 } } },
      { $sort: { completedCount: -1 } }
    ]);

    // 💳 2. FINANCIAL INVESTOR TOTAL SPEND AGGREGATION
    const financialStats = await Expense.aggregate([
      { $match: { household: household._id, createdAt: { $gte: targetDate } } },
      { $group: { _id: "$paidBy", totalInvested: { $sum: "$amount" } } },
      { $sort: { totalInvested: -1 } }
    ]);

    // Map database arrays cleanly back to real names
    const choreRankings = household.members.map((member: any) => {
      const stat = choreStats.find((s) => s._id.toString() === member._id.toString());
      return { name: member.name, value: stat ? stat.completedCount : 0 };
    });

    const financialRankings = household.members.map((member: any) => {
      const stat = financialStats.find((s) => s._id.toString() === member._id.toString());
      return { name: member.name, amount: stat ? Number(stat.totalInvested.toFixed(2)) : 0 };
    });

    res.status(200).json({
      choreRankings,
      financialRankings,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed generating analytical summary card.", error });
  }
};