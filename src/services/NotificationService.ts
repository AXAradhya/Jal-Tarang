/**
 * JAL TARANG - Role-Based Maritime Notification Service
 * In-memory + PostgreSQL synced operational alerts engine.
 * Delivers role-targeted real-time updates for:
 * - Chartering (Fixtures, laycan, Baltic freight rates, demurrage)
 * - Procurement (Stock buffer cushions, coking coal tenders, FOB/CFR arbitrage)
 * - Port Operations (Berth waiting, draft restrictions, weather closures)
 * - Quantitative Analyst (ML forecast deviations, bunker prices, forward curves)
 * - Super Admin / Governance (High-value contract clearance, CVC audit events, security)
 */

import crypto from 'crypto';
import { FIFTY_MARITIME_NOTIFICATIONS } from './notificationsDataset.js';

export type NotificationSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
export type NotificationCategory = 
  | 'VESSEL_TELEMETRY'
  | 'CYCLONE_ALERT'
  | 'PORT_CONGESTION'
  | 'FX_VOLATILITY'
  | 'BUNKER_PRICES'
  | 'STOCK_BUFFER'
  | 'CHARTERING_FIXTURE'
  | 'CANAL_TRANSIT'
  | 'RIGHTSHIP_VETTING'
  | 'DEMURRAGE_RISK'
  | 'TENDER_AWARD'
  | 'BALTIC_DRY_INDEX'
  | 'RAIL_EVACUATION'
  | 'GEOPOLITICAL_RISK'
  | 'DRAUGHT_RESTRICTION'
  | 'COMMODITY_BENCHMARK'
  | 'AI_FORECAST_SIGNAL'
  | 'CARBON_EMISSIONS'
  | 'CREW_WELFARE'
  | 'P_AND_I_CLUB'
  | 'BLAST_FURNACE_DEMAND'
  | 'COUNTERPARTY_KYC'
  | 'PILOTAGE_SUSPENSION'
  | 'ARBITRAGE_WINDOW'
  | 'LIGHTERING_OPERATION'
  | 'CUSTOMS_CLEARANCE'
  | 'MONSOON_ADVISORY'
  | 'VOYAGE_OPTIMIZATION'
  | 'CONTRACT_MILESTONE'
  | 'TIDAL_WINDOW'
  | 'SECURITY_THREAT'
  | 'EQUIPMENT_MAINTENANCE'
  | 'HEDGE_RECOMMENDATION'
  | 'LABOR_UNION_NOTICE'
  | 'INSURANCE_WAR_RISK'
  | 'QUALITY_ASSURANCE'
  | 'BALLAST_WATER'
  | 'BERTH_PRODUCTIVITY'
  | 'STORAGE_YARD_CAPACITY'
  | 'COAL_WASHING'
  | 'OCEAN_CURRENT'
  | 'DISPUTE_RESOLUTION'
  | 'ESCROW_RELEASE'
  | 'SATELLITE_RADAR'
  | 'EMERGENCY_DRILL'
  | 'IMPORT_DUTY'
  | 'CONTAINER_FEEDER'
  | 'WEATHER_ROUTING'
  | 'AUDIT_COMPLIANCE'
  | 'CYBER_DEFENSE'
  | 'FREIGHT'
  | 'OPERATIONS'
  | 'CONTRACTS'
  | 'WEATHER'
  | 'AUDIT'
  | 'SYSTEM'
  | string;

