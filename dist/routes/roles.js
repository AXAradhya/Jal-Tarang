"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const index_js_2 = require("../types/index.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
router.get('/', async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT r.id, r.role_name, r.display_name, r.description, r.hierarchy_level, r.is_system_role,
              COUNT(DISTINCT ur.user_id) FILTER (WHERE ur.is_active = TRUE) AS active_user_count,
              array_agg(DISTINCT p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL) AS permissions
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       GROUP BY r.id, r.role_name, r.display_name, r.description, r.hierarchy_level, r.is_system_role
       ORDER BY r.hierarchy_level ASC`);
        return res.json({ success: true, data: result.rows, meta: { count: result.rowCount } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const [roleRes, usersRes, permsRes] = await Promise.all([
            index_js_1.pool.query('SELECT * FROM roles WHERE id = $1', [req.params.id]),
            index_js_1.pool.query(`SELECT u.id, u.display_name, u.email, u.status, ur.assigned_at
         FROM user_roles ur JOIN users u ON u.id = ur.user_id
         WHERE ur.role_id = $1 AND ur.is_active = TRUE LIMIT 50`, [req.params.id]),
            index_js_1.pool.query(`SELECT p.permission_code, p.display_name, p.resource, p.action, p.description
         FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = $1 ORDER BY p.resource, p.action`, [req.params.id]),
        ]);
        if (roleRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Role not found' } });
        }
        return res.json({ success: true, data: { ...roleRes.rows[0], users: usersRes.rows, permissions: permsRes.rows } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/permissions/all', (0, auth_js_1.authorize)(index_js_2.SystemRole.SUPER_ADMIN, index_js_2.SystemRole.ADMIN), async (req, res) => {
    try {
        const result = await index_js_1.pool.query(`SELECT id, permission_code, display_name, resource, action, description
       FROM permissions ORDER BY resource, action`);
        return res.json({ success: true, data: result.rows, meta: { count: result.rowCount } });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=roles.js.map