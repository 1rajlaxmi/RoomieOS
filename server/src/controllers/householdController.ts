import { Response } from "express";
import Household from "../models/Household";
import { AuthRequest } from "../middleware/authMiddleware"; // We import the custom request type we made yesterday!

// Helper function to generate a random 6-character alphanumeric code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Create a new household
// @route   POST /api/households/create
// @access  Private (Requires Token)
export const createHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    // 1. Generate a unique code
    let inviteCode = generateInviteCode();
    
    // 2. Double-check the database to ensure this code doesn't magically exist already
    let codeExists = await Household.findOne({ inviteCode });
    while (codeExists) {
      inviteCode = generateInviteCode();
      codeExists = await Household.findOne({ inviteCode });
    }

    // 3. Create the household and add the creator as the first member
    const household = await Household.create({
      name,
      inviteCode,
      members: [req.user?._id as any] // req.user comes from our authMiddleware!
    });

    res.status(201).json(household);
  } catch (error) {
    res.status(500).json({ message: "Server error creating household", error });
  }
};

// @desc    Join an existing household using a code
// @route   POST /api/households/join
// @access  Private (Requires Token)
export const joinHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inviteCode } = req.body;

    // 1. Find the apartment by the code provided
    const household = await Household.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!household) {
      res.status(404).json({ message: "Invalid invite code. Household not found." });
      return;
    }

    // 2. Check if the user is already a member
    if (household.members.includes(req.user?._id as any)) {
      res.status(400).json({ message: "You are already a member of this household!" });
      return;
    }

    // 3. Add the user's ID to the members array and save
    household.members.push(req.user?._id as any);
    await household.save();

    res.status(200).json(household);
  } catch (error) {
    res.status(500).json({ message: "Server error joining household", error });
  }
};

// @desc    Get the current user's household
// @route   GET /api/households/my-household
// @access  Private (Requires Token)
export const getMyHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // REMOVED the -_id so the frontend can securely access the roommate IDs!
    const household = await Household.findOne({ members: req.user?._id })
      .populate("members", "name email"); 

    if (!household) {
      res.status(404).json({ message: "You are not in a household yet." });
      return;
    }

    res.status(200).json(household);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching household", error });
  }
};