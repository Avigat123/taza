import express from "express";
import {
    getBatchPassportController,
    getSupplyChainSummaryController,
} from "../controllers/traceability.controller.js";

const router = express.Router();

// GET /api/traceability/supply-chain/summary
// GET /api/traceability/:batchId

// Note: static route must come before parameterised route
router.get("/supply-chain/summary", getSupplyChainSummaryController);
router.get("/:batchId", getBatchPassportController);

export default router;
