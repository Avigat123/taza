/**
 * ML Proxy Service
 *
 * The ONLY place in the Express backend that talks to the Python FastAPI
 * AI service (backend/ai_services). Wraps two calls:
 *
 *   - analyzeBatch()   -> POST {AI_SERVICE_URL}/analyze-batch
 *     Full pipeline: CV freshness classification -> RAG-grounded
 *     shelf-life assessment -> deterministic decision engine.
 *     This is what "Analyze Batch" in the UI triggers.
 *
 *   - getAgentInsights() -> POST {AI_SERVICE_URL}/decision/agent
 *     Optional AI explanation layered on top of an already-computed
 *     decision. This is what "✨ Get AI Insights" triggers. It re-runs
 *     the deterministic engine (same numbers) and adds natural-language
 *     reasoning from the configured LLM provider.
 *
 * Both calls raise a normalized MLServiceError (with .statusCode and
 * .detail) on failure, so controllers can forward a clean response
 * without knowing anything about the Python service's error shape.
 */
import axios from "axios";
import FormData from "form-data";
import env from "../config/env.js";
import logger from "../utils/logger.js";

export class MLServiceError extends Error {
    constructor(message, statusCode = 502, detail = null) {
        super(message);
        this.name = "MLServiceError";
        this.statusCode = statusCode;
        this.detail = detail;
    }
}

const client = axios.create({
    baseURL: env.aiServiceUrl,
    timeout: 60_000,
});

const wrapAxiosError = (error, fallbackMessage) => {
    if (error.response) {
        // FastAPI returns { detail: {...} } for our structured errors
        const detail = error.response.data?.detail;
        const message =
            (typeof detail === "object" && detail?.detail) ||
            (typeof detail === "string" && detail) ||
            fallbackMessage;
        return new MLServiceError(message, error.response.status, detail);
    }
    if (error.request) {
        return new MLServiceError(
            `AI service unreachable at ${env.aiServiceUrl}: ${error.message}`,
            503,
            null
        );
    }
    return new MLServiceError(error.message, 502, null);
};

/**
 * Runs the full CV -> shelf-life -> decision pipeline for a batch.
 *
 * @param {object} params
 * @param {string} params.batchId
 * @param {string} params.produce
 * @param {number} params.quantityKg
 * @param {Array<{buffer: Buffer, originalname: string, mimetype: string}>} params.images
 *        multer file objects (memory storage)
 * @param {object} [params.storage] - { harvestAgeDays, temperatureC, humidityPercent,
 *        storageDurationHours, transportDurationHours, storageType }
 * @param {Array<object>} [params.markets] - [{ location, demandKg, pricePerKg }]
 * @param {Array<object>} [params.routes] - [{ destination, transportHours, transportCost }]
 * @param {object} [params.localMarket] - { location, demandKg, pricePerKg }
 * @returns {Promise<object>} AnalyzeBatchResult (cv_analysis, shelf_life, decision)
 */
export const analyzeBatch = async ({
    batchId,
    produce,
    quantityKg,
    images,
    storage = {},
    markets = [],
    routes = [],
    localMarket = null,
}) => {
    if (!images || images.length === 0) {
        throw new MLServiceError("At least one produce image is required.", 422);
    }

    const form = new FormData();
    form.append("batch_id", String(batchId));
    form.append("produce", produce);
    form.append("quantity_kg", String(quantityKg));

    for (const img of images) {
        form.append("images", img.buffer, {
            filename: img.originalname,
            contentType: img.mimetype,
        });
    }

    if (storage.harvestAgeDays != null) form.append("harvest_age_days", String(storage.harvestAgeDays));
    if (storage.temperatureC != null) form.append("temperature_c", String(storage.temperatureC));
    if (storage.humidityPercent != null) form.append("humidity_percent", String(storage.humidityPercent));
    if (storage.storageDurationHours != null)
        form.append("storage_duration_hours", String(storage.storageDurationHours));
    if (storage.transportDurationHours != null)
        form.append("transport_duration_hours", String(storage.transportDurationHours));
    if (storage.storageType != null) form.append("storage_type", storage.storageType);

    const toSnakeMarket = (m) => ({
        location: m.location,
        demand_kg: m.demandKg,
        price_per_kg: m.pricePerKg,
    });
    const toSnakeRoute = (r) => ({
        destination: r.destination,
        transport_hours: r.transportHours,
        transport_cost: r.transportCost,
    });

    if (markets.length) form.append("markets", JSON.stringify(markets.map(toSnakeMarket)));
    if (routes.length) form.append("routes", JSON.stringify(routes.map(toSnakeRoute)));
    if (localMarket) form.append("local_market", JSON.stringify(toSnakeMarket(localMarket)));

    try {
        const { data } = await client.post("/analyze-batch", form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        return data;
    } catch (error) {
        logger.error("analyzeBatch failed", { batchId, message: error.message });
        throw wrapAxiosError(error, "AI service failed to analyze batch");
    }
};

/**
 * Requests an AI-generated explanation for an already-computed decision.
 * Rebuilds the same DecisionRequest the deterministic engine used
 * (from a stored prediction's shelf_life + decision context) and calls
 * POST /decision/agent. The numeric result is identical to the stored
 * decision; only agent_explanation/agent_notes are new.
 *
 * @param {object} params
 * @param {string} params.batchId
 * @param {string} params.produce
 * @param {number} params.quantityKg
 * @param {object} params.shelfLifeAssessment - stored Layer 2 ShelfLifeAssessment
 * @param {Array<object>} [params.markets]
 * @param {Array<object>} [params.routes]
 * @param {object} [params.localMarket]
 * @returns {Promise<object>} AgentDecisionResult
 */
export const getAgentInsights = async ({
    batchId,
    produce,
    quantityKg,
    shelfLifeAssessment,
    markets = [],
    routes = [],
    localMarket = null,
}) => {
    if (!shelfLifeAssessment) {
        throw new MLServiceError(
            "No shelf-life assessment on file for this batch — run Analyze Batch first.",
            422
        );
    }

    const shelfLifeInput = {
        estimated_remaining_shelf_life_days:
            shelfLifeAssessment.assessment?.estimated_remaining_shelf_life_days ?? null,
        estimate_range_days: shelfLifeAssessment.assessment?.estimate_range_days ?? null,
        spoilage_risk: shelfLifeAssessment.assessment?.spoilage_risk,
        confidence: shelfLifeAssessment.assessment?.confidence,
        urgency: shelfLifeAssessment.assessment?.urgency,
        batch_condition: shelfLifeAssessment.condition?.batch_condition,
        data_quality: shelfLifeAssessment.data_quality ?? null,
    };

    const payload = {
        batch: { batch_id: String(batchId), produce, quantity_kg: quantityKg },
        shelf_life_assessment: shelfLifeInput,
        markets: markets.map((m) => ({
            location: m.location,
            demand_kg: m.demandKg,
            price_per_kg: m.pricePerKg,
        })),
        routes: routes.map((r) => ({
            destination: r.destination,
            transport_hours: r.transportHours,
            transport_cost: r.transportCost,
        })),
        local_market: localMarket
            ? {
                  location: localMarket.location,
                  demand_kg: localMarket.demandKg,
                  price_per_kg: localMarket.pricePerKg,
              }
            : null,
    };

    try {
        const { data } = await client.post("/decision/agent", payload);
        return data;
    } catch (error) {
        logger.error("getAgentInsights failed", { batchId, message: error.message });
        throw wrapAxiosError(error, "AI service failed to generate insights");
    }
};
