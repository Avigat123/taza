import dotenv from "dotenv";

dotenv.config();

const env = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV || "development",
    // Base URL of the Python FastAPI AI service (Layer 1 CV + Layer 2
    // shelf-life RAG + Layer 3 decision engine). See backend/ai_services.
    aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
    // How long Express waits for the Python AI service per request.
    aiServiceTimeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS) || 120_000,
};

export default env;