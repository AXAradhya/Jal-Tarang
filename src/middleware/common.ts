import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a unique request-id and standardized logging to every request.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} +${ms}ms rid=${requestId}`
    );
  });
  next();
};

/**
 * Global error handler – converts thrown errors to JSON API responses.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  console.error(`[ERROR] ${(req as any).requestId || '-'} ${err.message}`, err.stack);
  res.status(status).json({
    success: false,
    requestId: (req as any).requestId,
    error: {
      code,
      message: err.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && process.env.DEBUG_STACK === 'true' && { stack: err.stack }),
    },
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
