import mongoose from "mongoose";

const qualityInspectionSchema = new mongoose.Schema(
    {
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch",
            required: true,
        },

        inspectionType: {
            type: String,
            enum: ["MANUAL", "IMAGE", "SENSOR"],
            required: true,
        },

        visualQuality: {
            score: {
                type: Number,
                min: 0,
                max: 100,
            },

            color: {
                type: String,
                trim: true,
            },

            visibleDefects: [
                {
                    type: String,
                    trim: true,
                },
            ],
        },

        physicalQuality: {
            firmness: {
                type: Number,
                min: 0,
                max: 100,
            },

            surfaceCondition: {
                type: String,
                trim: true,
            },
        },

        environmentalData: {
            temperature: {
                type: Number,
            },

            humidity: {
                type: Number,
                min: 0,
                max: 100,
            },
        },

        imageUrl: {
            type: String,
            trim: true,
        },

        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const QualityInspection = mongoose.model(
    "QualityInspection",
    qualityInspectionSchema
);

export default QualityInspection;