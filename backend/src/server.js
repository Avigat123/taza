import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import errorMiddleware from "./middleware/error.middleware.js";
import Batch from "./models/Batch.js";

const startServer = async () => {
    await connectDB();

    app.use(errorMiddleware);

    app.listen(env.port, () => {
        console.log(`Taza backend running on port ${env.port}`);
    });
};

startServer();