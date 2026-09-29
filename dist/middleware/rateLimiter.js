"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.apiRateLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
const rateLimitStore = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetAt) {
            rateLimitStore.delete(key);
        }
    }
}, 120_000).unref();
function createRateLimiter(options) {
    const { windowMs, max, message = 'Too many requests. Please try again later.' } = options;
    return (req, res, next) => {
        if (process.env.NODE_ENV === 'test') {
            next();
            return;
        }
        const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
        const userId = req.user?.userId;
        const clientKey = userId ? `user:${userId}` : `ip:${ip}`;
        const key = `${req.baseUrl || req.path}:${clientKey}`;
        const now = Date.now();
        let record = rateLimitStore.get(key);
        if (!record || now > record.resetAt) {
            record = { count: 1, resetAt: now + windowMs };
            rateLimitStore.set(key, record);
        }
        else {
            record.count += 1;
        }
        const remaining = Math.max(0, max - record.count);
        const resetSec = Math.ceil((record.resetAt - now) / 1000);
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', resetSec);
        if (record.count > max) {
            res.setHeader('Retry-After', resetSec);
            res.status(429).json({
                success: false,
                error: {
                    code: 'TOO_MANY_REQUESTS',
                    message,
                    retryAfterSec: resetSec,
                },
            });
            return;
        }
        next();
    };
}
exports.apiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 120,
});
exports.authRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 15,
    message: 'Too many authentication attempts. Please wait 60 seconds.',
});
//# sourceMappingURL=rateLimiter.js.map