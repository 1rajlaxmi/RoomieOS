import { Router } from "express";
import { getMonthlyReportCard } from "../controllers/reportController";
import { protect } from "../middleware/authMiddleware";

const router = Router();
router.route("/monthly-summary").get(protect, getMonthlyReportCard);
export default router;