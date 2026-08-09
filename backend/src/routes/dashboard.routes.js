import express from "express";
import {
    getDashboardOverviewController,
    getUrgentBatchesController,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

// GET /api/dashboard/overview
// GET /api/dashboard/urgent

router.get("/overview", getDashboardOverviewController);
router.get("/urgent", getUrgentBatchesController);

export default router;
