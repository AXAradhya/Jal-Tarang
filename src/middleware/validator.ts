import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitizes string inputs to strip null bytes (\0) and dangerous control characters.
 */
function sanitizeInput(val: any): any {
  if (typeof val === 'string') {
    // Strip null bytes and bidirectional/invisible control chars
    return val.replace(/\0/g, '').replace(/[\u202A-\u202E]/g, '');
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeInput);
  }
  if (val !== null && typeof val === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = sanitizeInput(v);
    }
    return res;
  }
  return val;
}

/**
 * Validates request input bounds to protect against chaos injection and buffer exhaustion.
 */
export const inputValidator = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Sanitize null-bytes on query, params, body
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query) as any;
  if (req.params) req.params = sanitizeInput(req.params);

  // 2. Validate payload size and field lengths
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        const isLongTextField = ['notes', 'description', 'terms_conditions', 'termsConditions', 'quality_specs', 'qualitySpecs', 'query'].includes(key);
        const maxLen = isLongTextField ? 10000 : 255;
        if (value.length > maxLen) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: `Field '${key}' exceeds maximum allowed length of ${maxLen} characters`,
            },
          });
          return;
        }
      }

      // Check numeric bounds
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: `Field '${key}' must be a finite number`,
            },
          });
          return;
        }
        // Protect positive quantity/financial fields against negative chaos values
        const isPositiveField = ['quantity', 'quantityRequiredMt', 'cargo_quantity_mt', 'rate_usd', 'budget_usd', 'price'].some(p => key.toLowerCase().includes(p));
        if (isPositiveField && value < 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: `Field '${key}' cannot be negative`,
            },
          });
          return;
        }
      }

      // Validate date fields
      if (typeof value === 'string' && key.toLowerCase().includes('date')) {
        const parsed = Date.parse(value);
        if (!isNaN(parsed)) {
          const year = new Date(parsed).getUTCFullYear();
          if (year < 1950 || year > 2100) {
            res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_FAILED',
                message: `Field '${key}' has an out-of-range year (${year}). Allowed range is 1950-2100.`,
              },
            });
            return;
          }
        }
      }
    }
  }

  next();
};
