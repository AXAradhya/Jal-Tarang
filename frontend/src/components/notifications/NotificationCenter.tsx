import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Plus,
  X,
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
  ExternalLink,
  Moon
} from 'lucide-react';
import { notificationApi } from '../../api';
import { LoadingSpinner } from '../common';
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

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  STOCK_BUFFER: <Package size={13} className="text-amber-500" />,
  FREIGHT: <TrendingUp size={13} className="text-blue-500" />,
  PORT_CONGESTION: <MapPin size={13} className="text-red-500" />,
  OPERATIONS: <Anchor size={13} className="text-sky-500" />,
  CONTRACTS: <Shield size={13} className="text-indigo-500" />,
  WEATHER: <CloudRain size={13} className="text-cyan-500" />,
  AUDIT: <Shield size={13} className="text-emerald-500" />,
  SYSTEM: <Layers size={13} className="text-purple-500" />,
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  activeRole,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'all' | 'myRole' | 'critical' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSilencedInDnd, setShowSilencedInDnd] = useState(false);
  const settings = useSettingsStore((s) => s.settings);

  // New notification form state
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newRole, setNewRole] = useState('ALL');
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS'>('WARNING');
  const [newCategory, setNewCategory] = useState('OPERATIONS');
  const [newLink, setNewLink] = useState('/decision');
  const [formError, setFormError] = useState('');

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(activeRole),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
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

  // Relative time helper
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

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // DND filter: if DND is active and user has not toggled showSilencedInDnd, only Crucial (CRITICAL) notifications arrive
      if (settings?.dndEnabled && !showSilencedInDnd && n.severity !== 'CRITICAL') {
        return false;
      }

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

      // Tab filter
      if (activeTab === 'unread' && n.isRead) return false;
      if (activeTab === 'critical' && n.severity !== 'CRITICAL') return false;
      if (activeTab === 'myRole') {
        const notifRole = (n.role || 'ALL').toUpperCase();
        const userRole = (activeRole || '').toUpperCase();
        if (notifRole !== 'ALL' && !userRole.includes(notifRole) && !notifRole.includes(userRole.split('_')[0])) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (n.title || '').toLowerCase().includes(q);
        const matchesMessage = (n.message || '').toLowerCase().includes(q);
        const matchesCategory = (n.category || '').toLowerCase().includes(q);
        const matchesRole = (n.role || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesMessage && !matchesCategory && !matchesRole) return false;
      }

      return true;
    });
  }, [notifications, activeTab, activeRole, searchQuery, settings, showSilencedInDnd]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const criticalCount = notifications.filter((n) => n.severity === 'CRITICAL' && !n.isRead).length;
  const myRoleCount = notifications.filter((n) => {
    const notifRole = (n.role || 'ALL').toUpperCase();
    const userRole = (activeRole || '').toUpperCase();
    return notifRole === 'ALL' || userRole.includes(notifRole) || notifRole.includes(userRole.split('_')[0]);
  }).length;

  const handleActionClick = (n: NotificationItem) => {
    if (!n.isRead) {
      markReadMutation.mutate(n.id);
    }
    if (n.link) {
      navigate(n.link);
      onClose();
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      setFormError('Please enter both title and message.');
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

  // iOS-style smooth open and close popover lifecycle
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animClass, setAnimClass] = useState(isOpen ? 'animate-ios-shade-open' : '');
  const [backdropClass, setBackdropClass] = useState(isOpen ? 'animate-ios-backdrop-open' : '');
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    if (isOpen) {
      setShouldRender(true);
      setAnimClass('animate-ios-shade-open');
      setBackdropClass('animate-ios-backdrop-open');
    } else if (shouldRender) {
      setAnimClass('animate-ios-shade-close');
      setBackdropClass('animate-ios-backdrop-close');
      animTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
        setBackdropClass('');
      }, 240);
    }

    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Click outside to close backdrop without darkening the header bar */}
      <div
        className={cn("fixed inset-0 z-[60] bg-transparent", backdropClass)}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Top Dropdown Popover Container: 100% Solid Opaque Background with Fluid Spring Animation */}
      <div
        className={cn("fixed inset-x-2 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[460px] md:w-[480px] max-w-[96vw] h-[580px] max-h-[82vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[70] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 origin-top-right", animClass)}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 border border-blue-200 dark:border-blue-800 relative">
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Operational Notifications</h2>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Role-targeted dispatch across fleet ops & steel plants
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* DND Toggle Pill */}
            <button
              onClick={() => {
                const newDnd = !settings?.dndEnabled;
                useSettingsStore.getState().updateSetting('dndEnabled', newDnd);
                if (newDnd) {
                  showToast('DND Activated', 'Only Crucial (CRITICAL) notifications will arrive', 'info');
                } else {
                  showToast('DND Deactivated', 'All operational alerts enabled', 'info');
                }
              }}
              title={settings?.dndEnabled ? 'Do Not Disturb is ACTIVE (Click to turn off)' : 'Turn ON Do Not Disturb (Only Crucial alerts)'}
              className={cn(
                'px-2 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs',
                settings?.dndEnabled
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              )}
            >
              <Moon size={12} className={settings?.dndEnabled ? 'fill-white text-white' : 'text-slate-500'} />
              <span>DND {settings?.dndEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
              title="Create new role-based alert"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">New Alert</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 flex-shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by vessel, port, commodity, or tag…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* DND Active Notice Banner */}
          {settings?.dndEnabled && (
            <div className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-lg flex items-center justify-between text-[11px] text-purple-900 dark:text-purple-200">
              <div className="flex items-center gap-1.5 font-medium">
                <Moon size={12} className="text-purple-600 dark:text-purple-400 fill-purple-400/40 shrink-0" />
                <span><strong>DND Active</strong> — Only Crucial alerts arrive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowSilencedInDnd((p) => !p)}
                  className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 hover:underline cursor-pointer"
                >
                  {showSilencedInDnd ? 'Hide Silenced' : 'Show Silenced'}
                </button>
                <span className="text-[10px] font-bold bg-purple-200/80 dark:bg-purple-900/60 px-1.5 py-0.2 rounded text-purple-800 dark:text-purple-300">
                  CRUCIAL ONLY
                </span>
              </div>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto text-xs pb-0.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('myRole')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeTab === 'myRole'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                My Role ({myRoleCount})
              </button>
              <button
                onClick={() => setActiveTab('critical')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  activeTab === 'critical'
                    ? 'bg-red-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Critical ({criticalCount})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeTab === 'unread'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-[11px] font-semibold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 flex-shrink-0 ml-1.5"
                title="Mark all alerts as read"
              >
                <CheckCheck size={13} />
                <span>Mark read</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List: Opaque Items */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 bg-white dark:bg-slate-900">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <LoadingSpinner size="md" />
              <span className="text-xs">Fetching live maritime alerts…</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No alerts match your filter</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                All operational updates are acknowledged. Dispatch a new notification or switch tabs.
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs font-medium text-blue-600 dark:text-sky-400 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isCritical = item.severity === 'CRITICAL';
              const isWarning = item.severity === 'WARNING';
              const isSuccess = item.severity === 'SUCCESS';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-all relative ${
                    item.isRead
                      ? 'bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      : 'bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white shadow-xs'
                  }`}
                >
                  {/* Top row: Severity, Category, Role, Relative Time */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Severity Pill */}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          isCritical
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : isWarning
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : isSuccess
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {isCritical ? (
                          <AlertTriangle size={10} />
                        ) : isWarning ? (
                          <AlertCircle size={10} />
                        ) : isSuccess ? (
                          <CheckCircle2 size={10} />
                        ) : (
                          <Info size={10} />
                        )}
                        <span>{item.severity}</span>
                      </span>

                      {/* Role Pill */}
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {(item.role || 'ALL').replace(/_/g, ' ')}
                      </span>

                      {/* Category Icon */}
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400" title={item.category || 'Operations'}>
                        {CATEGORY_ICONS[item.category] ?? <Layers size={11} />}
                        <span className="capitalize">{(item.category || 'OPERATIONS').toLowerCase().replace(/_/g, ' ')}</span>
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      {item.createdAt ? formatRelativeTime(item.createdAt) : 'Recently'}
                    </span>
                  </div>

                  {/* Title & Unread indicator */}
                  <div className="flex items-start gap-2">
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-sky-400 mt-1 flex-shrink-0 animate-pulse" />
                    )}
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug flex-1">
                      {item.title}
                    </h3>
                  </div>

                  {/* Message body */}
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed pl-4">
                    {item.message}
                  </p>

                  {/* Bottom Action Row */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs pl-4">
                    {item.link ? (
                      <button
                        onClick={() => handleActionClick(item)}
                        className="text-[11px] font-bold text-blue-600 dark:text-sky-400 hover:text-blue-800 dark:hover:text-sky-300 flex items-center gap-1 transition-colors"
                      >
                        <span>Open in Page ({item.link})</span>
                        <ArrowRight size={12} />
                      </button>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      {!item.isRead && (
                        <button
                          onClick={() => markReadMutation.mutate(item.id)}
                          title="Mark as read"
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(item.id)}
                        title="Dismiss notification"
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Link to Dedicated Notifications Page */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs flex-shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {unreadCount} unread of {notifications.length} alerts
          </span>
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="text-[11px] font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1"
          >
            <span>Open Dedicated Center</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Create Notification Modal Overlay: 100% Solid Opaque */}
        {showCreateModal && (
          <div className="absolute inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col p-5 overflow-y-auto animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400">
                  <Send size={15} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dispatch Operational Notification</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5 flex-1 text-xs">
              {formError && (
                <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Alert Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Paradip Berth 3 Congestion Spike or Coking Coal Buffer Low"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-200 mb-1">
                  Detailed Message / Context <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Provide complete operational guidance, affected vessels, laycan dates, or monetary impacts…"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Target Role & Severity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-200 mb-1">
                    Target User Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="ALL">All Roles (Broadcast)</option>
                    <option value="CHARTERING_OFFICER">Chartering Officer</option>
                    <option value="CHARTERING_MANAGER">Chartering Manager</option>
                    <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
                    <option value="PROCUREMENT_MANAGER">Procurement Manager</option>
                    <option value="PORT_MANAGER">Port Manager</option>
                    <option value="ANALYST">Quantitative Analyst</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-200 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="WARNING">WARNING (Operational Attention)</option>
                    <option value="CRITICAL">CRITICAL (Action Required)</option>
                    <option value="INFO">INFO (Informational Update)</option>
                    <option value="SUCCESS">SUCCESS (Clearance / Completion)</option>
                  </select>
                </div>
              </div>

              {/* Category & Target Page Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-200 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="OPERATIONS">Fleet Operations</option>
                    <option value="STOCK_BUFFER">Stock Buffer (Plants)</option>
                    <option value="FREIGHT">Freight Market</option>
                    <option value="PORT_CONGESTION">Port Congestion</option>
                    <option value="CONTRACTS">Contracts & Clearance</option>
                    <option value="WEATHER">Weather & IMD</option>
                    <option value="AUDIT">CVC Audit & Governance</option>
                    <option value="SYSTEM">System & Models</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-900 dark:text-slate-200 mb-1">
                    Target Page Link
                  </label>
                  <select
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="/decision">Decision Center (/decision)</option>
                    <option value="/procurement">Procurement Dashboard (/procurement)</option>
                    <option value="/chartering">Chartering & Vessels (/chartering)</option>
                    <option value="/ports">Port Intelligence (/ports)</option>
                    <option value="/contracts">Contracts Module (/contracts)</option>
                    <option value="/forecasting">Freight Forecasting (/forecasting)</option>
                    <option value="/control-tower">Control Tower (/control-tower)</option>
                    <option value="/scenarios">Scenario Center (/scenarios)</option>
                    <option value="/audit">Audit & Logs (/audit)</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {createMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>Dispatch Alert</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};
