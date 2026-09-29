import { Router, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();
router.use(authenticate);

// ─── GET /alerts ──────────────────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 25, severity, acknowledged, alertType } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = ['a.organization_id = $1'];
    const params: any[] = [req.user!.organizationId];
    let idx = 2;

    if (severity) { conditions.push(`a.severity = $${idx}`); params.push(severity); idx++; }
    if (acknowledged !== undefined) { conditions.push(`a.is_acknowledged = $${idx}`); params.push(acknowledged === 'true'); idx++; }
    if (alertType) { conditions.push(`a.alert_type = $${idx}`); params.push(alertType); idx++; }

    const where = conditions.join(' AND ');
    const [countRes, alertRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM alerts a WHERE ${where}`, params),
      pool.query(
        `SELECT a.id, a.alert_type, a.severity, a.title, a.message, a.is_acknowledged,
                a.acknowledged_at, a.created_at, a.expires_at, a.metadata,
                p.port_name AS related_port,
                v.vessel_name AS related_vessel,
                u.display_name AS acknowledged_by_name
         FROM alerts a
         LEFT JOIN ports p ON p.id = (a.metadata->>'portId')::uuid
         LEFT JOIN vessels v ON v.id = (a.metadata->>'vesselId')::uuid
         LEFT JOIN users u ON u.id = a.acknowledged_by
         WHERE ${where}
         ORDER BY a.severity DESC, a.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, Number(limit), offset]
      ),
    ]);

    return res.json({
      success: true,
      data: alertRes.rows,
      meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── PATCH /alerts/:id/acknowledge ────────────────────────────────────────────
router.patch('/:id/acknowledge', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `UPDATE alerts SET is_acknowledged = TRUE, acknowledged_by = $1, acknowledged_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND organization_id = $3 RETURNING id, title, is_acknowledged, acknowledged_at`,
      [req.user!.userId, req.params.id, req.user!.organizationId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── POST /alerts ─────────────────────────────────────────────────────────────
router.post('/', authorize(SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.PORT_MANAGER), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { alertType, severity, title, message, expiresAt, metadata } = req.body;
    if (!alertType || !severity || !title) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'alertType, severity, title are required' } });
    }
    const result = await pool.query(
      `INSERT INTO alerts (organization_id, alert_type, severity, title, message, expires_at, metadata, is_acknowledged)
       VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE)
       RETURNING id, title, severity, alert_type, created_at`,
      [req.user!.organizationId, alertType, severity, title, message, expiresAt, JSON.stringify(metadata || {})]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ─── GET /alerts/summary ──────────────────────────────────────────────────────
router.get('/summary/counts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE NOT is_acknowledged AND expires_at IS NULL OR expires_at > NOW()) AS total_active,
         COUNT(*) FILTER (WHERE severity = 'CRITICAL' AND NOT is_acknowledged) AS critical,
         COUNT(*) FILTER (WHERE severity = 'HIGH' AND NOT is_acknowledged) AS high,
         COUNT(*) FILTER (WHERE severity = 'MEDIUM' AND NOT is_acknowledged) AS medium,
         COUNT(*) FILTER (WHERE severity = 'LOW' AND NOT is_acknowledged) AS low,
         COUNT(*) FILTER (WHERE alert_type = 'WEATHER' AND NOT is_acknowledged) AS weather_alerts,
         COUNT(*) FILTER (WHERE alert_type = 'VESSEL' AND NOT is_acknowledged) AS vessel_alerts,
         COUNT(*) FILTER (WHERE alert_type = 'PORT' AND NOT is_acknowledged) AS port_alerts
       FROM alerts WHERE organization_id = $1`,
      [req.user!.organizationId]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
