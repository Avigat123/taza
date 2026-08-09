/**
 * Freshness Service
 *
 * Computes a freshness score for a batch by combining all available signals:
 *   - Latest quality inspection (visual score, firmness, defects)
 *   - Batch metadata (harvest date → age)
 *   - Storage environment (temperature, humidity)
 *
 * This is the backend heuristic layer.
 * When the Python ML service is ready, replace computeFreshnessScore()
 * with a call to the ML proxy — the rest of this service stays the same.
 */

import { computeFreshnessScore } from "../utils/calculations.js";
import { getDaysSinceDate } from "./shelfLife.service.js";

/**
 * Build freshness input signals from a batch + its latest inspection.
 *
 * @param {object} batch  - Mongoose Batch document
 * @param {object|null} inspection - Latest QualityInspection document (may be null)
 * @returns {object} signals — the input object for computeFreshnessScore
 */
export const buildFreshnessSignals = (batch, inspection = null) => {
    const signals = {
        produceType: batch.produceType || "generic",
        daysSinceHarvest: batch.harvestDate
            ? getDaysSinceDate(batch.harvestDate)
            : null,
        temperature: batch.storageTemperatureCelsius ?? null,
        humidity: batch.storageHumidityPercent ?? null,
        visualScore: null,
        firmness: null,
        brix: null,
        visibleDefects: [],
    };

    if (inspection) {
        signals.visualScore = inspection.visualQuality?.score ?? null;
        signals.firmness = inspection.physicalQuality?.firmness ?? null;
        signals.visibleDefects = inspection.visualQuality?.visibleDefects ?? [];

        // Prefer inspection environment data over batch-level if available
        if (inspection.environmentalData?.temperature !== undefined && inspection.environmentalData.temperature !== null) {
            signals.temperature = inspection.environmentalData.temperature;
        }
        if (inspection.environmentalData?.humidity !== undefined && inspection.environmentalData.humidity !== null) {
            signals.humidity = inspection.environmentalData.humidity;
        }
    }

    return signals;
};

/**
 * Compute a freshness score from batch + inspection signals.
 * Returns the score (0–100) or null if insufficient data.
 */
export const computeBatchFreshnessScore = (batch, inspection = null) => {
    const signals = buildFreshnessSignals(batch, inspection);
    return computeFreshnessScore(signals);
};
