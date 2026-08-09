import express from "express";
import {
    runPredictionController,
    getLatestPredictionController,
    getPredictionHistoryController,
} from "../controllers/prediction.controller.js";

const router = express.Router();

// POST /api/predictions/:batchId/run      → run a new prediction
// GET  /api/predictions/:batchId          → latest prediction
// GET  /api/predictions/:batchId/history  → prediction history

router.post("/:batchId/run", runPredictionController);
router.get("/:batchId", getLatestPredictionController);
router.get("/:batchId/history", getPredictionHistoryController);

export default router;
