import mongoose from "mongoose";

/**
 * MarketPrice — represents a price observation for a produce type
 * at a specific market and point in time.
 *
 * IMPORTANT: Do NOT invent prices. Every record must have a `source` and
 * an `isEstimate` flag so the UI can display appropriate disclaimers.
 */
const marketPriceSchema = new mongoose.Schema(
    {
        produceType: {
            // Normalised lowercase: "mango", "tomato", etc.
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        variety: {
            // Optional: "alphonso", "kesar"
            type: String,
            trim: true,
            default: null,
        },

        market: {
            // Market name: "Azadpur", "Vashi", "Koyambedu"
            type: String,
            required: true,
            trim: true,
        },

        location: {
            // City: "Delhi", "Mumbai", "Chennai"
            type: String,
            required: true,
            trim: true,
        },

        state: {
            // Indian state: "Delhi", "Maharashtra"
            type: String,
            trim: true,
            default: null,
        },

        pricePerKg: {
            // ₹ per kg (or per unit if unit is specified)
            type: Number,
            required: true,
            min: 0,
        },

        unit: {
            type: String,
            default: "kg",
            trim: true,
        },

        priceMin: {
            // Lowest observed price in this market on this date
            type: Number,
            min: 0,
            default: null,
        },

        priceMax: {
            // Highest observed price
            type: Number,
            min: 0,
            default: null,
        },

        demandLevel: {
            // Market demand signal
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "UNKNOWN"],
            default: "UNKNOWN",
        },

        // ── Distance / logistics from reference origin ────────────────────────
        // These are populated per-query or stored as reference data
        distanceFromKm: {
            // km from a reference location — filled dynamically or by seed data
            type: Number,
            default: null,
        },

        estimatedTransportTimeHours: {
            type: Number,
            default: null,
        },

        // ── Price metadata ────────────────────────────────────────────────────
        observationDate: {
            type: Date,
            required: true,
            default: Date.now,
        },

        source: {
            // "agmarknet" | "manual" | "demo_seed" | "market_dataset" | "estimate"
            type: String,
            required: true,
            default: "manual",
        },

        isEstimate: {
            // True if price was estimated, not directly observed
            type: Boolean,
            default: false,
        },

        confidenceLevel: {
            // How confident we are in this price record
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH"],
            default: "MEDIUM",
        },

        notes: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

marketPriceSchema.index({ produceType: 1, location: 1, observationDate: -1 });
marketPriceSchema.index({ market: 1, observationDate: -1 });

const MarketPrice = mongoose.model("MarketPrice", marketPriceSchema);

export default MarketPrice;
