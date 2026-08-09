import express from "express";
import cors from "cors";
import batchRoutes from "./routes/batch.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Taza backend is running",
    });
});

app.use("/api/batches", batchRoutes);


export default app;