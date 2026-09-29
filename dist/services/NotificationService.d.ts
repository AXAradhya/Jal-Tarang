export type NotificationSeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
export type NotificationCategory = 'STOCK_BUFFER' | 'FREIGHT' | 'PORT_CONGESTION' | 'OPERATIONS' | 'CONTRACTS' | 'WEATHER' | 'AUDIT' | 'SYSTEM';
export interface MaritimeNotification {
    id: string;
    title: string;
    message: string;
    role: string;
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
declare class NotificationService {
    private notifications;
    constructor();
    private seedInitialNotifications;
    getAll(options?: {
        role?: string;
        unreadOnly?: boolean;
        severity?: string;
        category?: string;
    }): {
        notifications: MaritimeNotification[];
        unreadCount: number;
        totalCount: number;
    };
    create(input: CreateNotificationInput): MaritimeNotification;
    markAsRead(id: string): MaritimeNotification | null;
    markAllAsRead(role?: string): number;
    acknowledge(id: string): MaritimeNotification | null;
    delete(id: string): boolean;
    getSummary(role?: string): {
        total: number;
        unread: number;
        criticalUnread: number;
        warningUnread: number;
        infoUnread: number;
        successUnread: number;
        byCategory: Record<string, number>;
    };
}
export declare const notificationService: NotificationService;
export {};
