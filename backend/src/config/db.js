import mongoose from "mongoose";
import env from "./env.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
    try {
        await mongoose.connect(env.mongoUri);
        logger.info("MongoDB connected", { uri: env.mongoUri?.split("@")[1] }); // don't log credentials

        // Seed demo market data on first connection (no-op if already seeded)
        const { seedDemoMarketPrices } = await import("../services/market.service.js");
        await seedDemoMarketPrices();
    } catch (error) {
        logger.error("MongoDB connection failed", { message: error.message });
        process.exit(1);
    }
};

export default connectDB;