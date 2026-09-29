"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputValidator = void 0;
function sanitizeInput(val) {
    if (typeof val === 'string') {
        return val.replace(/\0/g, '').replace(/[\u202A-\u202E]/g, '');
    }
    if (Array.isArray(val)) {
        return val.map(sanitizeInput);
    }
    if (val !== null && typeof val === 'object') {
        const res = {};
        for (const [k, v] of Object.entries(val)) {
            res[k] = sanitizeInput(v);
        }
        return res;
    }
    return val;
}
const inputValidator = (req, res, next) => {
    if (req.body)
        req.body = sanitizeInput(req.body);
    if (req.query)
        req.query = sanitizeInput(req.query);
    if (req.params)
        req.params = sanitizeInput(req.params);
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
exports.inputValidator = inputValidator;
//# sourceMappingURL=validator.js.map