/**
 * Waste Service
 *
 * Computes aggregated waste and inventory metrics across all active batches.
 * These numbers feed the dashboard.
 *
 * IMPORTANT: All figures are estimates based on prediction models.
 * They should be presented with appropriate uncertainty language.
 */

import Batch from "../models/Batch.js";
import Recommendation from "../models/Recommendation.js";

/**
 * Compute dashboard-level waste reduction and inventory metrics.
 *
 * @returns {object} Aggregated metrics
 */
export const computeWasteMetrics = async () => {
    // Load all active batches
    const activeBatches = await Batch.find({ status: "ACTIVE" });
    const totalBatches = activeBatches.length;

    if (totalBatches === 0) {
        return {
            totalBatches: 0,
            totalInventoryKg: 0,
            atRiskBatchCount: 0,
            atRiskInventoryKg: 0,
            criticalBatchCount: 0,
            estimatedSpoilageKg: 0,
            estimatedSpoilagePercent: 0,
            estimatedValueAtRisk: null,
            batchesWithPredictions: 0,
            batchesRequiringImmediateAction: [],
            disclaimer: "No active batches found.",
        };
    }

    let totalInventoryKg = 0;
    let atRiskInventoryKg = 0;
    let atRiskBatchCount = 0;
    let criticalBatchCount = 0;
    let estimatedSpoilageKg = 0;
    let batchesWithPredictions = 0;
    let valueAtRisk = 0;
    let hasValueData = false;

    const batchesRequiringImmediateAction = [];

    for (const batch of activeBatches) {
        totalInventoryKg += batch.quantity;

        const hasPrediction =
            batch.latestSpoilageProbability !== null &&
            batch.latestSpoilageProbability !== undefined;

        if (hasPrediction) {
            batchesWithPredictions++;

            const spoilageKg = batch.quantity * batch.latestSpoilageProbability;
            estimatedSpoilageKg += spoilageKg;

            const isAtRisk = batch.latestSpoilageProbability >= 0.2;
            const isCritical =
                batch.latestSpoilageProbability >= 0.5 ||
                (batch.latestShelfLifeDays !== null && batch.latestShelfLifeDays < 1);

            if (isAtRisk) {
                atRiskBatchCount++;
                atRiskInventoryKg += batch.quantity;
            }
            if (isCritical) {
                criticalBatchCount++;
                batchesRequiringImmediateAction.push({
                    batchId: batch._id,
                    batchCode: batch.batchCode,
                    productName: batch.productName,
                    produceType: batch.produceType,
                    quantity: batch.quantity,
                    unit: batch.unit,
                    currentLocation: batch.currentLocation,
                    freshnessScore: batch.latestFreshnessScore,
                    shelfLifeDays: batch.latestShelfLifeDays,
                    spoilageProbability: batch.latestSpoilageProbability,
                    lastPredictedAt: batch.latestPredictionAt,
                });
            }

            // Value at risk (if procurement cost available)
            if (batch.procurementCostPerKg !== null) {
                valueAtRisk += spoilageKg * batch.procurementCostPerKg;
                hasValueData = true;
            }
        }
    }

    // Sort immediate action list by shelf life (most urgent first)
    batchesRequiringImmediateAction.sort(
        (a, b) => (a.shelfLifeDays ?? 999) - (b.shelfLifeDays ?? 999)
    );

    const estimatedSpoilagePercent =
        totalInventoryKg > 0
            ? Math.round((estimatedSpoilageKg / totalInventoryKg) * 100 * 10) / 10
            : 0;

    return {
        // Inventory overview
        totalBatches,
        totalInventoryKg: Math.round(totalInventoryKg * 10) / 10,
        batchesWithPredictions,
        batchesWithoutPredictions: totalBatches - batchesWithPredictions,

        // Risk summary
        atRiskBatchCount,
        atRiskInventoryKg: Math.round(atRiskInventoryKg * 10) / 10,
        criticalBatchCount,

        // Spoilage estimates
        estimatedSpoilageKg: Math.round(estimatedSpoilageKg * 10) / 10,
        estimatedSpoilagePercent,
        estimatedValueAtRisk: hasValueData ? Math.round(valueAtRisk) : null,

        // Immediate action list (sorted by urgency)
        batchesRequiringImmediateAction: batchesRequiringImmediateAction.slice(0, 10),

        disclaimer:
            "All spoilage estimates are based on prediction models and should be treated as indicative, not precise.",
        isPartial: batchesWithPredictions < totalBatches,
        partialNote:
            batchesWithPredictions < totalBatches
                ? `${totalBatches - batchesWithPredictions} of ${totalBatches} batches have no predictions. Run predictions for more accurate metrics.`
                : null,
    };
};

/**
 * Get a per-status inventory summary.
 */
export const getInventorySummaryByStatus = async () => {
    const result = await Batch.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalQuantityKg: { $sum: "$quantity" },
            },
        },
    ]);

    return result.reduce((acc, row) => {
        acc[row._id] = {
            count: row.count,
            totalQuantityKg: Math.round(row.totalQuantityKg * 10) / 10,
        };
        return acc;
    }, {});
};

/**
 * Count recent recommendations by action type.
 * Useful for the dashboard overview.
 */
export const getRecentRecommendationSummary = async (days = 7) => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const result = await Recommendation.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$actionType", count: { $sum: 1 } } },
    ]);

    return result.reduce((acc, row) => {
        acc[row._id] = row.count;
        return acc;
    }, {});
};
