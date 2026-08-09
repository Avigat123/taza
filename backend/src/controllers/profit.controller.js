import {
    runProfitAnalysis,
    getLatestProfitAnalysis,
    getProfitAnalysisHistory,
} from "../services/profit.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * POST /api/profit/:batchId/analyze
 * Run profit/loss analysis for a batch.
 * Body (optional): { procurementCostPerKg, storageCostPerKgPerDay, transportConfig }
 */
export const runProfitAnalysisController = async (req, res, next) => {
    try {
        const overrides = {
            procurementCostPerKg: req.body.procurementCostPerKg ?? null,
            storageCostPerKgPerDay: req.body.storageCostPerKgPerDay ?? null,
        };
        const transportConfig = req.body.transportConfig || {};

        const analysis = await runProfitAnalysis(
            req.params.batchId,
            overrides,
            transportConfig
        );

        return sendSuccess(res, 201, analysis, "Profit analysis completed");
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/profit/:batchId
 * Get the latest profit analysis for a batch.
 */
export const getLatestProfitAnalysisController = async (req, res, next) => {
    try {
        const analysis = await getLatestProfitAnalysis(req.params.batchId);
        if (!analysis)
            return sendError(
                res,
                404,
                "No profit analysis found. Run POST /api/profit/:batchId/analyze first."
            );
        return sendSuccess(res, 200, analysis);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/profit/:batchId/history
 */
export const getProfitAnalysisHistoryController = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 5, 20);
        const history = await getProfitAnalysisHistory(req.params.batchId, limit);
        return sendSuccess(res, 200, history);
    } catch (error) {
        next(error);
    }
};
