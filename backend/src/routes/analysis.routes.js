import express from "express";
import {
    analyzeBatchController,
    getBatchInsightsController,
} from "../controllers/analysis.controller.js";
import { uploadBatchImages } from "../middleware/upload.middleware.js";

const router = express.Router({ mergeParams: true });

// POST /api/batches/:batchId/analyze           (multipart: images[] + storage fields)
// POST /api/batches/:batchId/analyze/insights   (optional "✨ Get AI Insights")

router.post("/:batchId/analyze", uploadBatchImages, analyzeBatchController);
router.post("/:batchId/analyze/insights", getBatchInsightsController);

export default router;
