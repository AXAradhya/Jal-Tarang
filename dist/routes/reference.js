"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceRouter = void 0;
const express_1 = require("express");
const ExchangeRateService_js_1 = require("../services/ingestion/ExchangeRateService.js");
const index_js_1 = require("../db/index.js");
exports.referenceRouter = (0, express_1.Router)();
exports.referenceRouter.get('/exchange-rates', async (_req, res) => {
    try {
        let rate = 95.00;
        let source = 'DEFAULT_BENCHMARK';
        let updatedAt = new Date().toISOString();
        try {
            const dbRes = await index_js_1.pool.query(`SELECT rate, effective_date, source, created_at
         FROM currency_rates
         WHERE base_currency = 'USD' AND quote_currency = 'INR'
         ORDER BY created_at DESC LIMIT 1`);
            if (dbRes.rows.length > 0) {
                rate = Number(dbRes.rows[0].rate);
                source = dbRes.rows[0].source || 'POSTGRESQL_CACHE';
                updatedAt = dbRes.rows[0].created_at || new Date().toISOString();
            }
            else {
                const live = await ExchangeRateService_js_1.ExchangeRateService.syncRates();
                rate = live.inr;
                source = 'LIVE_OPEN_ER_API';
            }
        }
        catch {
            const live = await ExchangeRateService_js_1.ExchangeRateService.fetchLatestRates();
            rate = live.inr;
            source = 'LIVE_OPEN_ER_API';
        }
        return res.json({
            success: true,
            data: {
                base: 'USD',
                target: 'INR',
                rate,
                usdToInr: rate,
                timestamp: updatedAt,
                source,
            },
        });
    }
    catch (err) {
        return res.json({
            success: true,
            data: {
                base: 'USD',
                target: 'INR',
                rate: 95.00,
                usdToInr: 95.00,
                timestamp: new Date().toISOString(),
                source: 'FALLBACK_BENCHMARK',
            },
        });
    }
});
exports.referenceRouter.get('/contract-statuses', (_req, res) => {
    return res.json({
        success: true,
        data: [
            { code: 'ALL', label: 'All Statuses' },
            { code: 'ACTIVE', label: 'Active / Operational' },
            { code: 'CONFIRMED', label: 'Confirmed / Fixed' },
            { code: 'COMPLETED', label: 'Completed / Discharged' },
            { code: 'PENDING_APPROVAL', label: 'Pending Management Sign-off' },
            { code: 'CANCELLED', label: 'Cancelled / Voided' },
        ],
    });
});
//# sourceMappingURL=reference.js.map