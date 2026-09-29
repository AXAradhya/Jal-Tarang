/**
 * JAL TARANG - Recommendations API Route
 * Standalone access to decision recommendations, factor evidence, and approval flows.
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();

// GET /api/v1/recommendations - List recommendations
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { limit = 50 } = req.query;
  try {
    const result = await pool.query(
      `SELECT id, cargo_type, quantity_mt, origin, destination,
              market_action, recommended_strategy, selected_vessel_name,
              selected_vessel_class, voyage_cost_usd, cost_per_mt_usd,
              projected_savings_usd, confidence_score, composite_risk_level,
              created_at
       FROM decision_recommendations
       ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    return res.json({
      success: true,
      data: result.rows,
      meta: { total: result.rows.length }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// GET /api/v1/recommendations/:id - Get full recommendation trace & evidence
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM decision_recommendations WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Recommendation not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/v1/recommendations/:id/approve - Approve recommendation to proceed with charter/procurement
router.post('/:id/approve', authenticateToken, requireRole([SystemRole.SUPER_ADMIN, SystemRole.CHARTERING_MANAGER, SystemRole.PROCUREMENT_MANAGER]), async (req: Request, res: Response) => {
  const { notes } = req.body;
  try {
    const rRes = await pool.query(`SELECT * FROM decision_recommendations WHERE id = $1`, [req.params.id]);
    if (rRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Recommendation not found' } });
    }
    const rec = rRes.rows[0];

    // Log approval in audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
       VALUES ($1, 'RECOMMENDATION_APPROVED', 'DECISION_RECOMMENDATION', $2, $3)`,
      [(req as any).user?.id || null, rec.id, JSON.stringify({ approvedBy: (req as any).user?.email, notes, timestamp: new Date().toISOString() })]
    );

    return res.json({
      success: true,
      data: {
        recommendationId: rec.id,
        status: 'APPROVED',
        actionTriggered: 'CHARTER_FIXTURE_PREPARED',
        approvedBy: (req as any).user?.email,
        timestamp: new Date().toISOString()
      },
      message: 'Decision recommendation approved successfully'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'APPROVAL_FAILED', message: err.message } });
  }
});

export default router;
