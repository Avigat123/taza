import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
            trim: true,
        },

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

        currentLocation: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["ACTIVE", "SOLD", "SPOILED", "REDIRECTED"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
    }
);

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;