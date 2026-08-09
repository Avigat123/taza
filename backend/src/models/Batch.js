import mongoose from "mongoose";

/**
 * Batch — represents a physical consignment of fresh produce moving through
 * the supply chain.
 *
 * Core fields are all required for the freshness/market/profit engines.
 * Cost fields are optional — the profit engine gracefully handles their absence.
 */
const batchSchema = new mongoose.Schema(
    {
        // ── Identity ────────────────────────────────────────────────────────
        batchCode: {
            type: String,
            unique: true,
            trim: true,
            // Auto-generated in service if not supplied by caller
        },

        // ── Produce information ──────────────────────────────────────────────
        produceType: {
            // Normalised lowercase key, e.g. "mango", "tomato", "banana"
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        productName: {
            // Display name, e.g. "Alphonso Mango", "Cherry Tomato"
            type: String,
            required: true,
            trim: true,
        },

        variety: {
            // e.g. "Alphonso", "Kesar" — optional
            type: String,
            trim: true,
        },

        // ── Quantity ─────────────────────────────────────────────────────────
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },

        unit: {
            type: String,
            required: true,
            trim: true,
            default: "kg",
        },

        // ── Provenance ───────────────────────────────────────────────────────
        origin: {
            type: String,
            required: true,
            trim: true,
        },

        harvestDate: {
            type: Date,
            required: true,
        },

        arrivalDate: {
            type: Date,
            required: true,
        },

        // ── Location ─────────────────────────────────────────────────────────
        currentLocation: {
            type: String,
            required: true,
            trim: true,
        },

        // ── Cost information (optional — profit engine uses if available) ────
        procurementCostPerKg: {
            // Purchase/acquisition cost per kg in ₹. Null means unknown.
            type: Number,
            min: 0,
            default: null,
        },

        storageCostPerKgPerDay: {
            // Daily storage cost per kg in ₹. Null means unknown.
            type: Number,
            min: 0,
            default: null,
        },

        // ── Storage environment (latest known reading) ───────────────────────
        storageTemperatureCelsius: {
            type: Number,
            default: null,
        },

        storageHumidityPercent: {
            type: Number,
            min: 0,
            max: 100,
            default: null,
        },

        // ── Supply-chain state ───────────────────────────────────────────────
        status: {
            type: String,
            enum: ["ACTIVE", "SOLD", "PARTIALLY_SOLD", "SPOILED", "REDIRECTED", "IN_TRANSIT"],
            default: "ACTIVE",
        },

        // ── Latest prediction cache (updated when prediction runs) ───────────
        latestFreshnessScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null,
        },

        latestShelfLifeDays: {
            type: Number,
            min: 0,
            default: null,
        },

        latestSpoilageProbability: {
            type: Number,
            min: 0,
            max: 1,
            default: null,
        },

        latestPredictionAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
batchSchema.index({ produceType: 1, status: 1 });
batchSchema.index({ currentLocation: 1 });
batchSchema.index({ harvestDate: -1 });

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;