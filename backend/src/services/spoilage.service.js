/**
 * Spoilage Service
 *
 * Estimates spoilage probability and risk level from batch signals.
 */

import {
    computeSpoilageProbability,
    probabilityToRiskLevel,
} from "../utils/calculations.js";
import { getDaysSinceDate } from "./shelfLife.service.js";

/**
 * Compute spoilage probability + risk level for a batch.
 *
 * @param {object} batch
 * @param {number|null} freshnessScore
 * @param {number|null} shelfLifeDays
 * @param {object|null} inspection
 * @returns {{ probability: number|null, riskLevel: string, breakdown: object }}
 */
export const computeBatchSpoilage = (batch, freshnessScore, shelfLifeDays, inspection = null) => {
    const temperature =
        inspection?.environmentalData?.temperature ??
        batch.storageTemperatureCelsius ??
        null;

    const daysSinceHarvest = batch.harvestDate
        ? getDaysSinceDate(batch.harvestDate)
        : null;

    const visibleDefects =
        inspection?.visualQuality?.visibleDefects ?? [];

    const { probability, breakdown } = computeSpoilageProbability({
        freshnessScore,
        shelfLifeDays,
        daysSinceHarvest,
        produceType: batch.produceType || "generic",
        temperature,
        visibleDefects,
    });

    return {
        probability,
        riskLevel: probabilityToRiskLevel(probability),
        breakdown,
    };
};
