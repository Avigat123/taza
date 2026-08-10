/**
 * Market Demand Service
 *
 * Owns validation and persistence of REAL, user-provided market demand
 * and route data for a batch — the exact inputs the Python decision
 * engine's DecisionRequest.markets / .routes / .local_market need
 * (ai/decision/schema.py: MarketInfo, RouteInfo).
 *
 * This service does NOT compute any allocation/decision logic itself —
 * that stays exclusively in the Python engine (ai/decision/engine.py).
 * It only validates shape/sign of the data and stores it.
 */
import mongoose from "mongoose";
import MarketDemand from "../models/MarketDemand.js";
import { getBatchById } from "./batch.service.js";
import logger from "../utils/logger.js";

export class ValidationError extends Error {
    constructor(message, errors = null) {
        super(message);
        this.name = "ValidationError";
        this.statusCode = 400;
        this.errors = errors;
    }
}

// ── Field-level validation ──────────────────────────────────────────────────
// Mirrors the bounds already enforced by ai/decision/schema.py so a bad
// request is rejected at the Express layer with a clear message, instead
// of round-tripping to Python just to get a 422.

const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);

const validateMarket = (m, index, label = "markets") => {
    const errors = [];
    if (!m || typeof m !== "object") {
        return [`${label}[${index}]: must be an object`];
    }
    if (!m.location || typeof m.location !== "string" || !m.location.trim()) {
        errors.push(`${label}[${index}].location: required non-empty string`);
    }
    if (!isFiniteNumber(m.demandKg)) {
        errors.push(`${label}[${index}].demandKg: required number`);
    } else if (m.demandKg < 0) {
        errors.push(`${label}[${index}].demandKg: cannot be negative (got ${m.demandKg})`);
    } else if (m.demandKg > 1_000_000) {
        errors.push(`${label}[${index}].demandKg: exceeds max of 1,000,000`);
    }
    if (!isFiniteNumber(m.pricePerKg)) {
        errors.push(`${label}[${index}].pricePerKg: required number`);
    } else if (m.pricePerKg < 0) {
        errors.push(`${label}[${index}].pricePerKg: cannot be negative (got ${m.pricePerKg})`);
    } else if (m.pricePerKg > 100_000) {
        errors.push(`${label}[${index}].pricePerKg: exceeds max of 100,000`);
    }
    return errors;
};

const validateRoute = (r, index) => {
    const errors = [];
    if (!r || typeof r !== "object") {
        return [`routes[${index}]: must be an object`];
    }
    if (!r.destination || typeof r.destination !== "string" || !r.destination.trim()) {
        errors.push(`routes[${index}].destination: required non-empty string`);
    }
    if (!isFiniteNumber(r.transportHours)) {
        errors.push(`routes[${index}].transportHours: required number`);
    } else if (r.transportHours < 0) {
        errors.push(`routes[${index}].transportHours: cannot be negative (got ${r.transportHours})`);
    } else if (r.transportHours > 2000) {
        errors.push(`routes[${index}].transportHours: exceeds max of 2000`);
    }
    if (!isFiniteNumber(r.transportCost)) {
        errors.push(`routes[${index}].transportCost: required number`);
    } else if (r.transportCost < 0) {
        errors.push(`routes[${index}].transportCost: cannot be negative (got ${r.transportCost})`);
    } else if (r.transportCost > 10_000_000) {
        errors.push(`routes[${index}].transportCost: exceeds max of 10,000,000`);
    }
    return errors;
};

/**
 * Validates a full market-data batch payload: { markets, routes, localMarket }.
 * Throws ValidationError with a flat list of field-level messages on failure.
 */
export const validateMarketDataPayload = ({ markets = [], routes = [], localMarket = null }) => {
    const errors = [];

    if (!Array.isArray(markets)) {
        errors.push("markets: must be an array");
    } else {
        markets.forEach((m, i) => errors.push(...validateMarket(m, i, "markets")));
    }

    if (!Array.isArray(routes)) {
        errors.push("routes: must be an array");
    } else {
        routes.forEach((r, i) => errors.push(...validateRoute(r, i)));
    }

    if (localMarket !== null && localMarket !== undefined) {
        errors.push(...validateMarket(localMarket, 0, "localMarket"));
    }

    if (errors.length > 0) {
        throw new ValidationError("Invalid market/route data", errors);
    }
};

/**
 * Create or update (upsert) the market/route dataset for a batch.
 * Real user-provided data only — no defaults/fabrication.
 *
 * @param {string} batchId
 * @param {object} payload - { markets: [{location,demandKg,pricePerKg}],
 *                              routes: [{destination,transportHours,transportCost}],
 *                              localMarket: {location,demandKg,pricePerKg} | null }
 */
export const upsertMarketData = async (batchId, payload) => {
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
        throw new ValidationError(`Invalid batchId: ${batchId}`);
    }

    const batch = await getBatchById(batchId);
    if (!batch) {
        const err = new Error("Batch not found");
        err.statusCode = 404;
        throw err;
    }

    validateMarketDataPayload(payload);

    const { markets = [], routes = [], localMarket = null } = payload;

    const doc = await MarketDemand.findOneAndUpdate(
        { batchId },
        {
            batchId,
            markets,
            routes,
            localMarket: localMarket || null,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    logger.info("Market/route data upserted", {
        batchId,
        marketsCount: markets.length,
        routesCount: routes.length,
        hasLocalMarket: Boolean(localMarket),
    });

    return doc;
};

/**
 * Fetch the most recent market/route dataset stored for a batch.
 * Returns null if none has been provided yet.
 */
export const getMarketDataForBatch = async (batchId) => {
    if (!mongoose.Types.ObjectId.isValid(batchId)) {
        throw new ValidationError(`Invalid batchId: ${batchId}`);
    }
    return MarketDemand.findOne({ batchId }).sort({ createdAt: -1 });
};
