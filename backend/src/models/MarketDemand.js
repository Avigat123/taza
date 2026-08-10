import mongoose from "mongoose";

/**
 * MarketDemand — real, user-provided market demand and route data for a
 * batch, captured for the sole purpose of building the Python AI
 * service's DecisionRequest (ai/decision/schema.py) exactly as-is.
 *
 * IMPORTANT: This model stores ONLY what the person actually entered.
 * No demand/price/route values are invented or defaulted here — that is
 * enforced both by Mongoose validators (min: 0) and by the service layer
 * (marketDemand.service.js), which rejects negative values before they
 * ever reach Mongo.
 *
 * Field names mirror ai/decision/schema.py's MarketInfo / RouteInfo /
 * DecisionRequest exactly in meaning (camelCase here, snake_case when
 * sent to Python — see mlProxy.service.js#getDecision):
 *   MarketInfo  -> { location, demandKg, pricePerKg }
 *   RouteInfo   -> { destination, transportHours, transportCost }
 *   local market -> localMarket: MarketInfo | null
 */

const marketInfoSchema = new mongoose.Schema(
    {
        location: {
            type: String,
            required: true,
            trim: true,
        },
        demandKg: {
            // Maps to MarketInfo.demand_kg (ge=0, le=1_000_000 in Python)
            type: Number,
            required: true,
            min: [0, "demandKg cannot be negative"],
            max: 1_000_000,
        },
        pricePerKg: {
            // Maps to MarketInfo.price_per_kg (ge=0, le=100_000 in Python)
            type: Number,
            required: true,
            min: [0, "pricePerKg cannot be negative"],
            max: 100_000,
        },
    },
    { _id: false }
);

const routeInfoSchema = new mongoose.Schema(
    {
        destination: {
            type: String,
            required: true,
            trim: true,
        },
        transportHours: {
            // Maps to RouteInfo.transport_hours (ge=0, le=2000 in Python)
            type: Number,
            required: true,
            min: [0, "transportHours cannot be negative"],
            max: 2000,
        },
        transportCost: {
            // Maps to RouteInfo.transport_cost (ge=0, le=10_000_000 in Python)
            type: Number,
            required: true,
            min: [0, "transportCost cannot be negative"],
            max: 10_000_000,
        },
    },
    { _id: false }
);

const marketDemandSchema = new mongoose.Schema(
    {
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
            required: true,
            index: true,
        },

        markets: {
            // Real, user-entered markets for this batch. Each destination
            // referenced here should normally have a matching RouteInfo in
            // `routes` (except the local market, which is transport-free) —
            // Python's DecisionRequest validator tolerates a mismatch by
            // surfacing it as missing_information rather than rejecting it,
            // so Express does not duplicate that check here.
            type: [marketInfoSchema],
            default: [],
        },

        routes: {
            type: [routeInfoSchema],
            default: [],
        },

        localMarket: {
            // Optional: MarketInfo for the zero-transport local market
            // (transport_hours=0, transport_cost=0 implied by Python).
            type: marketInfoSchema,
            default: null,
        },

        source: {
            // Always "user_provided" — this collection never stores demo
            // or fabricated data. Kept for parity/auditability with
            // MarketPrice.source, not as a way to smuggle in demo data.
            type: String,
            default: "user_provided",
            immutable: true,
        },
    },
    { timestamps: true }
);

marketDemandSchema.index({ batchId: 1, createdAt: -1 });

const MarketDemand = mongoose.model("MarketDemand", marketDemandSchema);

export default MarketDemand;
