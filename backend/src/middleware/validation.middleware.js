/**
 * Taza — request body validation middleware factory.
 *
 * Usage:
 *   import { validateBody } from '../middleware/validation.middleware.js';
 *   router.post('/', validateBody(['productName', 'quantity']), controller);
 *
 * Checks that every required field exists and is not null/undefined/empty-string.
 * For deeper schema validation, replace this with zod/joi later — the interface stays.
 */

import { sendError } from "../utils/response.js";

/**
 * Returns an Express middleware that checks for required fields in req.body.
 * @param {string[]} requiredFields
 */
export const validateBody = (requiredFields) => (req, res, next) => {
    const missing = requiredFields.filter(
        (field) =>
            req.body[field] === undefined ||
            req.body[field] === null ||
            req.body[field] === ""
    );

    if (missing.length > 0) {
        return sendError(
            res,
            400,
            `Missing required field(s): ${missing.join(", ")}`
        );
    }

    next();
};

/**
 * Returns an Express middleware that checks for required query params.
 * @param {string[]} requiredParams
 */
export const validateQuery = (requiredParams) => (req, res, next) => {
    const missing = requiredParams.filter(
        (param) =>
            req.query[param] === undefined ||
            req.query[param] === null ||
            req.query[param] === ""
    );

    if (missing.length > 0) {
        return sendError(
            res,
            400,
            `Missing required query parameter(s): ${missing.join(", ")}`
        );
    }

    next();
};
