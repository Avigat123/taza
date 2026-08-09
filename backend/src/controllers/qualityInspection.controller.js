import {
    createInspection,
    getInspectionsByBatchId,
    getInspectionById,
    deleteInspection,
} from "../services/qualityInspection.service.js";
import { getBatchById } from "../services/batch.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const createInspectionController = async (req, res, next) => {
    try {
        const batch = await getBatchById(req.params.batchId);
        if (!batch) return sendError(res, 404, "Batch not found");

        const inspection = await createInspection(req.params.batchId, req.body);
        return sendSuccess(res, 201, inspection, "Quality inspection recorded");
    } catch (error) {
        next(error);
    }
};

export const getInspectionsController = async (req, res, next) => {
    try {
        const batch = await getBatchById(req.params.batchId);
        if (!batch) return sendError(res, 404, "Batch not found");

        const inspections = await getInspectionsByBatchId(req.params.batchId);
        return sendSuccess(res, 200, inspections);
    } catch (error) {
        next(error);
    }
};

export const getInspectionByIdController = async (req, res, next) => {
    try {
        const inspection = await getInspectionById(req.params.inspectionId);
        if (!inspection) return sendError(res, 404, "Inspection not found");
        return sendSuccess(res, 200, inspection);
    } catch (error) {
        next(error);
    }
};

export const deleteInspectionController = async (req, res, next) => {
    try {
        const inspection = await deleteInspection(req.params.inspectionId);
        if (!inspection) return sendError(res, 404, "Inspection not found");
        return sendSuccess(res, 200, null, "Inspection deleted successfully");
    } catch (error) {
        next(error);
    }
};
