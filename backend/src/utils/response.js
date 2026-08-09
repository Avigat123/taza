/**
 * Taza — centralised response helpers.
 * All controllers should use these instead of constructing inline objects,
 * so the API envelope shape stays consistent.
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {number} statusCode  HTTP status (default 200)
 * @param {*} data             Payload (object, array, or null)
 * @param {string} [message]   Optional human-readable message
 * @param {object} [meta]      Optional pagination / extra metadata
 */
export const sendSuccess = (res, statusCode = 200, data = null, message = null, meta = null) => {
    const body = { success: true };
    if (message) body.message = message;
    if (data !== null) body.data = data;
    if (meta !== null) body.meta = meta;
    return res.status(statusCode).json(body);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {number} statusCode  HTTP status (default 500)
 * @param {string} message     Error message
 * @param {object} [errors]    Optional field-level validation errors
 */
export const sendError = (res, statusCode = 500, message = "Internal Server Error", errors = null) => {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
};
