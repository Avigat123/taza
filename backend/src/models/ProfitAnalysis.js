import mongoose from "mongoose";

/**
 * ProfitAnalysis — stores a profit/loss calculation for a batch
 * across multiple destination markets.
 *
 * One document per analysis run. A new analysis can be triggered any time
 * batch conditions or market prices change.
 */
const profitAnalysisSchema = new mongoose.Schema(
    {
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
            required: true,
        },

        predictionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prediction",
            default: null,
        },

        // Snapshot of inputs used for this analysis (for auditability)
        inputSnapshot: {
            quantity: Number,
            produceType: String,
            freshnessScore: Number,
            shelfLifeDays: Number,
            spoilageProbability: Number,
            procurementCostPerKg: { type: Number, default: null },
        },

        // Results per destination
        marketAnalysis: [
            {
                market: String,
                location: String,
                pricePerKg: Number,
                transportCostPerKg: { type: Number, default: null },
                transportCostTotal: { type: Number, default: null },
                expectedSpoilageFraction: Number,
                expectedSpoilagePercent: Number,
                sellableQuantity: Number,
                spoiledQuantity: Number,
                grossRevenue: Number,
                procurementCost: { type: Number, default: null },
                storageCost: { type: Number, default: null },
                spoilageLoss: Number,
                expectedProfit: { type: Number, default: null },
                profitPerKg: { type: Number, default: null },
                wastePercent: Number,
                risk: String,
                isFeasible: { type: Boolean, default: null },
                isPartialCalculation: Boolean,
                missingInputs: [String],
            },
        ],

        // Best action identified
        bestMarket: {
            type: String,
            default: null,
        },

        bestExpectedProfit: {
            type: Number,
            default: null,
        },

        missingCostInputs: {
            // Flags which cost inputs were unavailable across all markets
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

profitAnalysisSchema.index({ batchId: 1, createdAt: -1 });

const ProfitAnalysis = mongoose.model("ProfitAnalysis", profitAnalysisSchema);

export default ProfitAnalysis;
