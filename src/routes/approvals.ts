/**
 * JAL TARANG - Approval Workflow API Route
 * Multi-step approval state machine for contracts, charters, and procurement recommendations.
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { SystemRole } from '../types/index.js';

const router = Router();

// GET /api/v1/approvals - List approval requests
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const { status, entityType } = req.query;
  const userOrgId = (req as any).user?.organizationId || 'org-sail-corp';
  try {
    let query = `SELECT * FROM approval_workflows WHERE (organization_id = $1 OR organization_id IS NULL)`;
    const params: any[] = [userOrgId];
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (entityType) {
      params.push(entityType);
      query += ` AND entity_type = $${params.length}`;
    }
    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/v1/approvals - Initiate new approval workflow
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { entityType, entityId, totalSteps = 2 } = req.body;
  const userOrgId = (req as any).user?.organizationId || 'org-sail-corp';
  if (!entityType || !entityId) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'entityType and entityId are required' } });
  }

  try {
    const result = await pool.query(
      `INSERT INTO approval_workflows (organization_id, entity_type, entity_id, current_step, total_steps, status)
       VALUES ($1, $2, $3, 1, $4, 'PENDING') RETURNING *`,
      [userOrgId, entityType.toUpperCase(), entityId, totalSteps]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
       VALUES ($1, 'APPROVAL_WORKFLOW_INITIATED', $2, $3, $4)`,
      [(req as any).user?.id || null, entityType.toUpperCase(), entityId, JSON.stringify(result.rows[0])]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'INITIATION_FAILED', message: err.message } });
  }
});

// GET /api/v1/approvals/:id - Get approval state
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userOrgId = (req as any).user?.organizationId || 'org-sail-corp';
    const result = await pool.query(
      `SELECT * FROM approval_workflows WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)`,
      [req.params.id, userOrgId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Approval workflow not found' } });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
  }
});

// POST /api/v1/approvals/:id/action - Approve, reject, or advance workflow
router.post('/:id/action', authenticateToken, requireRole([SystemRole.SUPER_ADMIN, SystemRole.ADMIN, SystemRole.PROCUREMENT_MANAGER, SystemRole.CHARTERING_MANAGER]), async (req: Request, res: Response) => {
  const { action, comments } = req.body; // 'APPROVE', 'REJECT'
  const userOrgId = (req as any).user?.organizationId || 'org-sail-corp';
  if (!action || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: "action must be 'APPROVE' or 'REJECT'" } });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wfRes = await client.query(
      `SELECT * FROM approval_workflows WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)`,
      [req.params.id, userOrgId]
    );
    if (wfRes.rows.length === 0) {
      throw new Error('Approval workflow not found or belongs to another organization');
    }
    const wf = wfRes.rows[0];

    if (wf.status !== 'PENDING') {
      throw new Error(`Workflow is already concluded with status: ${wf.status}`);
    }

    let newStatus = wf.status;
    let nextStep = wf.current_step;

    if (action === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (action === 'APPROVE') {
      if (wf.current_step >= wf.total_steps) {
        newStatus = 'APPROVED';
      } else {
        nextStep = wf.current_step + 1;
      }
    }

    const updateRes = await client.query(
      `UPDATE approval_workflows
       SET status = $1, current_step = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [newStatus, nextStep, req.params.id]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
       VALUES ($1, $2, 'APPROVAL_WORKFLOW', $3, $4)`,
      [(req as any).user?.id || null, `APPROVAL_${action}`, req.params.id, JSON.stringify({ action, comments, user: (req as any).user?.email, step: nextStep, status: newStatus })]
    );

    await client.query('COMMIT');
    return res.json({ success: true, data: updateRes.rows[0], message: `Workflow ${action.toLowerCase()}d successfully` });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, error: { code: 'ACTION_FAILED', message: err.message } });
  } finally {
    client.release();
  }
});

export default router;
