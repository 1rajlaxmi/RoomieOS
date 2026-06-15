import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createHousehold,
  joinHousehold,
  getMyHousehold,
  leaveHousehold,
  removeRoommate,
  transferOwnership, 
  deleteHousehold
} from "../controllers/householdController";

const router = express.Router();

// All household routes should be protected, so we drop the 'protect' middleware 
// right in the middle of the request chain. If the user doesn't have a valid 
// JWT token, 'protect' kicks them out before the controller even runs!

router.post("/create", protect, createHousehold);
router.post("/join", protect, joinHousehold);
router.get("/my-household", protect, getMyHousehold);
router.put("/leave", protect, leaveHousehold);
router.delete('/evict/:memberId', protect, removeRoommate);
router.post("/transfer", protect, transferOwnership); 
router.delete("/", protect, deleteHousehold);

export default router;