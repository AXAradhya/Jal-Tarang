import { Router, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';
import { LiveDataIngestionService } from '../services/LiveDataIngestionService.js';

const router = Router();
router.use(authenticate);

// ─── GET /weather/ports/:portId ────────────────────────────────────────────────
router.get('/ports/:portId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { portId } = req.params;
    const { hours = 24 } = req.query;

    // Fetch from live weather feed
    const result = await pool.query(
      `SELECT lw.wave_height_m, lw.wave_period_sec, lw.wind_speed_knots, lw.temperature_c,
              lw.visibility_km, lw.swell_height_m, lw.current_speed_knots, lw.precipitation_mm,
              lw.operational_impact, lw.cyclone_alert_level, lw.recorded_at,
              p.port_name, p.latitude, p.longitude
       FROM live_port_weather_feed lw
       JOIN ports p ON p.id = lw.port_id
       WHERE lw.port_id = $1 AND lw.recorded_at >= NOW() - ($2 || ' hours')::INTERVAL
       ORDER BY lw.recorded_at DESC`,
      [portId, Number(hours)]
    );

    // If no recent data, try to fetch live
    if (result.rows.length === 0) {
      const portRes = await pool.query('SELECT id, latitude, longitude FROM ports WHERE id = $1', [portId]);
      if (portRes.rows.length > 0) {
        const port = portRes.rows[0];
        await LiveDataIngestionService.fetchAndStorePortWeather(portId, port.latitude, port.longitude);
        const fresh = await pool.query(
          `SELECT wave_height_m, wave_period_sec, wind_speed_knots, temperature_c,
                  operational_impact, cyclone_alert_level, recorded_at
           FROM live_port_weather_feed WHERE port_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
          [portId]
        );
        return res.json({ success: true, data: fresh.rows, meta: { source: 'LIVE_FETCH', portId } });
      }
    }

    return res.json({ success: true, data: result.rows, meta: { portId, hours: Number(hours), count: result.rowCount } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /weather/refresh ─────────────────────────────────────────────────────
router.post('/refresh', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.PORT_MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const portsRes = await pool.query(
      'SELECT id, port_name, latitude, longitude FROM ports WHERE is_east_coast_india = TRUE AND status = $1',
      ['OPERATIONAL']
    );

    const results: any[] = [];
    for (const port of portsRes.rows) {
      try {
        await LiveDataIngestionService.fetchAndStorePortWeather(port.id, port.latitude, port.longitude);
        results.push({ portId: port.id, portName: port.port_name, status: 'SUCCESS' });
      } catch (err: any) {
        results.push({ portId: port.id, portName: port.port_name, status: 'FAILED', error: err.message });
      }
    }

    // Also refresh exchange rate
    await LiveDataIngestionService.fetchAndStoreLiveExchangeRate().catch(() => {});

    return res.json({
      success: true,
      data: {
        refreshed: results.filter(r => r.status === 'SUCCESS').length,
        failed: results.filter(r => r.status === 'FAILED').length,
        details: results,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /weather/east-coast/summary ─────────────────────────────────────────
router.get('/east-coast/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.port_name, p.un_locode, p.latitude, p.longitude, p.is_major_port,
              lw.wave_height_m, lw.wind_speed_knots, lw.visibility_km, lw.temperature_c,
              lw.operational_impact, lw.cyclone_alert_level, lw.recorded_at,
              CASE
                WHEN lw.cyclone_alert_level = 'CYCLONE_WARNING' THEN 'CRITICAL'
                WHEN lw.cyclone_alert_level = 'CAUTION' OR lw.wave_height_m > 3.0 THEN 'WARNING'
                WHEN lw.wave_height_m > 2.0 THEN 'ADVISORY'
                ELSE 'NORMAL'
              END AS alert_status
       FROM ports p
       LEFT JOIN LATERAL (
         SELECT wave_height_m, wind_speed_knots, visibility_km, temperature_c,
                operational_impact, cyclone_alert_level, recorded_at
         FROM live_port_weather_feed WHERE port_id = p.id
         ORDER BY recorded_at DESC LIMIT 1
       ) lw ON TRUE
       WHERE p.is_east_coast_india = TRUE AND p.status = 'OPERATIONAL'
       ORDER BY p.port_name`
    );

    const summary = {
      totalPorts: result.rowCount,
      normalConditions: result.rows.filter(r => r.alert_status === 'NORMAL').length,
      advisoryCount: result.rows.filter(r => r.alert_status === 'ADVISORY').length,
      warningCount: result.rows.filter(r => r.alert_status === 'WARNING').length,
      criticalCount: result.rows.filter(r => r.alert_status === 'CRITICAL').length,
    };

    return res.json({
      success: true,
      data: result.rows,
      meta: { ...summary, lastRefreshed: new Date().toISOString() },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
