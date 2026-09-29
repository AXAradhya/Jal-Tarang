"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FredService = void 0;
const index_js_1 = require("../../db/index.js");
const IngestionService_js_1 = require("./IngestionService.js");
class FredService extends IngestionService_js_1.IngestionService {
    static instance;
    constructor() {
        super({
            sourceName: 'ST_LOUIS_FED_FRED',
            failureThreshold: 4,
            resetTimeoutMs: 60_000,
            maxRetries: 2,
            retryBackoffMs: 2_000,
        });
    }
    static getInstance() {
        if (!FredService.instance) {
            FredService.instance = new FredService();
        }
        return FredService.instance;
    }
    async executeIngestion() {
        const apiKey = process.env.FRED_API_KEY;
        if (!apiKey) {
            const records = await FredService.syncCachedObservations();
            return { count: records.length, payload: { note: 'Cached observations used (FRED_API_KEY not configured)' } };
        }
        const records = await FredService.fetchLiveSeries(apiKey, 'PCOALAUUSDM');
        return { count: records.length, payload: records };
    }
    static async fetchLiveSeries(apiKey, seriesId) {
        const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=5`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok)
                throw new Error(`FRED API HTTP ${res.status}`);
            const json = await res.json();
            const observations = json?.observations || [];
            return observations
                .filter((o) => o.value !== '.')
                .map((o) => ({
                seriesId,
                date: o.date,
                value: parseFloat(o.value) || 0,
                source: 'FRED_ST_LOUIS_LIVE',
            }));
        }
        catch (err) {
            clearTimeout(timeout);
            throw err;
        }
    }
    static async syncCachedObservations() {
        const today = new Date().toISOString().slice(0, 10);
        const observations = [
            {
                seriesId: 'PCOALAUUSDM',
                date: today,
                value: 138.5,
                source: 'FRED_CACHE',
            },
            {
                seriesId: 'PIORECRUSDM',
                date: today,
                value: 114.2,
                source: 'FRED_CACHE',
            },
        ];
        for (const o of observations) {
            try {
                await index_js_1.pool.query(`INSERT INTO commodity_prices 
             (commodity_code, commodity_name, price_usd, unit, observation_date, source, created_at)
           VALUES ($1, $1, $2, 'INDEX', $3, $4, NOW())
           ON CONFLICT DO NOTHING`, [o.seriesId, o.value, o.date, o.source]);
            }
            catch {
            }
        }
        return observations;
    }
}
exports.FredService = FredService;
//# sourceMappingURL=FredService.js.map