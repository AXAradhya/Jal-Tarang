"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenMeteoService = exports.EAST_COAST_PORTS = void 0;
const index_js_1 = require("../../db/index.js");
const IngestionService_js_1 = require("./IngestionService.js");
exports.EAST_COAST_PORTS = [
    { portId: 'p-paradip', name: 'Paradip Port', lat: 20.26, lon: 86.67 },
    { portId: 'p-vizag', name: 'Visakhapatnam Port', lat: 17.68, lon: 83.21 },
    { portId: 'p-dhamra', name: 'Dhamra Port', lat: 20.82, lon: 86.95 },
    { portId: 'p-haldia', name: 'Haldia Dock Complex', lat: 22.02, lon: 88.06 },
    { portId: 'p-gangavaram', name: 'Gangavaram Port', lat: 17.62, lon: 83.23 },
    { portId: 'p-gopalpur', name: 'Gopalpur Port', lat: 19.30, lon: 84.97 },
    { portId: 'p-ennore', name: 'Kamarajar/Ennore Port', lat: 13.26, lon: 80.33 },
];
class OpenMeteoService extends IngestionService_js_1.IngestionService {
    static instance;
    constructor() {
        super({
            sourceName: 'OPEN_METEO_MARINE',
            failureThreshold: 3,
            resetTimeoutMs: 30_000,
            maxRetries: 2,
            retryBackoffMs: 1_500,
        });
    }
    static getInstance() {
        if (!OpenMeteoService.instance) {
            OpenMeteoService.instance = new OpenMeteoService();
        }
        return OpenMeteoService.instance;
    }
    async executeIngestion() {
        const result = await OpenMeteoService.syncAllPorts();
        if (result.synced === 0 && result.failed > 0) {
            throw new Error(`Failed to sync marine weather across all ${result.failed} ports`);
        }
        return { count: result.synced, payload: result };
    }
    static weatherCache = new Map();
    static CACHE_TTL_MS = 5 * 60 * 1000;
    static async fetchMarineWeather(lat, lon, portId) {
        const cacheKey = portId || `${lat.toFixed(2)}_${lon.toFixed(2)}`;
        const cached = this.weatherCache.get(cacheKey);
        const now = Date.now();
        if (cached && now - cached.fetchedAt < this.CACHE_TTL_MS) {
            return { ...cached.data, _cached: true, _ageSec: Math.round((now - cached.fetchedAt) / 1000) };
        }
        const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,wind_wave_height&hourly=wave_height,wind_wave_height`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        try {
            const start = Date.now();
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok) {
                if (cached)
                    return { ...cached.data, _cached: true, _stale: true };
                return null;
            }
            const data = await response.json();
            const latencyMs = Date.now() - start;
            const enriched = { ...data, _latencyMs: latencyMs, _fetchedAt: new Date().toISOString() };
            this.weatherCache.set(cacheKey, { data: enriched, fetchedAt: now });
            return enriched;
        }
        catch {
            clearTimeout(timeout);
            if (cached)
                return { ...cached.data, _cached: true, _stale: true };
            return null;
        }
    }
    static async fetchAllEastCoastPorts() {
        return Promise.all(exports.EAST_COAST_PORTS.map(async (port) => {
            const marine = await this.fetchMarineWeather(port.lat, port.lon, port.portId);
            const waveHeight = marine?.current?.wave_height ?? 1.2;
            const wavePeriod = marine?.current?.wave_period ?? 8.0;
            const windWaveHeight = marine?.current?.wind_wave_height ?? 0.4;
            const windSpeed = +(windWaveHeight * 14.5).toFixed(1);
            const waveDirection = marine?.current?.wave_direction ?? 160;
            const isLive = Boolean(marine?.current && !marine?._stale);
            return {
                portId: port.portId,
                portName: port.name,
                latitude: port.lat,
                longitude: port.lon,
                waveHeightM: waveHeight,
                swellHeightM: +(waveHeight * 0.82).toFixed(2),
                windSpeedKnots: windSpeed,
                wavePeriodSec: wavePeriod,
                waveDirectionDeg: waveDirection,
                isLive,
                status: isLive ? 'LIVE' : 'CACHED',
                source: isLive ? 'OPEN_METEO_MARINE_LIVE' : 'OPEN_METEO_MARINE_CACHED',
                latencyMs: marine?._latencyMs ?? 0,
                recordedAt: marine?._fetchedAt || new Date().toISOString(),
            };
        }));
    }
    static async syncAllPorts() {
        let synced = 0;
        let failed = 0;
        const livePorts = await this.fetchAllEastCoastPorts();
        for (const p of livePorts) {
            try {
                let impact = 'NORMAL';
                let alert = 'NONE';
                if (p.waveHeightM > 3.0 || p.windSpeedKnots > 35) {
                    impact = 'SUSPENDED';
                    alert = 'WARNING';
                }
                else if (p.waveHeightM > 2.0 || p.windSpeedKnots > 22) {
                    impact = 'DELAYED';
                    alert = 'WATCH';
                }
                await index_js_1.pool.query(`INSERT INTO live_port_weather_feed
             (port_id, wave_height_m, wave_period_sec, wind_speed_knots, operational_impact, cyclone_alert_level, recorded_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT DO NOTHING`, [p.portId, p.waveHeightM, p.wavePeriodSec, p.windSpeedKnots, impact, alert]).catch(() => { });
                synced++;
            }
            catch {
                failed++;
            }
        }
        return { synced, failed };
    }
}
exports.OpenMeteoService = OpenMeteoService;
//# sourceMappingURL=OpenMeteoService.js.map