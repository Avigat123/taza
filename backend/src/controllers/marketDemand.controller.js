/**
 * Market Demand Controller
 *
 * REAL market demand + route input layer for a batch. This is separate
 * from controllers/market.controller.js (which deals with generic
 * MarketPrice reference data / JS-only opportunity math) — this
 * controller's data feeds DIRECTLY into the Python decision engine's
 * DecisionRequest.markets / .routes / .local_market, unmodified.
 */
import mongoose from "mongoose";
import {
    upsertMarketData,
    getMarketDataForBatch,
    ValidationError,
} from "../services/marketDemand.service.js";
import { getBatchById } from "../services/batch.service.js";
import { getDecision, MLServiceError } from "../services/mlProxy.service.js";
import Prediction from "../models/Prediction.js";
import { sendSuccess, sendError } from "../utils/response.js";

/**
 * PUT /api/batches/:batchId/market-data
 * Body: { markets: [{location,demandKg,pricePerKg}],
 *         routes: [{destination,transportHours,transportCost}],
 *         localMarket: {location,demandKg,pricePerKg} | null }
 *
 * Creates or replaces the market/route dataset for a batch in one call
 * ("batch update" of market data, as opposed to one record at a time).
 */
export const upsertMarketDataController = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        const { markets = [], routes = [], localMarket = null } = req.body || {};

        const doc = await upsertMarketData(batchId, { markets, routes, localMarket });
        return sendSuccess(res, 200, doc, "Market/route data saved");
    } catch (error) {
        if (error instanceof ValidationError) {
            return sendError(res, error.statusCode, error.message, error.errors);
        }
        if (error.statusCode) {
            return sendError(res, error.statusCode, error.message);
        }
        next(error);
    }
};

/**
 * GET /api/batches/:batchId/market-data
 * Returns the currently stored market/route dataset for a batch, or null.
 */
export const getMarketDataController = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return sendError(res, 400, `Invalid batchId: ${batchId}`);
        }
        const doc = await getMarketDataForBatch(batchId);
        return sendSuccess(res, 200, doc);
    } catch (error) {
        if (error instanceof ValidationError) {
            return sendError(res, error.statusCode, error.message, error.errors);
        }
        next(error);
    }
};

/**
 * POST /api/batches/:batchId/decision
 *
 * Runs ONLY the deterministic Python decision engine (POST /decision) for
 * a batch, using:
 *   - batch info from the stored Batch document (produce, quantity)
 *   - shelf_life_assessment from the most recent ml_python_service
 *     Prediction (must already exist — run Analyze Batch first)
 *   - markets/routes/localMarket from the stored MarketDemand document
 *     (or from the request body, if the caller wants to pass ad-hoc data
 *     without persisting it first)
 *
 * Express performs no allocation math — the exact DecisionRequest is
 * forwarded to Python and its DecisionResult is returned as-is.
 */
export const runDecisionController = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(batchId)) {
            return sendError(res, 400, `Invalid batchId: ${batchId}`);
        }

        const batch = await getBatchById(batchId);
        if (!batch) return sendError(res, 404, "Batch not found");

        const latest = await Prediction.findOne({ batchId, source: "ml_python_service" }).sort({
            createdAt: -1,
        });
        if (!latest || !latest.shelfLifeAssessment) {
            return sendError(
                res,
                422,
                "No shelf-life assessment on file for this batch. Run POST /api/batches/:batchId/analyze first."
            );
        }

        // Prefer market data explicitly passed in the request body (ad-hoc,
        // not persisted); fall back to the stored MarketDemand dataset.
        let markets = req.body?.markets;
        let routes = req.body?.routes;
        let localMarket = req.body?.localMarket;

        if (markets === undefined && routes === undefined && localMarket === undefined) {
            const stored = await getMarketDataForBatch(batchId);
            markets = stored?.markets ?? [];
            routes = stored?.routes ?? [];
            localMarket = stored?.localMarket ?? null;
        } else {
            markets = markets ?? [];
            routes = routes ?? [];
            localMarket = localMarket ?? null;
        }

        const { result, requestSentToPython } = await getDecision({
            batchId: batch._id.toString(),
            produce: batch.produceType,
            quantityKg: batch.quantity,
            shelfLifeAssessment: latest.shelfLifeAssessment,
            markets,
            routes,
            localMarket,
        });

        // Persist the real decision result onto the same Prediction record
        // that already carries the shelf-life assessment, so refreshing the
        // batch page (GET /api/predictions/:batchId) surfaces the same
        // decision without needing to re-call Python.
        latest.decision = result;
        await latest.save();

        return sendSuccess(res, 200, result, "Decision computed", {
            requestSentToPython,
        });
    } catch (error) {
        if (error instanceof MLServiceError) {
            return sendError(res, error.statusCode, error.message, error.detail);
        }
        next(error);
    }
};
