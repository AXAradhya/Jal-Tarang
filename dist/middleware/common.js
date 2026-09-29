"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.requestLogger = void 0;
const uuid_1 = require("uuid");
const requestLogger = (req, res, next) => {
    const requestId = (0, uuid_1.v4)();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} +${ms}ms rid=${requestId}`);
    });
    next();
};
exports.requestLogger = requestLogger;
const errorHandler = (err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    console.error(`[ERROR] ${req.requestId || '-'} ${err.message}`, err.stack);
    res.status(status).json({
        success: false,
        requestId: req.requestId,
        error: {
            code,
            message: err.message || 'An unexpected error occurred',
            ...(process.env.NODE_ENV === 'development' && process.env.DEBUG_STACK === 'true' && { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=common.js.map