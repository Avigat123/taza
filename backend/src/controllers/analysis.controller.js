/**
 * Analysis Controller
 *
 * Bridges the "Analyze Batch" / "✨ Get AI Insights" buttons in the React
 * app to the Python AI service, via mlProxy.service.js. This is the real
 * ML-backed path — separate from prediction.controller.js's existing
 * heuristic-only /api/predictions/:batchId/run, which stays as a
 * lightweight fallback for batches with no images.
 *
 * Field-name mapping (frontend FormData key → controller reads):
 *   temperature           → temperatureC     (alias)
 *   temperatureC          → temperatureC
 *   humidity              → humidityPercent  (alias)
 *   humidityPercent       → humidityPercent
 *   daysSinceHarvest      → harvestAgeDays   (alias)
 *   harvestAgeDays        → harvestAgeDays
 *   transportDurationHours→ transportDurationHours
 *   storageDurationHours  → storageDurationHours
 *   storageType           → storageType
 *   storageLocation       → storageLocation  (informational, not forwarded to Python)
 */
import { getBatchById } from "../services/batch.service.js";
import { updateBatchPredictionCache } from "../services/batch.service.js";
import { analyzeBatch, getAgentInsights, MLServiceError } from "../services/mlProxy.service.js";
import Prediction from "../models/Prediction.js";
import { sendSuccess, sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

const parseJSONField = (raw, fallback) => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const riskLevelFromDecision = (shelfLife) => {
    const risk = shelfLife?.assessment?.spoilage_risk;
    if (risk === "HIGH") return "HIGH";
    if (risk === "MEDIUM") return "MEDIUM";
    if (risk === "LOW") return "LOW";
    return "MEDIUM";
};

/**
 * Read a numeric body field, accepting either of two alternate names.
 * Returns undefined (not null) when absent so callers can use `?? undefined`.
 */
const readNumber = (body, primaryKey, aliasKey) => {
    const raw = body[primaryKey] ?? body[aliasKey];
    if (raw === undefined || raw === null || raw === "") return undefined;
    const n = Number(raw);
    return Number.isNaN(n) ? undefined : n;
};

/**
 * POST /api/batches/:batchId/analyze
 * multipart/form-data: images[] (required), plus optional storage fields.
 *
 * Accepts both the frontend's camelCase aliases AND the backend-canonical names:
 *   temperature / temperatureC
 *   humidity / humidityPercent
 *   daysSinceHarvest / harvestAgeDays
 *   transportDurationHours
 *   storageDurationHours
 *   storageType
 *   markets / routes / localMarket (each a JSON string)
 */
export const analyzeBatchController = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        logger.info("[EXPRESS] analyze request received", { batchId });
        const batch = await getBatchById(batchId);
        if (!batch) return sendError(res, 404, "Batch not found");

        if (!req.files || req.files.length === 0) {
            // Log what Express actually received before rejecting, so this
            // is diagnosable from server logs alone next time — previously
            // this branch returned silently with no log line, which is why
            // this failure looked identical to an AI-service-side rejection.
            logger.warn("[EXPRESS] no images in request — rejecting", {
                batchId,
                contentType: req.headers["content-type"],
                bodyKeys: Object.keys(req.body || {}),
            });
            return sendError(res, 422, "At least one produce image is required (field name 'images').");
        }

        // ----------------------------------------------------------------
        // Resolve storage fields — accept both camelCase aliases (frontend)
        // and the canonical backend names.
        // ----------------------------------------------------------------
        const storage = {
            harvestAgeDays: readNumber(req.body, "harvestAgeDays", "daysSinceHarvest"),
            temperatureC:
                readNumber(req.body, "temperatureC", "temperature") ??
                (batch.storageTemperatureCelsius != null ? batch.storageTemperatureCelsius : undefined),
            humidityPercent:
                readNumber(req.body, "humidityPercent", "humidity") ??
                (batch.storageHumidityPercent != null ? batch.storageHumidityPercent : undefined),
            storageDurationHours: readNumber(req.body, "storageDurationHours", null),
            transportDurationHours: readNumber(req.body, "transportDurationHours", null),
            storageType: req.body.storageType || undefined,
        };

        const markets = parseJSONField(req.body.markets, []);
        const routes = parseJSONField(req.body.routes, []);
        const localMarket = parseJSONField(req.body.localMarket, null);

        logger.info("[EXPRESS] storage inputs resolved", {
            batchId,
            harvestAgeDays: storage.harvestAgeDays,
            temperatureC: storage.temperatureC,
            humidityPercent: storage.humidityPercent,
            transportDurationHours: storage.transportDurationHours,
            storageType: storage.storageType,
        });

        const result = await analyzeBatch({
            batchId: batch._id.toString(),
            produce: batch.produceType,
            quantityKg: batch.quantity,
            images: req.files,
            storage,
            markets,
            routes,
            localMarket,
        });

        const { cv_analysis: cv, shelf_life: shelfLife, decision } = result;

        const prediction = await Prediction.create({
            batchId: batch._id,
            freshnessScore: cv.freshness_score,
            shelfLifeDays: shelfLife.assessment.estimated_remaining_shelf_life_days ?? 0,
            spoilageProbability:
                shelfLife.assessment.spoilage_risk === "HIGH"
                    ? 0.8
                    : shelfLife.assessment.spoilage_risk === "MEDIUM"
                    ? 0.5
                    : shelfLife.assessment.spoilage_risk === "LOW"
                    ? 0.15
                    : 0.5,
            riskLevel: riskLevelFromDecision(shelfLife),
            confidence: shelfLife.assessment.confidence,
            source: "ml_python_service",
            visualClass: cv.visual_class,
            classDistribution: cv.class_distribution,
            shelfLifeAssessment: shelfLife,
            decision,
            inputSignals: {
                visualScore: cv.freshness_score,
                temperature: storage.temperatureC ?? null,
                humidity: storage.humidityPercent ?? null,
                daysSinceHarvest: storage.harvestAgeDays ?? null,
                transportDurationHours: storage.transportDurationHours ?? null,
                storageType: storage.storageType ?? null,
            },
        });

        await updateBatchPredictionCache(batchId, {
            freshnessScore: cv.freshness_score,
            shelfLifeDays: shelfLife.assessment.estimated_remaining_shelf_life_days ?? 0,
            spoilageProbability: prediction.spoilageProbability,
        });

        logger.info("[EXPRESS] response sent", {
            batchId,
            visualClass: cv.visual_class,
            primaryAction: decision.recommendation?.primary_action,
        });

        return sendSuccess(res, 201, prediction, "Batch analyzed successfully");
    } catch (error) {
        if (error instanceof MLServiceError) {
            return sendError(res, error.statusCode, error.message, error.detail);
        }
        next(error);
    }
};

