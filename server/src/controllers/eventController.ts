import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Event from "../models/Event";
import Household from "../models/Household";
import { getIO } from "../socket";

export const addEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, type, description, startDate, endDate } = req.body;
    const userId = req.user?._id;

    const household = await Household.findOne({ members: userId });
    if (!household) {
      res.status(400).json({ message: "You must join an apartment room first." });
      return;
    }

    const newEvent = await Event.create({
      title,
      type,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      postedBy: userId as any,
      household: household._id as any,
    });

    // Notify all roommate browsers live
    getIO().to(household._id.toString()).emit("calendar_data_changed");

    const fullSchedule = await Event.find({ household: household._id })
      .populate("postedBy", "name")
      .sort({ startDate: 1 });

    res.status(201).json(fullSchedule);
  } catch (error) {
    res.status(500).json({ message: "Error booking schedule entry.", error });
  }
};

export const getHouseholdEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const household = await Household.findOne({ members: req.user?._id });
    if (!household) {
      res.status(200).json([]);
      return;
    }

    const schedule = await Event.find({ household: household._id })
      .populate("postedBy", "name")
      .sort({ startDate: 1 });

    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Error pulling schedule details.", error });
  }
};

// @desc    Delete a calendar event
// @route   DELETE /api/events/:eventId
// @access  Private
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;
    const userId = req.user?._id;

    // 1. Verify the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: "Event entry not found." });
      return;
    }

    // 2. Security Guard: Verify the deleting user actually belongs to the target household
    const household = await Household.findOne({ _id: event.household, members: userId });
    if (!household) {
      res.status(403).json({ message: "Unauthorized. You do not belong to this household." });
      return;
    }

    // 3. Delete from the collection
    await Event.findByIdAndDelete(eventId);

    // 4. Stream real-time socket signal to other roommates
    getIO().to(event.household.toString()).emit("calendar_data_changed");

    // Fetch and return the remaining schedule list
    const remainingSchedule = await Event.find({ household: event.household })
      .populate("postedBy", "name")
      .sort({ startDate: 1 });

    res.status(200).json(remainingSchedule);
  } catch (error) {
    res.status(500).json({ message: "Server error deleting event", error });
  }
};