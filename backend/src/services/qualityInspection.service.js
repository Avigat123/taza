import QualityInspection from "../models/QualityInspection.js";
import logger from "../utils/logger.js";

/**
 * Create a quality inspection record for a batch.
 * @param {string} batchId
 * @param {object} inspectionData
 */
export const createInspection = async (batchId, inspectionData) => {
    const inspection = await QualityInspection.create({
        batchId,
        ...inspectionData,
    });
    logger.info("Quality inspection created", { batchId, inspectionType: inspection.inspectionType });
    return inspection;
};

/**
 * Get all inspections for a batch, most recent first.
 */
export const getInspectionsByBatchId = async (batchId) => {
    return QualityInspection.find({ batchId }).sort({ createdAt: -1 });
};

/**
 * Get a single inspection by its own ID.
 */
export const getInspectionById = async (inspectionId) => {
    return QualityInspection.findById(inspectionId).populate("batchId", "batchCode productName");
};

/**
 * Get the most recent inspection for a batch.
 * Used by the freshness service to get the latest signal data.
 */
export const getLatestInspectionForBatch = async (batchId) => {
    return QualityInspection.findOne({ batchId }).sort({ createdAt: -1 });
};

/**
 * Delete an inspection by ID.
 */
export const deleteInspection = async (inspectionId) => {
    return QualityInspection.findByIdAndDelete(inspectionId);
};
