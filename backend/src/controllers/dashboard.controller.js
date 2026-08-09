import {
    computeWasteMetrics,
    getInventorySummaryByStatus,
    getRecentRecommendationSummary,
} from "../services/waste.service.js";
import { getActiveBatchesByUrgency } from "../services/batch.service.js";
import { sendSuccess } from "../utils/response.js";

/**
 * GET /api/dashboard/overview
 * Main dashboard data: inventory, risk, spoilage estimates, urgent batches.
 */
export const getDashboardOverviewController = async (req, res, next) => {
    try {
        const [wasteMetrics, statusSummary, recommendationSummary] = await Promise.all([
            computeWasteMetrics(),
            getInventorySummaryByStatus(),
            getRecentRecommendationSummary(7),
        ]);

        return sendSuccess(res, 200, {
            wasteMetrics,
            inventoryByStatus: statusSummary,
            recentRecommendations: recommendationSummary,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/dashboard/urgent
 * List of active batches sorted by urgency (lowest shelf life first).
 */
export const getUrgentBatchesController = async (req, res, next) => {
    try {
        const batches = await getActiveBatchesByUrgency();
        return sendSuccess(res, 200, batches);
    } catch (error) {
        next(error);
    }
};
