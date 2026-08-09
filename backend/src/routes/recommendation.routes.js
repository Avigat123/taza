import express from "express";
import {
    generateRecommendationController,
    getLatestRecommendationController,
    getRecommendationHistoryController,
} from "../controllers/recommendation.controller.js";

const router = express.Router();

// POST /api/recommendations/:batchId/generate  → run decision engine
// GET  /api/recommendations/:batchId           → latest recommendation
// GET  /api/recommendations/:batchId/history   → history

router.post("/:batchId/generate", generateRecommendationController);
router.get("/:batchId", getLatestRecommendationController);
router.get("/:batchId/history", getRecommendationHistoryController);

export default router;
