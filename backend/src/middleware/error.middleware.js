/**
 * Taza — centralised error-handling middleware.
 *
 * Must be registered LAST in Express, after all routes.
 * Handles:
 *  - Mongoose CastError   → 400 (invalid ObjectId in URL param)
 *  - Mongoose ValidationError → 422 (schema validation failed)
 *  - Duplicate key (code 11000) → 409
 *  - Generic application errors → 500
 */

import logger from "../utils/logger.js";

const errorMiddleware = (err, req, res, next) => {
    logger.error(err.message, { stack: err.stack, path: req.path });

    // --- Mongoose: bad ObjectId (:id param is not a valid ObjectId) ---
    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid value for field '${err.path}': ${err.value}`,
        });
    }

    // --- Mongoose: document validation failed ---
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
        return res.status(422).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    // --- MongoDB: duplicate key (unique index violated) ---
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "field";
        return res.status(409).json({
            success: false,
            message: `Duplicate value for '${field}'. Please use a different value.`,
        });
    }

    // --- Default ---
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};

export default errorMiddleware;