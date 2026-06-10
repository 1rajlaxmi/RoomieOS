import { Response } from "express";
import Chore from "../models/Chore";
import Household from "../models/Household";
import { AuthRequest } from "../middleware/authMiddleware";
import sendEmail from "../utils/sendEmail";
import User from "../models/User";

// @desc    Add a new chore
// @route   POST /api/chores
// @access  Private
export const addChore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, assignedTo, dueDate } = req.body;

    // 1. Find the user's household
    const household = await Household.findOne({ members: req.user?._id });

    if (!household) {
      res.status(400).json({ message: "You must join a household before adding chores." });
      return;
    }

    // 2. Create the chore in the database
    const chore = await Chore.create({
      title,
      assignedTo,
      household: household._id as any,
      dueDate: dueDate ? new Date(dueDate) : undefined, // Convert string to proper Date format
    });

    // --- NEW: SEND AUTOMATED EMAILS ---
    const assignedUser = await User.findById(assignedTo);

    // Only send an email if you assigned it to someone else (not yourself)
    if (assignedUser && assignedUser._id.toString() !== req.user?._id.toString()) {
      await sendEmail({
        to: assignedUser.email,
        subject: `[RoomieOS] New Chore Assigned: ${chore.title}`,
        title: "🧹 It's Your Turn!",
        body: `You have been assigned a new household task: "${chore.title}". Please log in to check it off once completed!`,
        ctaText: "View Chores",
        ctaLink: "http://localhost:5173"
      });
    }
    // ----------------------------------
    res.status(201).json(chore);
  } catch (error) {
    res.status(500).json({ message: "Server error creating chore", error });
  }
};

// @desc    Get all chores for the household
// @route   GET /api/chores
// @access  Private
export const getHouseholdChores = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const household = await Household.findOne({ members: req.user?._id });

    if (!household) {
      res.status(404).json({ message: "Household not found." });
      return;
    }

    // Fetch chores, populate the assigned person's name, and sort them
    const chores = await Chore.find({ household: household._id })
      .populate("assignedTo", "name") // Grab the name of who needs to do it
      .sort({ isCompleted: 1, createdAt: -1 }); // Neat trick: Unfinished chores float to the top!

    res.status(200).json(chores);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching chores", error });
  }
};

// @desc    Toggle a chore's completion status
// @route   PUT /api/chores/:choreId/toggle
// @access  Private
export const toggleChoreStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { choreId } = req.params;

    const chore = await Chore.findById(choreId);

    if (!chore) {
      res.status(404).json({ message: "Chore not found." });
      return;
    }

    // Flip the boolean value (if true -> false, if false -> true)
    chore.isCompleted = !chore.isCompleted;
    await chore.save();

    res.status(200).json(chore);
  } catch (error) {
    res.status(500).json({ message: "Server error updating chore status", error });
  }
};