import {
    createBatch,
    getAllBatches,
    getBatchById,
    updateBatch,
    deleteBatch,
} from "../services/batch.service.js";

export const createBatchController = async (req, res, next) => {
    try {
        const batch = await createBatch(req.body);

        res.status(201).json({
            success: true,
            data: batch,
        });
    } catch (error) {
        next(error);
    }
};

export const getAllBatchesController = async (req, res, next) => {
    try {
        const batches = await getAllBatches();

        res.status(200).json({
            success: true,
            data: batches,
        });
    } catch (error) {
        next(error);
    }
};

export const getBatchByIdController = async (req, res, next) => {
    try {
        const batch = await getBatchById(req.params.id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found",
            });
        }

        res.status(200).json({
            success: true,
            data: batch,
        });
    } catch (error) {
        next(error);
    }
};

export const updateBatchController = async (req, res, next) => {
    try {
        const batch = await updateBatch(req.params.id, req.body);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found",
            });
        }

        res.status(200).json({
            success: true,
            data: batch,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteBatchController = async (req, res, next) => {
    try {
        const batch = await deleteBatch(req.params.id);

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: "Batch not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Batch deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};