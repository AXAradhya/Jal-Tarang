import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired rate limit entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 120_000).unref();

export function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = 'Too many requests. Please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, allow bypassing rate limits for rapid automated test runs
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const userId = (req as any).user?.userId;
    const clientKey = userId ? `user:${userId}` : `ip:${ip}`;
    const key = `${req.baseUrl || req.path}:${clientKey}`;

    const now = Date.now();
    let record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      rateLimitStore.set(key, record);
    } else {
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

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests/minute
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 attempts/minute
  message: 'Too many authentication attempts. Please wait 60 seconds.',
});
