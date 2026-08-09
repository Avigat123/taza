import express from "express";

import {
    createBatchController,
    getAllBatchesController,
    getBatchByIdController,
    updateBatchController,
    deleteBatchController,
} from "../controllers/batch.controller.js";

const router = express.Router();

router.post("/", createBatchController);

router.get("/", getAllBatchesController);

router.get("/:id", getBatchByIdController);

router.put("/:id", updateBatchController);

router.delete("/:id", deleteBatchController);

export default router;