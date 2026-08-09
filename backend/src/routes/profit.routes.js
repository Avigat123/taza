import express from "express";
import {
    runProfitAnalysisController,
    getLatestProfitAnalysisController,
    getProfitAnalysisHistoryController,
} from "../controllers/profit.controller.js";

const router = express.Router();

// POST /api/profit/:batchId/analyze    → run P&L analysis
// GET  /api/profit/:batchId            → latest analysis
// GET  /api/profit/:batchId/history    → history

router.post("/:batchId/analyze", runProfitAnalysisController);
router.get("/:batchId", getLatestProfitAnalysisController);
router.get("/:batchId/history", getProfitAnalysisHistoryController);

export default router;
