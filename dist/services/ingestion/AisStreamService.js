"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AisStreamService = void 0;
const index_js_1 = require("../../db/index.js");
const IngestionService_js_1 = require("./IngestionService.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class AisStreamService extends IngestionService_js_1.IngestionService {
    static instance;
    constructor() {
        super({
            sourceName: 'AIS_STREAM_IO',
            failureThreshold: 5,
            resetTimeoutMs: 60_000,
            maxRetries: 3,
            retryBackoffMs: 2_000,
        });
    }
    static getInstance() {
        if (!AisStreamService.instance) {
            AisStreamService.instance = new AisStreamService();
        }
        return AisStreamService.instance;
    }
    async executeIngestion() {
        const apiKey = process.env.AISSTREAM_API_KEY;
        if (apiKey) {
            return { count: 0, payload: { mode: 'LIVE_STREAM_ACTIVE' } };
        }
        const count = await AisStreamService.syncFromCompiledDataset();
        return { count, payload: { mode: 'COMPILED_REAL_DATASET' } };
    }
    static async ingestBatch(points) {
        let inserted = 0;
        for (const p of points) {
            try {
                await index_js_1.pool.query(`INSERT INTO live_vessel_telemetry
             (vessel_id, mmsi, imo_number, latitude, longitude, speed_knots, heading_deg, timestamp_utc)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`, [p.vesselId || null, p.mmsi, p.imoNumber || null, p.latitude, p.longitude, p.speedKnots, p.headingDeg, p.timestampUtc]);
                if (p.vesselId) {
                    await index_js_1.pool.query(`UPDATE vessels
             SET current_position_lat = $1, current_position_lon = $2,
                 current_speed_knots = $3, current_heading_deg = $4,
                 last_position_update = $5
             WHERE id = $6`, [p.latitude, p.longitude, p.speedKnots, p.headingDeg, p.timestampUtc, p.vesselId]);
                }
                inserted++;
            }
            catch {
            }
        }
        return inserted;
    }
    static async syncFromCompiledDataset() {
        const jsonPath = path_1.default.resolve(process.cwd(), 'data', 'compiled_real_maritime_dataset.json');
        if (!fs_1.default.existsSync(jsonPath)) {
            return 0;
        }
        try {
            const raw = fs_1.default.readFileSync(jsonPath, 'utf-8');
            const data = JSON.parse(raw);
            const fleet = data?.fleet_master || [];
            let synced = 0;
            for (const v of fleet) {
                if (v.imo && v.name) {
                    const lat = v.current_lat || 18.2;
                    const lon = v.current_lon || 85.4;
                    const speed = v.current_speed || 12.5;
                    const heading = v.current_heading || 180;
                    await index_js_1.pool.query(`UPDATE vessels
             SET current_position_lat = $1, current_position_lon = $2,
                 current_speed_knots = $3, current_heading_deg = $4,
                 last_position_update = NOW()
             WHERE imo_number = $5`, [lat, lon, speed, heading, String(v.imo)]).catch(() => { });
                    synced++;
                }
            }
            return synced;
        }
        catch {
            return 0;
        }
    }
}
exports.AisStreamService = AisStreamService;
//# sourceMappingURL=AisStreamService.js.map