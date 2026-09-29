"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const index_js_2 = require("../types/index.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    const { status, entityType } = req.query;
    const userOrgId = req.user?.organizationId || 'org-sail-corp';
    try {
        let query = `SELECT * FROM approval_workflows WHERE (organization_id = $1 OR organization_id IS NULL)`;
        const params = [userOrgId];
        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }
        if (entityType) {
            params.push(entityType);
            query += ` AND entity_type = $${params.length}`;
        }
        query += ` ORDER BY created_at DESC LIMIT 100`;
        const result = await index_js_1.pool.query(query, params);
        return res.json({ success: true, data: result.rows });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});
router.post('/', auth_js_1.authenticateToken, async (req, res) => {
    const { entityType, entityId, totalSteps = 2 } = req.body;
    const userOrgId = req.user?.organizationId || 'org-sail-corp';
    if (!entityType || !entityId) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'entityType and entityId are required' } });
    }
    try {
        const result = await index_js_1.pool.query(`INSERT INTO approval_workflows (organization_id, entity_type, entity_id, current_step, total_steps, status)
       VALUES ($1, $2, $3, 1, $4, 'PENDING') RETURNING *`, [userOrgId, entityType.toUpperCase(), entityId, totalSteps]);
        await index_js_1.pool.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
       VALUES ($1, 'APPROVAL_WORKFLOW_INITIATED', $2, $3, $4)`, [req.user?.id || null, entityType.toUpperCase(), entityId, JSON.stringify(result.rows[0])]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'INITIATION_FAILED', message: err.message } });
    }
});
router.get('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const userOrgId = req.user?.organizationId || 'org-sail-corp';
        const result = await index_js_1.pool.query(`SELECT * FROM approval_workflows WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)`, [req.params.id, userOrgId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Approval workflow not found' } });
        }
        return res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});
router.post('/:id/action', auth_js_1.authenticateToken, (0, auth_js_1.requireRole)([index_js_2.SystemRole.SUPER_ADMIN, index_js_2.SystemRole.ADMIN, index_js_2.SystemRole.PROCUREMENT_MANAGER, index_js_2.SystemRole.CHARTERING_MANAGER]), async (req, res) => {
    const { action, comments } = req.body;
    const userOrgId = req.user?.organizationId || 'org-sail-corp';
    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_FAILED', message: "action must be 'APPROVE' or 'REJECT'" } });
    }
    const client = await index_js_1.pool.connect();
    try {
        await client.query('BEGIN');
        const wfRes = await client.query(`SELECT * FROM approval_workflows WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL)`, [req.params.id, userOrgId]);
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
        }
        else if (action === 'APPROVE') {
            if (wf.current_step >= wf.total_steps) {
                newStatus = 'APPROVED';
            }
            else {
                nextStep = wf.current_step + 1;
            }
        }
        const updateRes = await client.query(`UPDATE approval_workflows
       SET status = $1, current_step = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`, [newStatus, nextStep, req.params.id]);
        await client.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_value)
       VALUES ($1, $2, 'APPROVAL_WORKFLOW', $3, $4)`, [req.user?.id || null, `APPROVAL_${action}`, req.params.id, JSON.stringify({ action, comments, user: req.user?.email, step: nextStep, status: newStatus })]);
        await client.query('COMMIT');
        return res.json({ success: true, data: updateRes.rows[0], message: `Workflow ${action.toLowerCase()}d successfully` });
    }
    catch (err) {
        await client.query('ROLLBACK');
        return res.status(500).json({ success: false, error: { code: 'ACTION_FAILED', message: err.message } });
    }
    finally {
        client.release();
    }
});
exports.default = router;
//# sourceMappingURL=approvals.js.map