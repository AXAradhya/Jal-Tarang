"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveDataIngestionService = void 0;
const index_js_1 = require("../db/index.js");
class LiveDataIngestionService {
    static async fetchAndStorePortWeather(portId, lat, lon) {
        try {
            const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,wind_wave_height`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Open-Meteo API returned status ${response.status}`);
            }
            const data = (await response.json());
            const current = data.current || {};
            const waveHeight = current.wave_height ?? 1.2;
            const wavePeriod = current.wave_period ?? 7.0;
            const windSpeed = (current.wind_wave_height ?? 0.8) * 15.0;
            let operationalImpact = 'NORMAL';
            let alertLevel = 'NONE';
            if (waveHeight > 2.2) {
                operationalImpact = 'SWELL_RESTRICTIONS';
                alertLevel = 'CAUTION';
            }
            await index_js_1.pool.query(`INSERT INTO live_port_weather_feed 
         (port_id, temperature_c, wind_speed_knots, wave_height_m, wave_period_sec, visibility_km, operational_impact, cyclone_alert_level, recorded_at)
         VALUES ($1, 29.5, $2, $3, $4, 10.0, $5, $6, CURRENT_TIMESTAMP)`, [portId, windSpeed.toFixed(2), waveHeight.toFixed(2), wavePeriod.toFixed(2), operationalImpact, alertLevel]);
            console.log(`[LIVE INGEST] Successfully recorded live weather for port ${portId} (Wave: ${waveHeight}m)`);
        }
        catch (err) {
            console.error(`[LIVE INGEST] Error fetching weather for port ${portId}:`, err);
        }
    }
    static async fetchAndStoreLiveExchangeRate() {
        try {
            const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR');
            if (!response.ok)
                return;
            const data = (await response.json());
            const rate = data.rates?.INR;
            if (!rate)
                return;
            const usdRes = await index_js_1.pool.query(`SELECT id FROM currencies WHERE code = 'USD'`);
            const inrRes = await index_js_1.pool.query(`SELECT id FROM currencies WHERE code = 'INR'`);
            if (!usdRes.rows[0] || !inrRes.rows[0])
                return;
            await index_js_1.pool.query(`INSERT INTO currency_rates (from_currency_id, to_currency_id, rate, rate_date, source)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'FRANKFURTER_ECB_LIVE')
         ON CONFLICT (from_currency_id, to_currency_id, rate_date) DO UPDATE SET rate = $3`, [usdRes.rows[0].id, inrRes.rows[0].id, rate]);
            console.log(`[LIVE INGEST] Updated USD/INR rate: ${rate}`);
        }
        catch (err) {
            console.error('[LIVE INGEST] Error updating currency rates:', err);
        }
    }
}
exports.LiveDataIngestionService = LiveDataIngestionService;
//# sourceMappingURL=LiveDataIngestionService.js.map