import { Router } from "express";
import { addEvent, getHouseholdEvents , deleteEvent } from "../controllers/eventController";
import { protect } from "../middleware/authMiddleware";

const router = Router();
router.route("/").post(protect, addEvent).get(protect, getHouseholdEvents);

// ✅ NEW: Catch delete requests for specific event IDs
router.route("/:eventId")
  .delete(protect, deleteEvent);
export default router;