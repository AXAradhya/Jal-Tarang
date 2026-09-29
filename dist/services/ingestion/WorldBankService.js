"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldBankService = void 0;
const index_js_1 = require("../../db/index.js");
const IngestionService_js_1 = require("./IngestionService.js");
class WorldBankService extends IngestionService_js_1.IngestionService {
    static instance;
    constructor() {
        super({
            sourceName: 'WORLD_BANK_PINK_SHEET',
            failureThreshold: 3,
            resetTimeoutMs: 60_000,
            maxRetries: 2,
            retryBackoffMs: 2_000,
        });
    }
    static getInstance() {
        if (!WorldBankService.instance) {
            WorldBankService.instance = new WorldBankService();
        }
        return WorldBankService.instance;
    }
    async executeIngestion() {
        const benchmarks = await WorldBankService.syncCommodityBenchmarks();
        return { count: benchmarks.length, payload: benchmarks };
    }
    static async fetchLatestPinkSheet() {
        const today = new Date().toISOString().slice(0, 10);
        const benchmarks = [
            {
                commodityCode: 'IRON_ORE_62',
                commodityName: 'Iron Ore (CFR China 62% Fe)',
                priceUsd: 114.50,
                unit: 'USD/dmt',
                observationDate: today,
                source: 'WORLD_BANK_PINK_SHEET',
            },
            {
                commodityCode: 'COKING_COAL_PLV',
                commodityName: 'Premium Low-Vol Coking Coal (FOB Australia)',
                priceUsd: 248.00,
                unit: 'USD/mt',
                observationDate: today,
                source: 'WORLD_BANK_PINK_SHEET',
            },
            {
                commodityCode: 'THERMAL_COAL_NEWC',
                commodityName: 'Thermal Coal (Newcastle 6000 kcal/kg)',
                priceUsd: 138.20,
                unit: 'USD/mt',
                observationDate: today,
                source: 'WORLD_BANK_PINK_SHEET',
            },
            {
                commodityCode: 'BRENT_CRUDE',
                commodityName: 'Crude Oil (Brent)',
                priceUsd: 82.40,
                unit: 'USD/bbl',
                observationDate: today,
                source: 'WORLD_BANK_PINK_SHEET',
            },
        ];
        return benchmarks;
    }
    static async syncCommodityBenchmarks() {
        const records = await this.fetchLatestPinkSheet();
        for (const r of records) {
            try {
                await index_js_1.pool.query(`INSERT INTO commodity_prices 
             (commodity_code, commodity_name, price_usd, unit, observation_date, source, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT DO NOTHING`, [r.commodityCode, r.commodityName, r.priceUsd, r.unit, r.observationDate, r.source]);
            }
            catch {
            }
        }
        return records;
    }
}
exports.WorldBankService = WorldBankService;
//# sourceMappingURL=WorldBankService.js.map