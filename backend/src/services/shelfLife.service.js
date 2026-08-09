/**
 * Shelf Life Service
 *
 * Estimates remaining commercially useful shelf life in days.
 */

import { computeShelfLifeDays } from "../utils/calculations.js";

/**
 * Calculate days elapsed since a given date.
 * @param {Date|string} date
 * @returns {number}
 */
export const getDaysSinceDate = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Estimate remaining shelf life for a batch.
 *
 * @param {object} batch       - Mongoose Batch document
 * @param {number} freshnessScore - Already computed freshness score (0–100)
 * @param {object|null} inspection - Latest QualityInspection (for env data)
 * @returns {number|null} Estimated remaining days
 */
export const computeBatchShelfLife = (batch, freshnessScore, inspection = null) => {
    const temperature =
        inspection?.environmentalData?.temperature ??
        batch.storageTemperatureCelsius ??
        null;

    const daysSinceHarvest = batch.harvestDate
        ? getDaysSinceDate(batch.harvestDate)
        : null;

    return computeShelfLifeDays({
        freshnessScore,
        produceType: batch.produceType || "generic",
        temperature,
        daysSinceHarvest,
    });
};
