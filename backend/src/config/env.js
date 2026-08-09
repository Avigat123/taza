import dotenv from "dotenv";

dotenv.config();

const env = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV || "development",
};

export default env;