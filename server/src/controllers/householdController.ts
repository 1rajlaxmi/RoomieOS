import { Response } from "express";
import Household from "../models/Household";
import User from "../models/User"; // ✅ FIXED: Added missing User model import
import { AuthRequest } from "../middleware/authMiddleware";

// Helper function to generate a random 6-character alphanumeric code
const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc    Create a new household
// @route   POST /api/households/create
// @access  Private (Requires Token)
export const createHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized. User ID not found." });
      return;
    }

    // ✅ CLEANUP: Using your helper function now!
    const inviteCode = generateInviteCode();

    const newHousehold = new Household({
      name,
      inviteCode,
      members: [userId],
      owner: userId // The person who builds the room is dynamically crowned Admin
    });

    await newHousehold.save();
    
    // Bind the household ID back to the user object
    await User.findByIdAndUpdate(userId, { household: newHousehold._id });

    res.status(201).json(newHousehold);
  } catch (error) {
    res.status(500).json({ message: "Server error setting up household.", error });
  }
};

// @desc    Join an existing household using a code
// @route   POST /api/households/join
// @access  Private (Requires Token)
export const joinHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      res.status(400).json({ message: "Invite code is required." });
      return;
    }

    const household = await Household.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!household) {
      res.status(404).json({ message: "Invalid invite code. Household not found." });
      return;
    }

    if (household.members.includes(req.user?._id as any)) {
      res.status(400).json({ message: "You are already a member of this household!" });
      return;
    }

    // ✅ FIXED: Atomic $addToSet avoids validation conflicts on older documents
    await Household.updateOne(
      { _id: household._id },
      { $addToSet: { members: req.user?._id } }
    );

    await User.findByIdAndUpdate(req.user?._id, { household: household._id });

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

// @desc    Leave the current household
// @route   PUT /api/households/leave
// @access  Private
export const leaveHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized. User ID not found." });
      return;
    }

    const household = await Household.findOne({ members: userId });

    if (!household) {
      res.status(404).json({ message: "You are not currently in a household." });
      return;
    }

    // ✅ FIXED: Atomic $pull modifies only the members array, bypassing schema validation
    await Household.updateOne(
      { _id: household._id },
      { $pull: { members: userId } }
    );

    // Unlink the household from the user profile safely
    await User.findByIdAndUpdate(userId, { $unset: { household: "" } });

    res.status(200).json({ message: "Successfully left the household." });
  } catch (error) {
    res.status(500).json({ message: "Server error leaving household", error });
  }
};

// @desc    Delete the entire room (Admin Only)
// @route   DELETE /api/households
// @access  Private
export const deleteHousehold = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    const household = await Household.findOne({ owner: userId });

    if (!household) {
      res.status(403).json({ message: "Only the Admin can destroy this room." });
      return;
    }

    // Unlink all members from this household first
    await User.updateMany({ _id: { $in: household.members } }, { $unset: { household: "" } });
    
    await Household.findByIdAndDelete(household._id);

    res.status(200).json({ message: "Household completely dissolved successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to dissolve room.", error });
  }
};

// @desc    Remove a roommate from the room (Admin Only)
// @route   DELETE /api/households/evict/:memberId
// @access  Private
export const removeRoommate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { memberId } = req.params;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    const household = await Household.findOne({ owner: userId });
    if (!household) {
      res.status(403).json({ message: "Only the Admin can evict members." });
      return;
    }

    if (memberId === userId.toString()) {
      res.status(400).json({ message: "You cannot evict yourself. Use the leave handler instead." });
      return;
    }

    // ✅ FIXED: Atomic $pull query removes the target member safely
    await Household.updateOne(
      { _id: household._id },
      { $pull: { members: memberId } }
    );

    await User.findByIdAndUpdate(memberId, { $unset: { household: "" } });

    res.status(200).json({ message: "Roommate successfully evicted." });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove roommate.", error });
  }
};
// @desc    Transfer admin keys to another roommate (Admin Only)
// @route   POST /api/households/transfer
// @access  Private
export const transferOwnership = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { newOwnerId } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized." });
      return;
    }

    const household = await Household.findOne({ owner: userId });
    if (!household) {
      res.status(403).json({ message: "Only the current Admin can transfer access privileges." });
      return;
    }

    // ✅ FIXED: Uses string comparison via .some() so ObjectId vs String tracking never fails
    const memberExists = household.members.some(m => m.toString() === newOwnerId);
    if (!memberExists) {
      res.status(400).json({ message: "Target user must be an active member of this room." });
      return;
    }

    household.owner = newOwnerId;
    await household.save();

    res.status(200).json({ message: "Admin access passed on cleanly.", household });
  } catch (error) {
    res.status(500).json({ message: "Ownership transfer process failed.", error });
  }
};