import Batch from "../models/Batch.js";

export const createBatch = async (batchData) => {
    const batch = await Batch.create(batchData);

    return batch;
};

export const getAllBatches = async () => {
    const batches = await Batch.find().sort({ createdAt: -1 });

    return batches;
};

export const getBatchById = async (batchId) => {
    const batch = await Batch.findById(batchId);

    return batch;
};

export const updateBatch = async (batchId, updateData) => {
    const batch = await Batch.findByIdAndUpdate(
        batchId,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    return batch;
};

export const deleteBatch = async (batchId) => {
    const batch = await Batch.findByIdAndDelete(batchId);

    return batch;
};