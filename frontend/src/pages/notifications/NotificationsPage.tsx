import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Plus,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  Search,
  Layers,
  ArrowRight,
  Send,
  Shield,
  Anchor,
  Package,
  MapPin,
  TrendingUp,
  CloudRain,
  SlidersHorizontal,
  RefreshCw,
  X,
  Moon
} from 'lucide-react';
import { notificationApi } from '../../api';
import { LoadingSpinner } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { showToast } from '../../store/toastStore';
import { cn } from '../../lib/utils';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  role: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  category: string;
  link?: string;
  isRead: boolean;
  readAt?: string | null;
  isAcknowledged: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  STOCK_BUFFER: <Package size={14} className="text-amber-500" />,
  FREIGHT: <TrendingUp size={14} className="text-blue-500" />,
  PORT_CONGESTION: <MapPin size={14} className="text-red-500" />,
  OPERATIONS: <Anchor size={14} className="text-sky-500" />,
  CONTRACTS: <Shield size={14} className="text-indigo-500" />,
  WEATHER: <CloudRain size={14} className="text-cyan-500" />,
  AUDIT: <Shield size={14} className="text-emerald-500" />,
  SYSTEM: <Layers size={14} className="text-purple-500" />,
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const activeRole = user?.roles?.[0] || 'CHARTERING_MANAGER';
  const settings = useSettingsStore((s) => s.settings);

  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New notification form state
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newRole, setNewRole] = useState('ALL');
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS'>('WARNING');
  const [newCategory, setNewCategory] = useState('OPERATIONS');
  const [newLink, setNewLink] = useState('/decision');
  const [formError, setFormError] = useState('');
  const [showSilencedInDnd, setShowSilencedInDnd] = useState(false);

  // Fetch notifications
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['notifications', 'page-list'],
    queryFn: async () => {
      const res = await notificationApi.list();
      return (res?.data || []) as NotificationItem[];
    },
    refetchInterval: 8000,
  });

  const notifications = data || [];

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(selectedRole === 'ALL' ? undefined : selectedRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      message: string;
      role: string;
      severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
      category: string;
      link?: string;
    }) => notificationApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowCreateModal(false);
      setNewTitle('');
      setNewMessage('');
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error?.message || err?.message || 'Failed to dispatch alert');
    },
  });

  // Relative time formatting
  const formatRelativeTime = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Metrics
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const criticalCount = notifications.filter((n) => n.severity === 'CRITICAL' && !n.isRead).length;
  const warningCount = notifications.filter((n) => n.severity === 'WARNING' && !n.isRead).length;

  // Filter logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // DND filter: if DND is active and !showSilencedInDnd, only Crucial (CRITICAL) notifications arrive
      if (settings?.dndEnabled && !showSilencedInDnd && n.severity !== 'CRITICAL') return false;

      // Category filter checks based on Enterprise Settings
      if (settings) {
        const cat = (n.category || '').toUpperCase();
        if (!settings.notifyCycloneAlerts && (cat === 'CYCLONE_ALERT' || cat === 'MONSOON_ADVISORY' || cat === 'WEATHER_ROUTING')) {
          return false;
        }
        if (!settings.notifyPortCongestion && (cat === 'PORT_CONGESTION' || cat === 'PILOTAGE_SUSPENSION' || cat === 'BERTH_PRODUCTIVITY' || cat === 'DRAUGHT_RESTRICTION')) {
          return false;
        }
        if (!settings.notifyStockBufferBreach && (cat === 'STOCK_BUFFER' || cat === 'BLAST_FURNACE_DEMAND' || cat === 'STORAGE_YARD_CAPACITY' || cat === 'COAL_WASHING')) {
          return false;
        }
        if (!settings.notifyFxFluctuations && (cat === 'FX_VOLATILITY' || cat === 'ARBITRAGE_WINDOW' || cat === 'ESCROW_RELEASE' || cat === 'IMPORT_DUTY')) {
          return false;
        }
        if (!settings.notifyBunkerShocks && (cat === 'BUNKER_PRICES')) {
          return false;
        }
        if (!settings.notifyRightShipVetting && (cat === 'RIGHTSHIP_VETTING' || cat === 'CREW_WELFARE' || cat === 'P_AND_I_CLUB' || cat === 'BALLAST_WATER')) {
          return false;
        }
      }

      if (unreadOnly && n.isRead) return false;
      if (selectedSeverity !== 'ALL' && n.severity !== selectedSeverity) return false;
      if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
      if (selectedRole !== 'ALL') {
        const notifRole = n.role.toUpperCase();
        const roleQuery = selectedRole.toUpperCase();
        if (notifRole !== 'ALL' && !notifRole.includes(roleQuery) && !roleQuery.includes(notifRole.split('_')[0])) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchMsg = n.message.toLowerCase().includes(q);
        const matchRole = n.role.toLowerCase().includes(q);
        const matchCat = n.category.toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchRole && !matchCat) return false;
      }
      return true;
    });
  }, [notifications, unreadOnly, selectedSeverity, selectedCategory, selectedRole, searchQuery, settings, showSilencedInDnd]);

  const handleActionClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      setFormError('Title and message are required.');
      return;
    }
    createMutation.mutate({
      title: newTitle,
      message: newMessage,
      role: newRole,
      severity: newSeverity,
      category: newCategory,
      link: newLink.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bell size={20} />
            </div>
            <h1 className="text-lg font-bold text-foreground">Operational Notification Center</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Role-targeted operational alerts, supply chain disruption warnings, and real-time voyage telemetry updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* DND Toggle Button */}
          <button
            onClick={() => {
              const newDnd = !settings?.dndEnabled;
              useSettingsStore.getState().updateSetting('dndEnabled', newDnd);
              if (newDnd) {
                showToast('DND Activated', 'Only Crucial (CRITICAL) operational notifications will arrive', 'info');
              } else {
                showToast('DND Deactivated', 'All operational alerts enabled', 'info');
              }
            }}
            title={settings?.dndEnabled ? 'Do Not Disturb is ACTIVE (Only Crucial alerts)' : 'Turn ON Do Not Disturb'}
            className={cn(
              'px-3 py-2 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
              settings?.dndEnabled
                ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500 shadow-xs'
                : 'border-border bg-card hover:bg-muted text-foreground'
            )}
          >
            <Moon size={14} className={settings?.dndEnabled ? 'fill-white text-white' : 'text-muted-foreground'} />
            <span>DND: {settings?.dndEnabled ? 'Active (Crucial Only)' : 'Off'}</span>
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
            className="px-3 py-2 rounded-md border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <CheckCheck size={14} />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus size={14} />
            <span>Create Notification</span>
          </button>
        </div>
      </div>

      {/* DND Active Alert Banner */}
      {settings?.dndEnabled && (
        <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl flex items-center justify-between text-xs text-purple-900 dark:text-purple-200 shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-200/80 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300">
              <Moon size={16} className="fill-purple-500 text-purple-600" />
            </div>
            <div>
              <span className="font-bold">Do Not Disturb Mode is ACTIVE</span>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mt-0.5">
                Only <strong>CRITICAL (Crucial)</strong> operational notifications will trigger popups and audio chimes. All informational and routine warnings are silenced.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSilencedInDnd(!showSilencedInDnd)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800 transition shadow-2xs cursor-pointer"
            >
              {showSilencedInDnd ? 'Hide Silenced Alerts' : `Show Silenced (${notifications.filter((n) => n.severity !== 'CRITICAL').length})`}
            </button>
            <button
              onClick={() => {
                useSettingsStore.getState().updateSetting('dndEnabled', false);
                showToast('DND Deactivated', 'All operational alerts enabled', 'info');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-slate-800 border border-purple-200 dark:border-purple-800 transition shadow-2xs cursor-pointer"
            >
              Turn Off DND
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Alerts</span>
          <div className="text-xl font-bold text-foreground mt-1">{totalCount}</div>
          <span className="text-[11px] text-muted-foreground">Across all modules</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Unread Alerts</span>
          <div className="text-xl font-bold text-primary mt-1">{unreadCount}</div>
          <span className="text-[11px] text-muted-foreground">Pending user review</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Critical Alerts</span>
          <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{criticalCount}</div>
          <span className="text-[11px] text-muted-foreground">Action required</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Operational Warnings</span>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{warningCount}</div>
          <span className="text-[11px] text-muted-foreground">Demurrage / Buffer risk</span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vessel, steel plant, freight index, or port…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick toggle unread */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span className="font-medium">Unread Only</span>
            </label>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/60">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Target Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground"
            >
              <option value="ALL">All Roles (Broadcast)</option>
              <option value="CHARTERING">Chartering & Fleet</option>
              <option value="PROCUREMENT">Procurement & Raw Materials</option>
              <option value="PORT">Port Logistics</option>
              <option value="ANALYST">Quantitative Analyst</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Severity Level</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Informational</option>
              <option value="SUCCESS">Success</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Operational Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground"
            >
              <option value="ALL">All Categories</option>
              <option value="STOCK_BUFFER">Stock Buffer</option>
              <option value="FREIGHT">Freight Market</option>
              <option value="PORT_CONGESTION">Port Congestion</option>
              <option value="OPERATIONS">Fleet Operations</option>
              <option value="CONTRACTS">Contracts</option>
              <option value="WEATHER">Weather & IMD</option>
              <option value="AUDIT">CVC Audit</option>
              <option value="SYSTEM">System Health</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Cards */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <LoadingSpinner size="lg" />
            <span className="text-xs">Loading maritime notifications…</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-card border border-border rounded-lg py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-foreground">No notifications found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No operational alerts match your active filter criteria. Clear filters or create a new alert.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isCritical = item.severity === 'CRITICAL';
            const isWarning = item.severity === 'WARNING';
            const isSuccess = item.severity === 'SUCCESS';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all ${
                  item.isRead
                    ? 'bg-card hover:bg-muted/20 border-border text-foreground/80'
                    : 'bg-primary/5 dark:bg-primary/10 border-primary/30 text-foreground shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    {/* Header tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          isCritical
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                            : isWarning
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : isSuccess
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {isCritical ? (
                          <AlertTriangle size={11} />
                        ) : isWarning ? (
                          <AlertCircle size={11} />
                        ) : isSuccess ? (
                          <CheckCircle2 size={11} />
                        ) : (
                          <Info size={11} />
                        )}
                        <span>{item.severity}</span>
                      </span>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {(item.role || 'ALL').replace(/_/g, ' ')}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        {CATEGORY_ICONS[item.category] ?? <Layers size={12} />}
                        <span className="capitalize">{(item.category || 'OPERATIONS').toLowerCase().replace(/_/g, ' ')}</span>
                      </span>

                      <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="flex items-center gap-2 pt-0.5">
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                      )}
                      <h2 className="text-sm font-bold text-foreground">
                        {item.title}
                      </h2>
                    </div>

                    {/* Message body */}
                    <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                      {item.message}
                    </p>
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => deleteMutation.mutate(item.id)}
                      title="Remove notification"
                      className="p-1.5 rounded-md text-muted-foreground/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    {!item.isRead && (
                      <button
                        onClick={() => markReadMutation.mutate(item.id)}
                        className="text-[10px] font-semibold text-primary hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer action link */}
                {item.link && (
                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between pl-4">
                    <button
                      onClick={() => handleActionClick(item)}
                      className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <span>Navigate to {item.link}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Create Operational Alert</h3>
                  <p className="text-[11px] text-muted-foreground">Broadcast to role or all users</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              {formError && (
                <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Alert Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Paradip Port Demurrage Risk Warning"
                  className="w-full bg-muted/40 border border-border rounded-md px-3 py-2 text-foreground text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-foreground mb-1">
                  Message Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Detailed context, stock buffers, affected vessel IMO, laycan window…"
                  className="w-full bg-muted/40 border border-border rounded-md px-3 py-2 text-foreground text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">Target Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs"
                  >
                    <option value="ALL">All Roles (Broadcast)</option>
                    <option value="CHARTERING_OFFICER">Chartering Officer</option>
                    <option value="CHARTERING_MANAGER">Chartering Manager</option>
                    <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                    <option value="PROCUREMENT_MANAGER">Procurement Manager</option>
                    <option value="PORT_MANAGER">Port Manager</option>
                    <option value="ANALYST">Quantitative Analyst</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs"
                  >
                    <option value="WARNING">WARNING (Operational Attention)</option>
                    <option value="CRITICAL">CRITICAL (Action Required)</option>
                    <option value="INFO">INFO (Informational)</option>
                    <option value="SUCCESS">SUCCESS (Clearance / Award)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs"
                  >
                    <option value="OPERATIONS">Fleet Operations</option>
                    <option value="STOCK_BUFFER">Stock Buffer (Plants)</option>
                    <option value="FREIGHT">Freight Market</option>
                    <option value="PORT_CONGESTION">Port Congestion</option>
                    <option value="CONTRACTS">Contracts & Clearance</option>
                    <option value="WEATHER">Weather & IMD</option>
                    <option value="AUDIT">CVC Audit & Governance</option>
                    <option value="SYSTEM">System Health</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-foreground mb-1">Target Route / Link</label>
                  <select
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-md px-2.5 py-1.5 text-foreground text-xs"
                  >
                    <option value="/decision">Decision Center (/decision)</option>
                    <option value="/procurement">Procurement Dashboard (/procurement)</option>
                    <option value="/chartering">Chartering & Vessels (/chartering)</option>
                    <option value="/ports">Port Intelligence (/ports)</option>
                    <option value="/contracts">Contracts (/contracts)</option>
                    <option value="/forecasting">Freight Forecasting (/forecasting)</option>
                    <option value="/control-tower">Control Tower (/control-tower)</option>
                    <option value="/scenarios">Scenario Center (/scenarios)</option>
                    <option value="/audit">Audit & Logs (/audit)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-md border border-border hover:bg-muted text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {createMutation.isPending ? <LoadingSpinner size="sm" /> : <Send size={13} />}
                  <span>Dispatch Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
