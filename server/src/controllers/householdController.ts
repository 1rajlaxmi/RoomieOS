import { Response } from "express";
import Household from "../models/Household";
import User from "../models/User"; 
import { AuthRequest } from "../middleware/authMiddleware";
import { getIO } from "../socket";
import sendEmail from "../utils/sendEmail";

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

    const inviteCode = generateInviteCode();

    const newHousehold = new Household({
      name,
      inviteCode,
      members: [userId],
      owner: userId 
    });

    await newHousehold.save();
    
    await User.findByIdAndUpdate(userId, { household: newHousehold._id });

    // =========================================================================
    // ✉️ NEW: ADMIN ROOM CREATION WELCOME EMAIL SYSTEM
    // =========================================================================
    if (req.user?.email) {
      await sendEmail({
        to: req.user.email,
        subject: `[RoomieOS] Your Apartment Space is Ready! 🏠`,
        title: "✨ Welcome to your Admin Console!",
        body: `Success! You have officially created your new apartment workspace: "${newHousehold.name}" on RoomieOS.\n\nAs the administrator of this space, you hold the management privileges to evict residents, transfer ownership, or dissolve the room if needed. Copy your secure invite code below and send it to your roommates so they can hop in:\n\n🔑 Secure Invite Code: ${newHousehold.inviteCode}`,
        ctaText: "Launch Dashboard",
        ctaLink: "http://localhost:5173"
      });
    }
    // =========================================================================

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

    await Household.updateOne(
      { _id: household._id },
      { $addToSet: { members: req.user?._id } }
    );

    await User.findByIdAndUpdate(req.user?._id, { household: household._id });

    // 📡 Broadcast live addition entry to everyone in the room
    getIO().to(household._id.toString()).emit("household_data_changed");

    // =========================================================================
    // ✉️ NEW: REAL-TIME WELCOME & ALERTER EMAIL SYSTEM
    // =========================================================================
    
    // A. Send a welcome email to the newcomer
    if (req.user?.email) {
      await sendEmail({
        to: req.user.email,
        subject: "[RoomieOS] Welcome to your new home space! 🔑",
        title: "🏠 You're officially checked in!",
        body: `Great news! Your account has been successfully linked to your new apartment workspace on RoomieOS.\n\nFrom this moment on, you have full shared access to coordinate chore tracking charts, stay on top of daily tasks, split bills equally, and manage household balances cleanly in real-time. Your roommates are waiting for you inside!`,
        ctaText: "Launch Dashboard",
        ctaLink: "http://localhost:5173"
      });
    }

    // B. Send alert emails to all existing roommates
    // (Note: 'household.members' holds the list of older roommates from before the update)
    if (household.members && household.members.length > 0) {
      const newcomerName = req.user?.name || "A new roommate";
      
      for (const memberId of household.members) {
        // Double-check to ensure we don't accidentally email the newcomer here
        if (memberId.toString() !== req.user?._id.toString()) {
          const roommateUser = await User.findById(memberId);
          
          if (roommateUser && roommateUser.email) {
            await sendEmail({
              to: roommateUser.email,
              subject: "[RoomieOS] A new roommate has joined your space! ⚡",
              title: "👥 The circle just got bigger!",
              body: `Heads up! ${newcomerName} has officially entered your apartment group using your secure invite code.\n\nRoomieOS has automatically adjusted your backend infrastructure parameters. All new financial splits and task delegations will now calculate and accommodate your new group size automatically.`,
              ctaText: "Open RoomieOS",
              ctaLink: "http://localhost:5173"
            });
          }
        }
      }
    }
    // ========================================================================= 

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
      // ✅ CHANGED: Return 200 OK with null instead of a 404 error
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

    await Household.updateOne(
      { _id: household._id },
      { $pull: { members: userId } }
    );

    await User.findByIdAndUpdate(userId, { $unset: { household: "" } });

    // ✅ FIXED: Emit signal so remaining roommates instantly see this user disappear from the list
    getIO().to(household._id.toString()).emit("household_data_changed");

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

    // ✅ FIXED: Emit signal to everyone inside the room BEFORE we purge the database collections
    getIO().to(household._id.toString()).emit("household_data_changed");

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

    await Household.updateOne(
      { _id: household._id },
      { $pull: { members: memberId } }
    );

    await User.findByIdAndUpdate(memberId, { $unset: { household: "" } });
    
    // ✅ FIXED: Emit eviction alert to the room channel. 
    // This forces the evicted user's page and remaining roommates' screens to refresh concurrently.
    getIO().to(household._id.toString()).emit("household_data_changed");

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

    const memberExists = household.members.some(m => m.toString() === newOwnerId);
    if (!memberExists) {
      res.status(400).json({ message: "Target user must be an active member of this room." });
      return;
    }

    household.owner = newOwnerId;
    await household.save();

    // ✅ FIXED: Emit updates so the new admin instantly sees their Admin Options unlock real-time
    getIO().to(household._id.toString()).emit("household_data_changed");

    res.status(200).json({ message: "Admin access passed on cleanly.", household });
  } catch (error) {
    res.status(500).json({ message: "Ownership transfer process failed.", error });
  }
};