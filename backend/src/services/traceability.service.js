/**
 * Traceability Service
 *
 * Builds the digital batch passport — a chronological history of all events
 * for a batch: inspections, predictions, recommendations.
 *
 * The traceability trail answers: "What happened to this batch and when?"
 */

import Batch from "../models/Batch.js";
import QualityInspection from "../models/QualityInspection.js";
import Prediction from "../models/Prediction.js";
import Recommendation from "../models/Recommendation.js";

/**
 * Build a complete traceability timeline for a batch.
 * Events are merged and sorted chronologically.
 *
 * @param {string} batchId
 * @returns {object} Batch passport
 */
export const getBatchPassport = async (batchId) => {
    const batch = await Batch.findById(batchId).lean();
    if (!batch) throw Object.assign(new Error("Batch not found"), { statusCode: 404 });

    // Load all related records in parallel
    const [inspections, predictions, recommendations] = await Promise.all([
        QualityInspection.find({ batchId }).sort({ createdAt: 1 }).lean(),
        Prediction.find({ batchId }).sort({ createdAt: 1 }).lean(),
        Recommendation.find({ batchId }).sort({ createdAt: 1 }).lean(),
    ]);

    // Build timeline events
    const events = [];

    // Batch creation
    events.push({
        type: "BATCH_CREATED",
        timestamp: batch.createdAt,
        summary: `Batch created: ${batch.quantity} ${batch.unit} of ${batch.productName} from ${batch.origin}`,
        data: {
            batchCode: batch.batchCode,
            origin: batch.origin,
            harvestDate: batch.harvestDate,
            arrivalDate: batch.arrivalDate,
        },
    });

    // Quality inspections
    for (const insp of inspections) {
        events.push({
            type: "QUALITY_INSPECTION",
            timestamp: insp.createdAt,
            summary: `${insp.inspectionType} inspection performed`,
            data: {
                inspectionType: insp.inspectionType,
                visualScore: insp.visualQuality?.score,
                firmness: insp.physicalQuality?.firmness,
                visibleDefects: insp.visualQuality?.visibleDefects,
                temperature: insp.environmentalData?.temperature,
                humidity: insp.environmentalData?.humidity,
            },
        });
    }

    // Predictions
    for (const pred of predictions) {
        events.push({
            type: "PREDICTION",
            timestamp: pred.createdAt,
            summary: `Freshness estimated: ${pred.freshnessScore}/100 | Shelf life: ${pred.shelfLifeDays} days | Risk: ${pred.riskLevel}`,
            data: {
                freshnessScore: pred.freshnessScore,
                shelfLifeDays: pred.shelfLifeDays,
                spoilageProbability: pred.spoilageProbability,
                riskLevel: pred.riskLevel,
                source: pred.source,
                confidence: pred.confidence,
            },
        });
    }

    // Recommendations
    for (const rec of recommendations) {
        events.push({
            type: "RECOMMENDATION",
            timestamp: rec.createdAt,
            summary: `Recommended action: ${rec.actionType} (${rec.urgencyLevel} urgency)`,
            data: {
                actionType: rec.actionType,
                urgencyLevel: rec.urgencyLevel,
                targetMarket: rec.targetMarket,
                reason: rec.reason,
            },
        });
    }

    // Sort all events chronologically
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Supply-chain stage progression
    const stages = [
        { stage: "FARM", completed: true, date: batch.harvestDate },
        { stage: "HARVEST", completed: true, date: batch.harvestDate },
        { stage: "TRANSPORT", completed: !!batch.arrivalDate, date: batch.arrivalDate },
        {
            stage: "WAREHOUSE",
            completed: batch.status === "ACTIVE" || batch.status === "SOLD",
            date: batch.arrivalDate,
        },
        {
            stage: "SOLD",
            completed: batch.status === "SOLD" || batch.status === "PARTIALLY_SOLD",
            date: null,
        },
    ];

    return {
        batchId: batch._id,
        batchCode: batch.batchCode,
        productName: batch.productName,
        produceType: batch.produceType,
        variety: batch.variety,
        quantity: batch.quantity,
        unit: batch.unit,
        origin: batch.origin,
        currentLocation: batch.currentLocation,
        status: batch.status,
        harvestDate: batch.harvestDate,
        arrivalDate: batch.arrivalDate,

        // Latest freshness snapshot
        currentFreshness: {
            freshnessScore: batch.latestFreshnessScore,
            shelfLifeDays: batch.latestShelfLifeDays,
            spoilageProbability: batch.latestSpoilageProbability,
            lastUpdated: batch.latestPredictionAt,
        },

        supplyChainStages: stages,
        timeline: events,
        totalEvents: events.length,
    };
};

/**
 * Get a summary of all batches at each supply-chain stage.
 */
export const getSupplyChainSummary = async () => {
    const result = await Batch.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalKg: { $sum: "$quantity" },
                locations: { $addToSet: "$currentLocation" },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    return result;
};
