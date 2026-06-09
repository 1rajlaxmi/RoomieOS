import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  addChore,
  getHouseholdChores,
  toggleChoreStatus,
} from "../controllers/choreController";

const router = express.Router();

// All chore routes are protected so only logged-in roommates can see or edit them.
router.post("/", protect, addChore);
router.get("/", protect, getHouseholdChores);
router.put("/:choreId/toggle", protect, toggleChoreStatus);

export default router;