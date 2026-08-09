import {
    getBatchPassport,
    getSupplyChainSummary,
} from "../services/traceability.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * GET /api/traceability/:batchId
 * Get the complete digital batch passport with full event timeline.
 */
export const getBatchPassportController = async (req, res, next) => {
    try {
        const passport = await getBatchPassport(req.params.batchId);
        return sendSuccess(res, 200, passport);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/traceability/supply-chain/summary
 * Overview of the entire supply chain by batch status.
 */
export const getSupplyChainSummaryController = async (req, res, next) => {
    try {
        const summary = await getSupplyChainSummary();
        return sendSuccess(res, 200, summary);
    } catch (error) {
        next(error);
    }
};