export interface MaritimeNotification {
  id: string;
  title: string;
  message: string;
  role: string; // 'ALL' | 'CHARTERING_OFFICER' | 'CHARTERING_MANAGER' | 'PROCUREMENT_OFFICER' | 'PROCUREMENT_MANAGER' | 'PORT_MANAGER' | 'ANALYST' | 'SUPER_ADMIN' | 'ADMIN'
  severity: NotificationSeverity;
  category: NotificationCategory;
  link?: string;
  isRead: boolean;
  readAt?: string | null;
  isAcknowledged: boolean;
  acknowledgedAt?: string | null;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface CreateNotificationInput {
  title: string;
  message: string;
  role?: string;
  severity?: NotificationSeverity;
  category?: NotificationCategory;
  link?: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  private notifications: MaritimeNotification[] = [];

  constructor() {
    this.seedInitialNotifications();
  }

  private seedInitialNotifications() {
    const now = Date.now();

    this.notifications = FIFTY_MARITIME_NOTIFICATIONS.map((item, idx) => {
      // Stagger created timestamps across the last 24 hours
      // The first 8 notifications are fresh (within 3-30 minutes)
      const minutesAgo = idx < 8 ? idx * 4 + 3 : 35 + (idx - 8) * 28;
      const isUnread = idx < 12; // Top 12 unread for active engagement

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

  // ─── Get Random Notification (for Dashboard Popups) ─────────────────────────
  public getRandomNotification(role?: string): MaritimeNotification {
    const normalizedRole = role ? role.toUpperCase() : 'ALL';
    const candidates = this.notifications.filter((n) => {
      if (normalizedRole === 'ALL' || normalizedRole.includes('ADMIN') || normalizedRole === 'SUPER_ADMIN') return true;
      const notifRole = n.role.toUpperCase();
      if (notifRole === 'ALL') return true;
      if (notifRole === normalizedRole) return true;
      if (normalizedRole.includes('CHARTERING') && notifRole.includes('CHARTERING')) return true;
      if (normalizedRole.includes('PROCUREMENT') && notifRole.includes('PROCUREMENT')) return true;
      if (normalizedRole.includes('PORT') && notifRole.includes('PORT')) return true;
      if (normalizedRole.includes('ANALYST') && notifRole.includes('ANALYST')) return true;
      return false;
    });

    const pool = candidates.length > 0 ? candidates : this.notifications;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }

  // ─── Get All Categories ──────────────────────────────────────────────────────
  public getAllCategories() {
    const catMap: Record<string, number> = {};
    for (const n of this.notifications) {
      catMap[n.category] = (catMap[n.category] || 0) + 1;
    }
    return Object.entries(catMap).map(([category, count]) => ({ category, count }));
  }

  // ─── Query Notifications ─────────────────────────────────────────────────────
  public getAll(options: {
    role?: string;
    unreadOnly?: boolean;
    severity?: string;
    category?: string;
  } = {}): { notifications: MaritimeNotification[]; unreadCount: number; totalCount: number } {
    let filtered = [...this.notifications];

    // Filter by role: Return notifications matching user role or broadcast 'ALL'
    if (options.role && options.role.toUpperCase() !== 'ALL') {
      const userRole = options.role.toUpperCase();
      filtered = filtered.filter((n) => {
        const notifRole = n.role.toUpperCase();
        if (notifRole === 'ALL') return true;
        if (notifRole === userRole) return true;
        // Map common synonyms
        if (userRole.includes('CHARTERING') && notifRole.includes('CHARTERING')) return true;
        if (userRole.includes('PROCUREMENT') && notifRole.includes('PROCUREMENT')) return true;
        if (userRole.includes('PORT') && notifRole.includes('PORT')) return true;
        if (userRole.includes('ANALYST') && notifRole.includes('ANALYST')) return true;
        if (userRole.includes('ADMIN') && notifRole.includes('ADMIN')) return true;
        return false;
      });
    }

    if (options.unreadOnly) {
      filtered = filtered.filter((n) => !n.isRead);
    }

    if (options.severity && options.severity.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((n) => n.severity.toUpperCase() === options.severity!.toUpperCase());
    }

    if (options.category && options.category.toUpperCase() !== 'ALL') {
      filtered = filtered.filter((n) => n.category.toUpperCase() === options.category!.toUpperCase());
    }

    // Sort: unread first, then by createdAt descending
    filtered.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const unreadCount = filtered.filter((n) => !n.isRead).length;

    return {
      notifications: filtered,
      unreadCount,
      totalCount: filtered.length,
    };
  }

  // ─── Create Notification ─────────────────────────────────────────────────────
  public create(input: CreateNotificationInput): MaritimeNotification {
    const newNotification: MaritimeNotification = {
      id: `notif-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`,
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

    // Prepend to list
    this.notifications.unshift(newNotification);

    // Limit in-memory store to 200 items
    if (this.notifications.length > 200) {
      this.notifications.pop();
    }

    return newNotification;
  }

  // ─── Mark Single as Read ─────────────────────────────────────────────────────
  public markAsRead(id: string): MaritimeNotification | null {
    const notif = this.notifications.find((n) => n.id === id);
    if (!notif) return null;
    notif.isRead = true;
    notif.readAt = new Date().toISOString();
    return notif;
  }

  // ─── Mark All as Read ────────────────────────────────────────────────────────
  public markAllAsRead(role?: string): number {
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

  // ─── Acknowledge ─────────────────────────────────────────────────────────────
  public acknowledge(id: string): MaritimeNotification | null {
    const notif = this.notifications.find((n) => n.id === id);
    if (!notif) return null;
    notif.isAcknowledged = true;
    notif.acknowledgedAt = new Date().toISOString();
    notif.isRead = true;
    notif.readAt = notif.readAt || notif.acknowledgedAt;
    return notif;
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────
  public delete(id: string): boolean {
    const initialLen = this.notifications.length;
    this.notifications = this.notifications.filter((n) => n.id !== id);
    return this.notifications.length < initialLen;
  }

  // ─── Summary Statistics ──────────────────────────────────────────────────────
  public getSummary(role?: string) {
    const { notifications, unreadCount } = this.getAll({ role });
    const criticalCount = notifications.filter((n) => n.severity === 'CRITICAL' && !n.isRead).length;
    const warningCount = notifications.filter((n) => n.severity === 'WARNING' && !n.isRead).length;
    const infoCount = notifications.filter((n) => n.severity === 'INFO' && !n.isRead).length;
    const successCount = notifications.filter((n) => n.severity === 'SUCCESS' && !n.isRead).length;

    const byCategory: Record<string, number> = {};
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

export const notificationService = new NotificationService();
