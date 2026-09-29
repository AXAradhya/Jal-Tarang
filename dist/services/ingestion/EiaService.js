"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EiaService = void 0;
const index_js_1 = require("../../db/index.js");
const IngestionService_js_1 = require("./IngestionService.js");
class EiaService extends IngestionService_js_1.IngestionService {
    static instance;
    constructor() {
        super({
            sourceName: 'U_S_EIA_API_V2',
            failureThreshold: 4,
            resetTimeoutMs: 60_000,
            maxRetries: 2,
            retryBackoffMs: 2_000,
        });
    }
    static getInstance() {
        if (!EiaService.instance) {
            EiaService.instance = new EiaService();
        }
        return EiaService.instance;
    }
    async executeIngestion() {
        const apiKey = process.env.EIA_API_KEY;
        if (!apiKey) {
            const records = await EiaService.syncCachedBenchmarks();
            return { count: records.length, payload: { note: 'Cached benchmarks used (EIA_API_KEY not configured)' } };
        }
        const records = await EiaService.fetchLiveEiaData(apiKey);
        return { count: records.length, payload: records };
    }
    static async fetchLiveEiaData(apiKey) {
        const url = `https://api.eia.gov/v2/petroleum/pri/gnd/data/?api_key=${apiKey}&frequency=weekly&data[0]=value&facets[product][]=EPD2DXL0&sort[0][column]=period&sort[0][direction]=desc&length=5`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok)
                throw new Error(`EIA API HTTP ${res.status}`);
            const json = await res.json();
            const rows = json?.response?.data || [];
            return rows.map((r) => ({
                seriesId: r.series || 'EIA-DIESEL-BUNKER',
                seriesDescription: r['product-name'] || 'Ultra-Low Sulfur No 2 Diesel Fuel',
                value: Number(r.value) || 3.85,
                unit: 'USD/gal',
                period: r.period || new Date().toISOString().slice(0, 10),
                source: 'US_EIA_LIVE',
            }));
        }
        catch (err) {
            clearTimeout(timeout);
            throw err;
        }
    }
    static async syncCachedBenchmarks() {
        const today = new Date().toISOString().slice(0, 10);
        const benchmarks = [
            {
                seriesId: 'EIA_COAL_EXPORT_STEAM',
                seriesDescription: 'U.S. Steam Coal Export Price (FOB)',
                value: 122.40,
                unit: 'USD/short ton',
                period: today,
                source: 'EIA_BENCHMARK_CACHE',
            },
            {
                seriesId: 'EIA_COAL_EXPORT_MET',
                seriesDescription: 'U.S. Metallurgical Coal Export Price (FOB)',
                value: 235.80,
                unit: 'USD/short ton',
                period: today,
                source: 'EIA_BENCHMARK_CACHE',
            },
        ];
        for (const b of benchmarks) {
            try {
                await index_js_1.pool.query(`INSERT INTO commodity_prices 
             (commodity_code, commodity_name, price_usd, unit, observation_date, source, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT DO NOTHING`, [b.seriesId, b.seriesDescription, b.value, b.unit, b.period, b.source]);
            }
            catch {
            }
        }
        return benchmarks;
    }
}
exports.EiaService = EiaService;
//# sourceMappingURL=EiaService.js.map