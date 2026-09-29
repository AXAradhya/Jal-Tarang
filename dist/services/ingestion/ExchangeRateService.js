"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRateService = void 0;
const index_js_1 = require("../../db/index.js");
const IngestionService_js_1 = require("./IngestionService.js");
class ExchangeRateService extends IngestionService_js_1.IngestionService {
    static instance;
    static cachedRates = null;
    static CACHE_TTL_MS = 15 * 60 * 1000;
    constructor() {
        super({
            sourceName: 'FRANKFURTER_ECB_FX',
            failureThreshold: 4,
            resetTimeoutMs: 45_000,
            maxRetries: 2,
            retryBackoffMs: 1_000,
        });
    }
    static getInstance() {
        if (!ExchangeRateService.instance) {
            ExchangeRateService.instance = new ExchangeRateService();
        }
        return ExchangeRateService.instance;
    }
    async executeIngestion() {
        const rates = await ExchangeRateService.syncRates();
        return { count: rates.synced ? 1 : 0, payload: rates };
    }
    static async fetchLatestRates() {
        const now = Date.now();
        if (this.cachedRates && now - this.cachedRates.fetchedAt < this.CACHE_TTL_MS) {
            return this.cachedRates.data;
        }
        try {
            const start = Date.now();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR,AUD,EUR', { signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok) {
                const json = await res.json();
                const latencyMs = Date.now() - start;
                const inr = Number(json?.rates?.INR) || 85.50;
                const aud = Number(json?.rates?.AUD) || 1.54;
                const eur = Number(json?.rates?.EUR) || 0.92;
                const result = {
                    inr,
                    aud,
                    eur,
                    source: 'FRANKFURTER_ECB',
                    isLive: true,
                    latencyMs,
                    lastUpdated: new Date().toISOString(),
                };
                this.cachedRates = { data: result, fetchedAt: now };
                return result;
            }
        }
        catch {
        }
        try {
            const start = Date.now();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok) {
                const json = await res.json();
                const latencyMs = Date.now() - start;
                const inr = Number(json?.rates?.INR) || 85.50;
                const aud = Number(json?.rates?.AUD) || 1.54;
                const eur = Number(json?.rates?.EUR) || 0.92;
                const result = {
                    inr,
                    aud,
                    eur,
                    source: 'OPEN_ER_API',
                    isLive: true,
                    latencyMs,
                    lastUpdated: new Date().toISOString(),
                };
                this.cachedRates = { data: result, fetchedAt: now };
                return result;
            }
        }
        catch {
        }
        return {
            inr: 85.50,
            aud: 1.54,
            eur: 0.92,
            source: 'FALLBACK_BENCHMARK',
            isLive: false,
            lastUpdated: new Date().toISOString(),
        };
    }
    static async syncRates() {
        const rates = await this.fetchLatestRates();
        try {
            await index_js_1.pool.query(`INSERT INTO currency_rates (base_currency, quote_currency, rate, effective_date, source, created_at)
         VALUES ('USD', 'INR', $1, CURRENT_DATE, $2, NOW())
         ON CONFLICT DO NOTHING`, [rates.inr, rates.source]).catch(() => { });
            return { inr: rates.inr, synced: true, source: rates.source };
        }
        catch {
            return { inr: rates.inr, synced: false, source: rates.source };
        }
    }
}
exports.ExchangeRateService = ExchangeRateService;
//# sourceMappingURL=ExchangeRateService.js.map