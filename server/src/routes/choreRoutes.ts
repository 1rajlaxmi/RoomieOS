import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  addChore,
  getHouseholdChores,
  toggleChoreStatus,
} from "../controllers/choreController";

const router = Router();

// All chore routes are protected so only logged-in roommates can see or edit them.
router.route("/")
  .post(protect, addChore)
  .get(protect, getHouseholdChores);

router.route("/:choreId/toggle")
  .put(protect, toggleChoreStatus);

export default router;