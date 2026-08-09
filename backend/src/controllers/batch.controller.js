import {
    createBatch,
    getAllBatches,
    getBatchById,
    updateBatch,
    deleteBatch,
} from "../services/batch.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const createBatchController = async (req, res, next) => {
    try {
        const batch = await createBatch(req.body);
        return sendSuccess(res, 201, batch, "Batch created successfully");
    } catch (error) {
        next(error);
    }
};

export const getAllBatchesController = async (req, res, next) => {
    try {
        const filters = {
            produceType: req.query.produceType,
            status: req.query.status,
            currentLocation: req.query.currentLocation,
        };

        const options = {
            page: req.query.page,
            limit: req.query.limit,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
        };

        const { batches, pagination } = await getAllBatches(filters, options);
        return sendSuccess(res, 200, batches, null, pagination);
    } catch (error) {
        next(error);
    }
};

export const getBatchByIdController = async (req, res, next) => {
    try {
        const batch = await getBatchById(req.params.id);
        if (!batch) return sendError(res, 404, "Batch not found");
        return sendSuccess(res, 200, batch);
    } catch (error) {
        next(error);
    }
};

export const updateBatchController = async (req, res, next) => {
    try {
        const batch = await updateBatch(req.params.id, req.body);
        if (!batch) return sendError(res, 404, "Batch not found");
        return sendSuccess(res, 200, batch, "Batch updated successfully");
    } catch (error) {
        next(error);
    }
};

export const deleteBatchController = async (req, res, next) => {
    try {
        const batch = await deleteBatch(req.params.id);
        if (!batch) return sendError(res, 404, "Batch not found");
        return sendSuccess(res, 200, null, "Batch deleted successfully");
    } catch (error) {
        next(error);
    }
};