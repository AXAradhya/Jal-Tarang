/**
 * JAL TARANG - Notifications API Route
 * Real-time role-based notification dispatch, read state tracking, and alerts engine.
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { notificationService, NotificationSeverity, NotificationCategory } from '../services/NotificationService.js';

const router = Router();

// Helper to extract role from optional Bearer token
function extractRoleFromHeader(req: Request): string | null {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload: any = jwt.verify(token, config.jwt.secret);
      if (payload?.roles && Array.isArray(payload.roles) && payload.roles.length > 0) {
        return payload.roles[0];
      }
    }
  } catch {
    // Ignore invalid/expired token
  }
  return null;
}

// ─── GET /api/v1/notifications ───────────────────────────────────────────────
// List notifications filtered by role, read status, severity, category
router.get('/', (req: Request, res: Response) => {
  try {
    const tokenRole = extractRoleFromHeader(req);
    const role = (req.query.role as string) || (req.query.currentRole as string) || tokenRole || undefined;
    const unreadOnly = req.query.unreadOnly === 'true';
    const severity = req.query.severity as string;
    const category = req.query.category as string;

    const result = notificationService.getAll({
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
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'NOTIFICATIONS_FETCH_FAILED', message: err.message },
    });
  }
});

// ─── GET /api/v1/notifications/summary ───────────────────────────────────────
// Get count statistics grouped by severity and categories
router.get('/summary', (req: Request, res: Response) => {
  try {
    const tokenRole = extractRoleFromHeader(req);
    const role = (req.query.role as string) || tokenRole || undefined;
    const summary = notificationService.getSummary(role);
    return res.json({ success: true, data: summary });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SUMMARY_FAILED', message: err.message },
    });
  }
});

// ─── GET /api/v1/notifications/random ────────────────────────────────────────
// Get a random notification for the streaming dashboard popup
router.get('/random', (req: Request, res: Response) => {
  try {
    const tokenRole = extractRoleFromHeader(req);
    const role = (req.query.role as string) || tokenRole || undefined;
    const randomNotif = notificationService.getRandomNotification(role);
    return res.json({ success: true, data: randomNotif });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'RANDOM_NOTIF_FAILED', message: err.message },
    });
  }
});

// ─── GET /api/v1/notifications/categories ────────────────────────────────────
// Get all 50 notification categories and count
router.get('/categories', (_req: Request, res: Response) => {
  try {
    const categories = notificationService.getAllCategories();
    return res.json({ success: true, data: categories, meta: { totalCategories: categories.length } });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'CATEGORIES_FAILED', message: err.message },
    });
  }
});

// ─── POST /api/v1/notifications ──────────────────────────────────────────────
// Create new notification (role-targeted or system-wide)
router.post('/', (req: Request, res: Response) => {
  const {
    title,
    message,
    role = 'ALL',
    severity = 'INFO',
    category = 'OPERATIONS',
    link,
    metadata,
  } = req.body;

  if (!title || !message) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'title and message are required' },
    });
  }

  try {
    const created = notificationService.create({
      title,
      message,
      role,
      severity: severity as NotificationSeverity,
      category: category as NotificationCategory,
      link,
      metadata,
    });

    return res.status(201).json({
      success: true,
      data: created,
      message: 'Notification dispatched successfully',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: err.message },
    });
  }
});

// Backward compatibility: POST /api/v1/notifications/send
router.post('/send', (req: Request, res: Response) => {
  const { title, message, role = 'ALL', severity = 'INFO', category = 'OPERATIONS', link } = req.body;
  if (!title || !message) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_FAILED', message: 'title and message are required' },
    });
  }
  const created = notificationService.create({ title, message, role, severity, category, link });
  return res.status(201).json({ success: true, data: created });
});

// ─── PATCH /api/v1/notifications/:id/read ────────────────────────────────────
// Mark single notification as read
router.patch('/:id/read', (req: Request, res: Response) => {
  const updated = notificationService.markAsRead(req.params.id);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Notification not found' },
    });
  }
  return res.json({ success: true, data: updated });
});

// Also support POST /:id/read
router.post('/:id/read', (req: Request, res: Response) => {
  const updated = notificationService.markAsRead(req.params.id);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Notification not found' },
    });
  }
  return res.json({ success: true, data: updated });
});

// ─── POST /api/v1/notifications/:id/acknowledge ─────────────────────────────
// Acknowledge notification
router.post('/:id/acknowledge', (req: Request, res: Response) => {
  const updated = notificationService.acknowledge(req.params.id);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Notification not found' },
    });
  }
  return res.json({ success: true, data: updated });
});

// ─── POST /api/v1/notifications/mark-all-read ────────────────────────────────
// Mark all notifications for user's role as read
router.post('/mark-all-read', (req: Request, res: Response) => {
  const tokenRole = extractRoleFromHeader(req);
  const role = req.body.role || tokenRole || undefined;
  const markedCount = notificationService.markAllAsRead(role);
  return res.json({
    success: true,
    data: { markedCount },
    message: `Marked ${markedCount} notifications as read`,
  });
});

// ─── DELETE /api/v1/notifications/:id ────────────────────────────────────────
// Delete notification
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = notificationService.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Notification not found' },
    });
  }
  return res.json({ success: true, message: 'Notification removed' });
});

export default router;
