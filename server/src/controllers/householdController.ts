import { Response } from "express";
import Household from "../models/Household";
import Chore from "../models/Chore";
import Expense from "../models/Expense";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import { getIO } from "../socket";
import sendEmail from "../utils/sendEmail";
import crypto from "crypto";
import { Types } from "mongoose";

// Helper function to generate a random 6-character alphanumeric code
const generateInviteCode = (): string => {
  const bytes = crypto.randomBytes(3);
  const hexCode = bytes.toString("hex");
  return hexCode.toUpperCase();
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

    const existingHousehold = await Household.findOne({ members: userId });
    if (existingHousehold) {
      res.status(400).json({
        message: `You are already a member of "${existingHousehold.name}". You must leave your current room before creating a new one.`
      });
      return;
    }

    const inviteCode = generateInviteCode();

    const newHousehold = new Household({
      name,
      inviteCode,
      members: [userId],
      owner: userId
    });

    await newHousehold.save();

    await User.findByIdAndUpdate(userId, { household: newHousehold._id });

    const populatedHousehold = await Household.findById(newHousehold._id).populate("members", "name email");

    if (req.user?.email) {
      await sendEmail({
        to: req.user.email,
        subject: `[RoomieOS] Your Apartment Space is Ready! 🏠`,
        title: "✨ Welcome to your Admin Console!",
        body: `Success! You have officially created your new apartment workspace: "${newHousehold.name}" on RoomieOS.\n\n🔑 Secure Invite Code: ${newHousehold.inviteCode}`,
        ctaText: "Launch Dashboard",
        ctaLink: "http://localhost:5173"
      });
    }

    res.status(201).json(populatedHousehold);
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
    const userId = req.user?._id;

    if (!inviteCode) {
      res.status(400).json({ message: "Invite code is required." });
      return;
    }

    const currentHousehold = await Household.findOne({ members: userId });
    if (currentHousehold) {
      res.status(400).json({
        message: `You are already registered in "${currentHousehold.name}". Please exit your active apartment workspace before joining a new one.`
      });
      return;
    }

    const household = await Household.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!household) {
      res.status(404).json({ message: "Invalid invite code. Household not found." });
      return;
    }

    await Household.updateOne(
      { _id: household._id },
      { $addToSet: { members: userId } }
    );

    await User.findByIdAndUpdate(userId, { household: household._id });

    const populatedJoinedHousehold = await Household.findById(household._id).populate("members", "name email");

    // 📢 Broadcast entry update across the room
    getIO().to(household._id.toString()).emit("household_data_changed");

    if (req.user?.email) {
      await sendEmail({
        to: req.user.email,
        subject: "[RoomieOS] Welcome to your new home space! 🔑",
        title: "🏠 You're officially checked in!",
        body: `Great news! Your account has been successfully linked to your new apartment workspace on RoomieOS.`,
        ctaText: "Launch Dashboard",
        ctaLink: "http://localhost:5173"
      });
    }

    if (household.members && household.members.length > 0) {
      const newcomerName = req.user?.name || "A new roommate";
      for (const memberId of household.members) {
        if (memberId.toString() !== userId?.toString()) {
          const roommateUser = await User.findById(memberId);
          if (roommateUser && roommateUser.email) {
            await sendEmail({
              to: roommateUser.email,
              subject: "[RoomieOS] A new roommate has joined your space! ⚡",
              title: "👥 The circle just got bigger!",
              body: `Heads up! ${newcomerName} has officially entered your apartment group using your secure invite code.`,
              ctaText: "Open RoomieOS",
              ctaLink: "http://localhost:5173"
            });
          }
        }
      }
    }

    res.status(200).json(populatedJoinedHousehold);
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
      res.status(200).json(null);
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

    const pendingChores = await Chore.countDocuments({
      household: household._id,
      assignedTo: userId,
      isCompleted: false
    });

    if (pendingChores > 0) {
      res.status(400).json({
        message: `Exit Blocked! You still have ${pendingChores} pending task(s) assigned to you. Please complete or reassign your chores before leaving.`
      });
      return;
    }

    const unpaidExpenses = await Expense.countDocuments({
      household: household._id,
      splits: {
        $elemMatch: {
          user: userId,
          isPaid: false
        }
      }
    });

    if (unpaidExpenses > 0) {
      res.status(400).json({
        message: `Exit Blocked! You have ${unpaidExpenses} outstanding bill split(s) that are unpaid. Please settle your debts with your roommates before leaving.`
      });
      return;
    }

    // ✅ FIXED: Emit the data change event BEFORE the user is pulled from the room array.
    // If done afterward, the backend treats the user as an outsider, blocking their socket update channel.
    getIO().to(household._id.toString()).emit("household_data_changed");

    await Household.updateOne(
      { _id: household._id },
      { $pull: { members: userId } }
    );

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

    getIO().to(household._id.toString()).emit("household_data_changed");

    await Chore.deleteMany({ household: household._id });
    await Expense.deleteMany({ household: household._id });

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

    if (!memberId || typeof memberId !== "string" || !Types.ObjectId.isValid(memberId)) {
      res.status(400).json({ message: "Invalid roommate ID format." });
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

    // ✅ FIXED: Emit data change to room BEFORE executing the pull update
    getIO().to(household._id.toString()).emit("household_data_changed");

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

    if (!newOwnerId || !Types.ObjectId.isValid(newOwnerId)) {
      res.status(400).json({ message: "Invalid new owner ID format." });
      return;
    }

    const targetUserExists = await User.findById(newOwnerId);
    if (!targetUserExists) {
      res.status(404).json({ message: "Target user does not exist in the system database." });
      return;
    }

    const household = await Household.findOne({ owner: userId });
    if (!household) {
      res.status(403).json({ message: "Only the current Admin can transfer access privileges." });
      return;
    }

    const memberExists = household.members.some(m => m.toString() === newOwnerId);
    if (!memberExists) {
      res.status(400).json({ message: "Target user must be an active member of this room." });
      return;
    }

    household.owner = newOwnerId;
    await household.save();

    getIO().to(household._id.toString()).emit("household_data_changed");

    res.status(200).json({ message: "Admin access passed on cleanly.", household });
  } catch (error) {
    res.status(500).json({ message: "Ownership transfer process failed.", error });
  }
};