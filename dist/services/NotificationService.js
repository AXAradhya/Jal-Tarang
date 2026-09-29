"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const notificationsDataset_js_1 = require("./notificationsDataset.js");
class NotificationService {
    notifications = [];
    constructor() {
        this.seedInitialNotifications();
    }
    seedInitialNotifications() {
        const now = Date.now();
        this.notifications = notificationsDataset_js_1.FIFTY_MARITIME_NOTIFICATIONS.map((item, idx) => {
            const minutesAgo = idx < 8 ? idx * 4 + 3 : 35 + (idx - 8) * 28;
            const isUnread = idx < 12;
            return {
                ...item,
                isRead: !isUnread,
                readAt: isUnread ? null : new Date(now - (minutesAgo - 5) * 60 * 1000).toISOString(),
                isAcknowledged: false,
                acknowledgedAt: null,
                createdAt: new Date(now - minutesAgo * 60 * 1000).toISOString(),
            };
        });
    }
    getRandomNotification(role) {
        const normalizedRole = role ? role.toUpperCase() : 'ALL';
        const candidates = this.notifications.filter((n) => {
            if (normalizedRole === 'ALL' || normalizedRole.includes('ADMIN') || normalizedRole === 'SUPER_ADMIN')
                return true;
            const notifRole = n.role.toUpperCase();
            if (notifRole === 'ALL')
                return true;
            if (notifRole === normalizedRole)
                return true;
            if (normalizedRole.includes('CHARTERING') && notifRole.includes('CHARTERING'))
                return true;
            if (normalizedRole.includes('PROCUREMENT') && notifRole.includes('PROCUREMENT'))
                return true;
            if (normalizedRole.includes('PORT') && notifRole.includes('PORT'))
                return true;
            if (normalizedRole.includes('ANALYST') && notifRole.includes('ANALYST'))
                return true;
            return false;
        });
        const pool = candidates.length > 0 ? candidates : this.notifications;
        const randomIndex = Math.floor(Math.random() * pool.length);
        return pool[randomIndex];
    }
    getAllCategories() {
        const catMap = {};
        for (const n of this.notifications) {
            catMap[n.category] = (catMap[n.category] || 0) + 1;
        }
        return Object.entries(catMap).map(([category, count]) => ({ category, count }));
    }
    getAll(options = {}) {
        let filtered = [...this.notifications];
        if (options.role && options.role.toUpperCase() !== 'ALL') {
            const userRole = options.role.toUpperCase();
            filtered = filtered.filter((n) => {
                const notifRole = n.role.toUpperCase();
                if (notifRole === 'ALL')
                    return true;
                if (notifRole === userRole)
                    return true;
                if (userRole.includes('CHARTERING') && notifRole.includes('CHARTERING'))
                    return true;
                if (userRole.includes('PROCUREMENT') && notifRole.includes('PROCUREMENT'))
                    return true;
                if (userRole.includes('PORT') && notifRole.includes('PORT'))
                    return true;
                if (userRole.includes('ANALYST') && notifRole.includes('ANALYST'))
                    return true;
                if (userRole.includes('ADMIN') && notifRole.includes('ADMIN'))
                    return true;
                return false;
            });
        }
        if (options.unreadOnly) {
            filtered = filtered.filter((n) => !n.isRead);
        }
        if (options.severity && options.severity.toUpperCase() !== 'ALL') {
            filtered = filtered.filter((n) => n.severity.toUpperCase() === options.severity.toUpperCase());
        }
        if (options.category && options.category.toUpperCase() !== 'ALL') {
            filtered = filtered.filter((n) => n.category.toUpperCase() === options.category.toUpperCase());
        }
        filtered.sort((a, b) => {
            if (a.isRead !== b.isRead)
                return a.isRead ? 1 : -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        const unreadCount = filtered.filter((n) => !n.isRead).length;
        return {
            notifications: filtered,
            unreadCount,
            totalCount: filtered.length,
        };
    }
    create(input) {
        const newNotification = {
            id: `notif-${Date.now()}-${crypto_1.default.randomUUID().substring(0, 8)}`,
            title: input.title.trim(),
            message: input.message.trim(),
            role: (input.role || 'ALL').toUpperCase(),
            severity: input.severity || 'INFO',
            category: input.category || 'OPERATIONS',
            link: input.link,
            isRead: false,
            isAcknowledged: false,
            createdAt: new Date().toISOString(),
            metadata: input.metadata,
        };
        this.notifications.unshift(newNotification);
        if (this.notifications.length > 200) {
            this.notifications.pop();
        }
        return newNotification;
    }
    markAsRead(id) {
        const notif = this.notifications.find((n) => n.id === id);
        if (!notif)
            return null;
        notif.isRead = true;
        notif.readAt = new Date().toISOString();
        return notif;
    }
    markAllAsRead(role) {
        let count = 0;
        const nowIso = new Date().toISOString();
        for (const n of this.notifications) {
            if (!n.isRead) {
                if (!role || role.toUpperCase() === 'ALL' || n.role === 'ALL' || n.role === role.toUpperCase()) {
                    n.isRead = true;
                    n.readAt = nowIso;
                    count++;
                }
            }
        }
        return count;
    }
    acknowledge(id) {
        const notif = this.notifications.find((n) => n.id === id);
        if (!notif)
            return null;
        notif.isAcknowledged = true;
        notif.acknowledgedAt = new Date().toISOString();
        notif.isRead = true;
        notif.readAt = notif.readAt || notif.acknowledgedAt;
        return notif;
    }
    delete(id) {
        const initialLen = this.notifications.length;
        this.notifications = this.notifications.filter((n) => n.id !== id);
        return this.notifications.length < initialLen;
    }
    getSummary(role) {
        const { notifications, unreadCount } = this.getAll({ role });
        const criticalCount = notifications.filter((n) => n.severity === 'CRITICAL' && !n.isRead).length;
        const warningCount = notifications.filter((n) => n.severity === 'WARNING' && !n.isRead).length;
        const infoCount = notifications.filter((n) => n.severity === 'INFO' && !n.isRead).length;
        const successCount = notifications.filter((n) => n.severity === 'SUCCESS' && !n.isRead).length;
        const byCategory = {};
        for (const n of notifications) {
            byCategory[n.category] = (byCategory[n.category] || 0) + 1;
        }
        return {
            total: notifications.length,
            unread: unreadCount,
            criticalUnread: criticalCount,
            warningUnread: warningCount,
            infoUnread: infoCount,
            successUnread: successCount,
            byCategory,
        };
    }
}
exports.notificationService = new NotificationService();
//# sourceMappingURL=NotificationService.js.map