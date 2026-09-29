/**
 * JAL TARANG - Trade Lanes & Maritime Routes API
 * Management of bulk shipping corridors, waypoint distances, and canal requirements.
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();

// GET /api/v1/trade-lanes - List all trade lanes
router.get('/trade-lanes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT tl.*,
              COUNT(r.id)::int as route_count
       FROM trade_lanes tl
       LEFT JOIN routes r ON r.trade_lane_id = tl.id
       GROUP BY tl.id
       ORDER BY tl.name ASC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/v1/trade-lanes - Create trade lane
router.post('/trade-lanes', authenticateToken, requireRole([SystemRole.SUPER_ADMIN, SystemRole.CHARTERING_MANAGER]), async (req: Request, res: Response) => {
  const { code, name, originRegion, destinationRegion } = req.body;
  if (!code || !name) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'code and name required' } });
  }
  try {
    const result = await pool.query(
      `INSERT INTO trade_lanes (code, name, origin_region, destination_region)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [code.toUpperCase(), name, originRegion || null, destinationRegion || null]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: err.message } });
  }
});

// GET /api/v1/trade-lanes/:id/routes - List routes for trade lane
router.get('/trade-lanes/:id/routes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              op.name as origin_port_name, op.code as origin_port_code,
              dp.name as destination_port_name, dp.code as destination_port_code
       FROM routes r
       JOIN ports op ON op.id = r.origin_port_id
       JOIN ports dp ON dp.id = r.destination_port_id
       WHERE r.trade_lane_id = $1
       ORDER BY r.distance_nm ASC`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// GET /api/v1/routes - List all maritime routes
router.get('/routes', authenticateToken, async (req: Request, res: Response) => {
  const { originPort, destinationPort } = req.query;
  try {
    let query = `
      SELECT r.*,
             tl.name as trade_lane_name, tl.code as trade_lane_code,
             op.name as origin_port_name, op.code as origin_port_code,
             dp.name as destination_port_name, dp.code as destination_port_code
      FROM routes r
      LEFT JOIN trade_lanes tl ON tl.id = r.trade_lane_id
      JOIN ports op ON op.id = r.origin_port_id
      JOIN ports dp ON dp.id = r.destination_port_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (originPort) {
      params.push(originPort);
      query += ` AND (op.code ILIKE $${params.length} OR op.name ILIKE $${params.length})`;
    }
    if (destinationPort) {
      params.push(destinationPort);
      query += ` AND (dp.code ILIKE $${params.length} OR dp.name ILIKE $${params.length})`;
    }
    query += ` ORDER BY r.name ASC`;

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/v1/routes - Create maritime route
router.post('/routes', authenticateToken, requireRole([SystemRole.SUPER_ADMIN, SystemRole.CHARTERING_MANAGER]), async (req: Request, res: Response) => {
  const { tradeLaneId, code, name, originPortId, destinationPortId, distanceNm, canalTransit, canalCostUsd, typicalDurationDays, weatherRiskLevel } = req.body;
  if (!code || !name || !originPortId || !destinationPortId || !distanceNm || !typicalDurationDays) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Missing required route fields' } });
  }
  try {
    const result = await pool.query(
      `INSERT INTO routes (trade_lane_id, code, name, origin_port_id, destination_port_id, distance_nm, canal_transit, canal_cost_usd, typical_duration_days, weather_risk_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [tradeLaneId || null, code.toUpperCase(), name, originPortId, destinationPortId, distanceNm, canalTransit || 'NONE', canalCostUsd || 0, typicalDurationDays, weatherRiskLevel || 'LOW']
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: err.message } });
  }
});

// GET /api/v1/routes/:id/economics - Route-level duration and baseline bunker consumption
router.get('/routes/:id/economics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              ROUND((r.distance_nm / (13.0 * 24.0)), 1) as estimated_sailing_days_at_13kts,
              ROUND((r.distance_nm / (13.0 * 24.0)) * 28.0, 1) as estimated_vlsfo_tons_consumption,
              r.canal_cost_usd
       FROM routes r WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Route not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

export default router;
