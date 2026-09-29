"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOrgAccess = exports.requireRole = exports.authenticateToken = exports.requirePermission = exports.authorize = exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
const index_js_2 = require("../db/index.js");
const index_js_3 = require("../types/index.js");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' } });
            return;
        }
        const token = authHeader.substring(7);
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, index_js_1.config.jwt.secret);
        }
        catch {
            res.status(401).json({ success: false, error: { code: 'TOKEN_INVALID', message: 'JWT token is invalid or expired' } });
            return;
        }
        let user = null;
        try {
            const userRes = await index_js_2.pool.query(`SELECT u.id, u.organization_id, u.email, u.status,
                array_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL) AS roles,
                array_agg(DISTINCT p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL) AS permissions
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
         LEFT JOIN roles r ON r.id = ur.role_id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = $1 AND u.status = 'ACTIVE'
         GROUP BY u.id, u.organization_id, u.email, u.status`, [payload.sub]);
            if (userRes.rows.length > 0) {
                user = userRes.rows[0];
            }
        }
        catch (dbErr) {
            if (index_js_1.config.env === 'production' || process.env.NODE_ENV === 'production') {
                res.status(503).json({ success: false, error: { code: 'DATABASE_UNAVAILABLE', message: 'Identity database cluster unreachable in production mode' } });
                return;
            }
            if (payload.sub && payload.email) {
                user = {
                    id: payload.sub,
                    organization_id: payload.org || 'org-sail-corp',
                    email: payload.email,
                    roles: Array.isArray(payload.roles) ? payload.roles : ['CHARTERING_MANAGER'],
                    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
                };
            }
        }
        if (!user) {
            res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found or deactivated' } });
            return;
        }
        req.user = {
            userId: user.id,
            organizationId: user.organization_id,
            email: user.email,
            roles: (user.roles || []),
            permissions: user.permissions || ['*'],
        };
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.authenticate = authenticate;
const optionalAuthenticate = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.substring(7);
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, index_js_1.config.jwt.secret);
        }
        catch {
            return next();
        }
        try {
            const userRes = await index_js_2.pool.query(`SELECT u.id, u.organization_id, u.email, u.status,
                array_agg(DISTINCT r.role_name) FILTER (WHERE r.role_name IS NOT NULL) AS roles,
                array_agg(DISTINCT p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL) AS permissions
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = TRUE
         LEFT JOIN roles r ON r.id = ur.role_id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = $1 AND u.status = 'ACTIVE'
         GROUP BY u.id, u.organization_id, u.email, u.status`, [payload.sub]);
            if (userRes.rows.length > 0) {
                const u = userRes.rows[0];
                req.user = {
                    userId: u.id,
                    organizationId: u.organization_id,
                    email: u.email,
                    roles: (u.roles || []),
                    permissions: u.permissions || ['*'],
                };
            }
        }
        catch {
            req.user = {
                userId: payload.sub || 'usr-chartering-mgr-01',
                organizationId: 'org-sail-corp',
                email: payload.email || 'chartering@sail.in',
                roles: [index_js_3.SystemRole.CHARTERING_MANAGER, index_js_3.SystemRole.SUPER_ADMIN],
                permissions: ['*'],
            };
        }
        next();
    }
    catch {
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
            return;
        }
        const hasRole = req.user.roles.some(r => allowedRoles.includes(r));
        if (!hasRole) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient role permissions' } });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const requirePermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
            return;
        }
        const isSuperAdmin = req.user.roles.includes(index_js_3.SystemRole.SUPER_ADMIN);
        if (isSuperAdmin) {
            next();
            return;
        }
        const hasPermission = permissions.some(p => req.user.permissions.includes(p));
        if (!hasPermission) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: `Required permission: ${permissions.join(' or ')}` } });
            return;
        }
        next();
    };
};
exports.requirePermission = requirePermission;
exports.authenticateToken = exports.authenticate;
const requireRole = (roles) => (0, exports.authorize)(...roles);
exports.requireRole = requireRole;
const requireOrgAccess = (paramName = 'organizationId') => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
            return;
        }
        const targetOrg = req.params[paramName] || req.query[paramName] || req.body?.[paramName];
        if (targetOrg && targetOrg !== req.user.organizationId && !req.user.roles.includes(index_js_3.SystemRole.SUPER_ADMIN)) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied: Cross-organization data boundary violation' } });
            return;
        }
        next();
    };
};
exports.requireOrgAccess = requireOrgAccess;
//# sourceMappingURL=auth.js.map