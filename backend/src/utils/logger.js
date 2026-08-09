/**
 * Taza — simple structured logger.
 * Writes timestamped JSON-ish lines to stdout/stderr.
 * Replace with winston/pino later if needed — the interface stays the same.
 */

const levels = {
    info: "INFO",
    warn: "WARN",
    error: "ERROR",
    debug: "DEBUG",
};

const format = (level, message, meta = {}) => {
    const ts = new Date().toISOString();
    const hasMeta = Object.keys(meta).length > 0;
    const metaStr = hasMeta ? " " + JSON.stringify(meta) : "";
    return `[${ts}] [${level}] ${message}${metaStr}`;
};

const logger = {
    info: (message, meta = {}) =>
        console.log(format(levels.info, message, meta)),

    warn: (message, meta = {}) =>
        console.warn(format(levels.warn, message, meta)),

    error: (message, meta = {}) =>
        console.error(format(levels.error, message, meta)),

    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV !== "production") {
            console.log(format(levels.debug, message, meta));
        }
    },
};

export default logger;