/**
 * POST /api/batches/:batchId/analyze/insights
 * Optional "✨ Get AI Insights" step. Uses the most recent
 * ml_python_service prediction's shelf-life assessment to request an
 * LLM explanation of the decision, without re-running CV or the
 * deterministic engine's numbers.
 */
export const getBatchInsightsController = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        const batch = await getBatchById(batchId);
        if (!batch) return sendError(res, 404, "Batch not found");

        const latest = await Prediction.findOne({ batchId, source: "ml_python_service" }).sort({
            createdAt: -1,
        });
        if (!latest || !latest.shelfLifeAssessment) {
            return sendError(
                res,
                422,
                "No AI analysis on file for this batch yet. Run Analyze Batch first."
            );
        }

        const markets = parseJSONField(req.body?.markets, []);
        const routes = parseJSONField(req.body?.routes, []);
        const localMarket = parseJSONField(req.body?.localMarket, null);

        const insights = await getAgentInsights({
            batchId: batch._id.toString(),
            produce: batch.produceType,
            quantityKg: batch.quantity,
            shelfLifeAssessment: latest.shelfLifeAssessment,
            markets,
            routes,
            localMarket,
        });

        latest.aiInsights = {
            explanation: insights.agent_explanation,
            notes: insights.agent_notes,
            provider: insights.agent_provider,
            model: insights.agent_model,
            generatedAt: new Date(),
        };
        await latest.save();

        return sendSuccess(res, 200, insights, "AI insights generated");
    } catch (error) {
        if (error instanceof MLServiceError) {
            return sendError(res, error.statusCode, error.message, error.detail);
        }
        next(error);
    }
};