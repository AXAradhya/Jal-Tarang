"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
const NotificationService_js_1 = require("../services/NotificationService.js");
const router = (0, express_1.Router)();
function extractRoleFromHeader(req) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = jsonwebtoken_1.default.verify(token, index_js_1.config.jwt.secret);
            if (payload?.roles && Array.isArray(payload.roles) && payload.roles.length > 0) {
                return payload.roles[0];
            }
        }
    }
    catch {
    }
    return null;
}
router.get('/', (req, res) => {
    try {
        const tokenRole = extractRoleFromHeader(req);
        const role = req.query.role || req.query.currentRole || tokenRole || undefined;
        const unreadOnly = req.query.unreadOnly === 'true';
        const severity = req.query.severity;
        const category = req.query.category;
        const result = NotificationService_js_1.notificationService.getAll({
            role,
            unreadOnly,
            severity,
            category,
        });
        return res.json({
            success: true,
            data: result.notifications,
            meta: {
                unreadCount: result.unreadCount,
                totalCount: result.totalCount,
                roleFilter: role || 'ALL',
            },
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'NOTIFICATIONS_FETCH_FAILED', message: err.message },
        });
    }
});
router.get('/summary', (req, res) => {
    try {
        const tokenRole = extractRoleFromHeader(req);
        const role = req.query.role || tokenRole || undefined;
        const summary = NotificationService_js_1.notificationService.getSummary(role);
        return res.json({ success: true, data: summary });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'SUMMARY_FAILED', message: err.message },
        });
    }
});
router.get('/random', (req, res) => {
    try {
        const tokenRole = extractRoleFromHeader(req);
        const role = req.query.role || tokenRole || undefined;
        const randomNotif = NotificationService_js_1.notificationService.getRandomNotification(role);
        return res.json({ success: true, data: randomNotif });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'RANDOM_NOTIF_FAILED', message: err.message },
        });
    }
});
router.get('/categories', (_req, res) => {
    try {
        const categories = NotificationService_js_1.notificationService.getAllCategories();
        return res.json({ success: true, data: categories, meta: { totalCategories: categories.length } });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'CATEGORIES_FAILED', message: err.message },
        });
    }
});
router.post('/', (req, res) => {
    const { title, message, role = 'ALL', severity = 'INFO', category = 'OPERATIONS', link, metadata, } = req.body;
    if (!title || !message) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_FAILED', message: 'title and message are required' },
        });
    }
    try {
        const created = NotificationService_js_1.notificationService.create({
            title,
            message,
            role,
            severity: severity,
            category: category,
            link,
            metadata,
        });
        return res.status(201).json({
            success: true,
            data: created,
            message: 'Notification dispatched successfully',
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'CREATE_FAILED', message: err.message },
        });
    }
});
router.post('/send', (req, res) => {
    const { title, message, role = 'ALL', severity = 'INFO', category = 'OPERATIONS', link } = req.body;
    if (!title || !message) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_FAILED', message: 'title and message are required' },
        });
    }
    const created = NotificationService_js_1.notificationService.create({ title, message, role, severity, category, link });
    return res.status(201).json({ success: true, data: created });
});
router.patch('/:id/read', (req, res) => {
    const updated = NotificationService_js_1.notificationService.markAsRead(req.params.id);
    if (!updated) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Notification not found' },
        });
    }
    return res.json({ success: true, data: updated });
});
router.post('/:id/read', (req, res) => {
    const updated = NotificationService_js_1.notificationService.markAsRead(req.params.id);
    if (!updated) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Notification not found' },
        });
    }
    return res.json({ success: true, data: updated });
});
router.post('/:id/acknowledge', (req, res) => {
    const updated = NotificationService_js_1.notificationService.acknowledge(req.params.id);
    if (!updated) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Notification not found' },
        });
    }
    return res.json({ success: true, data: updated });
});
router.post('/mark-all-read', (req, res) => {
    const tokenRole = extractRoleFromHeader(req);
    const role = req.body.role || tokenRole || undefined;
    const markedCount = NotificationService_js_1.notificationService.markAllAsRead(role);
    return res.json({
        success: true,
        data: { markedCount },
        message: `Marked ${markedCount} notifications as read`,
    });
});
router.delete('/:id', (req, res) => {
    const deleted = NotificationService_js_1.notificationService.delete(req.params.id);
    if (!deleted) {
        return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Notification not found' },
        });
    }
    return res.json({ success: true, message: 'Notification removed' });
});
exports.default = router;
//# sourceMappingURL=notifications.js.map