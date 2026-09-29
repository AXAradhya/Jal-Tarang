import React from 'react';
import { cn } from '../../lib/utils';
import { useLiveStatus } from '../../hooks/useLiveStatus';

// ─── StatusBadge ────────────────────────────────────────────────────────────
type BadgeVariant =
  | 'FEASIBLE' | 'CONDITIONALLY_FEASIBLE' | 'INFEASIBLE'
  | 'ACTIVE' | 'APPROVED' | 'DRAFT' | 'SUBMITTED' | 'COMPLETED' | 'TERMINATED'
  | 'AVAILABLE' | 'EN_ROUTE' | 'DISCHARGING' | 'WAITING' | 'BALLASTING'
  | 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  | 'LOW' | 'MEDIUM'
  | 'ENTER_NOW' | 'ENTER_PARTIALLY' | 'WAIT' | 'MONITOR'
  | 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  | 'PRODUCTION' | 'STAGING' | 'CANDIDATE' | 'RETIRED'
  | string;

// ─── Light/Dark dual-mode badge palette ────────────────────────────────────────
// Rule: light mode uses bg-*-100 text-*-800 border-*-300 (WCAG AA ≥ 4.5:1)
//       dark  mode uses dark:bg-*-900/50 dark:text-*-300 dark:border-*-700/60
const BADGE_STYLES: Record<string, string> = {
  // ─── Feasibility ─────────────────────────────────────────────────────────────
  FEASIBLE: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  CONDITIONALLY_FEASIBLE: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  INFEASIBLE: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',

  // ─── Contract & Procurement Lifecycle ────────────────────────────────────────
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  COMPLETED: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700/60',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-600/60',
  SUBMITTED: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  TERMINATED: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/60',
  PENDING: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700/60',
  PENDING_APPROVAL: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700/60',
  AWARDED: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-700/60',
  IN_EXECUTION: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700/60',
  'IN EXECUTION': 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700/60',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  EXPIRED: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-600/60',

  // ─── Charter Contract Types ───────────────────────────────────────────────────
  CONTRACT_OF_AFFREIGHTMENT: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/60',
  VOYAGE_CHARTER: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  TIME_CHARTER: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700/60',
  COA: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/60',

  // ─── Vessel Operational Status ────────────────────────────────────────────────
  AVAILABLE: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  EN_ROUTE: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700/60',
  DISCHARGING: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700/60',
  LOADING: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700/60',
  WAITING: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  BALLASTING: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-600/60',
  IN_PORT: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-700/60',
  AT_ANCHOR: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700/60',
  NOMINATED: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700/60',

  // ─── Port Congestion ─────────────────────────────────────────────────────────
  NORMAL: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  MODERATE: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  CONGESTED: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',
  HEALTHY: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  OPERATIONAL: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  RESTRICTED: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',
  CLOSED: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',

  // ─── Priority ────────────────────────────────────────────────────────────────
  CRITICAL: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700/60',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',

  // ─── Risk ────────────────────────────────────────────────────────────────────
  ENTER_NOW: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  ENTER_PARTIALLY: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  WAIT: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',
  MONITOR: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700/60',

  // ─── Market Sentiment ────────────────────────────────────────────────────────
  BULLISH: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  BEARISH: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',
  NEUTRAL: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-600/60',
  UPWARD: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  DOWNWARD: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700/60',
  STABLE: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-600/60',

  // ─── ML Model Deployment ─────────────────────────────────────────────────────
  PRODUCTION: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700/60',
  STAGING: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700/60',
  CANDIDATE: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700/60',
  RETIRED: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-600/60',

  // ─── Vessel Classes (High-Contrast Vivid Maritime Colors) ────────────────────
  CAPESIZE: 'bg-blue-100 text-blue-900 border-blue-400 dark:bg-blue-900/60 dark:text-sky-200 dark:border-blue-500 font-bold',
  NEWCASTLEMAX: 'bg-indigo-100 text-indigo-900 border-indigo-400 dark:bg-indigo-900/60 dark:text-indigo-200 dark:border-indigo-500 font-bold',
  PANAMAX: 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-500 font-bold',
  KAMSARMAX: 'bg-teal-100 text-teal-900 border-teal-400 dark:bg-teal-900/60 dark:text-teal-200 dark:border-teal-500 font-bold',
  SUPRAMAX: 'bg-purple-100 text-purple-900 border-purple-400 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-500 font-bold',
  ULTRAMAX: 'bg-violet-100 text-violet-900 border-violet-400 dark:bg-violet-900/60 dark:text-violet-200 dark:border-violet-500 font-bold',
  HANDYSIZE: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-500 font-bold',
  HANDYMAX: 'bg-orange-100 text-orange-900 border-orange-400 dark:bg-orange-900/60 dark:text-orange-200 dark:border-orange-500 font-bold',
  VLOC: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-500 font-bold',

  // ─── Real-Time Stream Status Badges (Verified Checks) ────────────────────────
  LIVE: 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600 font-bold',
  STANDBY: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600 font-bold',
  CACHED: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600 font-bold',
  DEGRADED: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600 font-bold',
  OFFLINE: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-600 font-bold',
  DISCONNECTED: 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-600 font-bold',
  SYNCING: 'bg-blue-100 text-blue-900 border-blue-400 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-600 font-bold',
};

interface StatusBadgeProps {
  value: BadgeVariant;
  label?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ value, label, size = 'sm' }) => {
  const normKey = String(value ?? '').toUpperCase().trim();
  const style =
    BADGE_STYLES[normKey] ??
    BADGE_STYLES[value] ??
    'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 font-semibold';
  const sizeClass = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];
  const display = label ?? String(value ?? '').replace(/_/g, ' ');
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center text-center leading-none rounded border font-medium tracking-wide uppercase shadow-2xs',
        style,
        sizeClass
      )}
    >
      {display}
    </span>
  );
};

// ─── KpiCard ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  subvalue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
  loading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subvalue,
  trend,
  trendLabel,
  icon,
  variant = 'default',
  loading,
}) => {
  const trendColor = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  }[trend ?? 'neutral'];

  const trendArrow = { up: '↑', down: '↓', neutral: '→' }[trend ?? 'neutral'];

  return (
    <div className="bg-[#101E33] border border-[#1C3558] rounded p-4 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-widest truncate">
          {label}
        </span>
        {icon && <span className="text-[#64748B] flex-shrink-0">{icon}</span>}
      </div>
      {loading ? (
        <div className="h-7 w-24 bg-[#1C3558] animate-pulse rounded" />
      ) : (
        <div className="text-[22px] font-semibold tabular-nums text-[#F8FAFC] leading-none">
          {value}
        </div>
      )}
      {(subvalue || trendLabel) && (
        <div className="flex items-center gap-2 text-[11px]">
          {trend && trendLabel && (
            <span className={cn('font-medium', trendColor)}>
              {trendArrow} {trendLabel}
            </span>
          )}
          {subvalue && <span className="text-[#64748B]">{subvalue}</span>}
        </div>
      )}
    </div>
  );
};

// ─── SectionHeader ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actions,
  className,
}) => (
  <div className={cn('flex items-start justify-between gap-4', className)}>
    <div>
      <h2 className="text-[15px] font-semibold text-[#F8FAFC]">{title}</h2>
      {subtitle && <p className="text-[12px] text-[#64748B] mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

// ─── DataFreshnessBar ─────────────────────────────────────────────────────────
interface DataFreshnessBarProps {
  source?: string;
  timestamp?: string;
  quality?: number;
  compact?: boolean;
  status?: 'LIVE' | 'STANDBY' | 'CACHED' | 'STORED_DATASET' | 'OFFLINE' | 'SYNCING';
  isLive?: boolean;
  isError?: boolean;
  isStale?: boolean;
}

export const DataFreshnessBar: React.FC<DataFreshnessBarProps> = ({
  source = 'Baltic Exchange',
  timestamp,
  quality = 98.4,
  compact = false,
  status,
  isLive,
  isError,
  isStale,
}) => {
  const { isSystemLive, isBrowserOnline, latencyMs } = useLiveStatus();
  const dateObj = timestamp ? new Date(timestamp) : new Date();
  const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  const fullTs = dateObj.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });

  // Truth-telling status calculation
  let computedStatus: 'LIVE' | 'STANDBY' | 'CACHED' | 'STORED_DATASET' | 'OFFLINE' | 'SYNCING' = status || 'LIVE';
  if (!status) {
    if (!isBrowserOnline || isError) {
      computedStatus = 'OFFLINE';
    } else if (isLive === true) {
      computedStatus = 'LIVE';
    } else if (isStale) {
      computedStatus = 'CACHED';
    } else if (isLive === false) {
      computedStatus = 'STANDBY';
    } else if (isSystemLive) {
      computedStatus = 'LIVE';
    } else {
      computedStatus = 'CACHED';
    }
  }

  const statusConfig = {
    LIVE: {
      label: 'LIVE',
      dotClass: 'bg-emerald-500 animate-pulse',
      textClass: 'text-emerald-600 dark:text-emerald-400',
    },
    STANDBY: {
      label: 'STANDBY',
      dotClass: 'bg-amber-500',
      textClass: 'text-amber-600 dark:text-amber-400',
    },
    CACHED: {
      label: 'CACHED',
      dotClass: 'bg-amber-400',
      textClass: 'text-amber-600 dark:text-amber-400',
    },
    STORED_DATASET: {
      label: 'STORED DATASET',
      dotClass: 'bg-indigo-500',
      textClass: 'text-indigo-600 dark:text-indigo-400',
    },
    OFFLINE: {
      label: 'OFFLINE',
      dotClass: 'bg-rose-500',
      textClass: 'text-rose-600 dark:text-rose-400',
    },
    SYNCING: {
      label: 'SYNCING',
      dotClass: 'bg-blue-500 animate-pulse',
      textClass: 'text-blue-600 dark:text-blue-400',
    },
  }[computedStatus];

  if (compact) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-[10.5px] select-none shadow-2xs hover:bg-slate-200/60 dark:hover:bg-slate-700/80 transition-colors cursor-default flex-shrink-0"
        title={`Data Stream Status: ${statusConfig.label}\nUpdated: ${fullTs} IST\nData Provider: ${source}\nSignal Integrity: ${quality.toFixed(1)}%`}
      >
        <span className={cn('flex items-center gap-1 font-bold', statusConfig.textClass)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dotClass)} />
          {statusConfig.label}
        </span>
        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
        <span className="hidden sm:inline text-slate-700 dark:text-slate-300 font-mono text-[9.5px] font-semibold">{timeStr} IST</span>
        <span className="hidden 2xl:inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[9.5px]">
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>{source}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{quality.toFixed(1)}%</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex-wrap">
      <span className={cn('flex items-center gap-1.5 font-bold', statusConfig.textClass)}>
        <span className={cn('w-2 h-2 rounded-full', statusConfig.dotClass)} />
        {statusConfig.label}
      </span>
      <span className="text-slate-300 dark:text-slate-700">|</span>
      <span>Updated: {fullTs} IST</span>
      <span className="text-slate-300 dark:text-slate-700">•</span>
      <span>Source: {source}</span>
      <span className="text-slate-300 dark:text-slate-700">•</span>
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Quality: {quality.toFixed(1)}%</span>
    </div>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="text-[#1C3558] mb-4">{icon}</div>}
    <p className="text-[14px] font-medium text-[#94A3B8]">{title}</p>
    {description && <p className="text-[12px] text-[#64748B] mt-1 max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sz = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size];
  return (
    <svg
      className={cn('animate-spin text-[#0284C7]', sz, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
};

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'sm',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const variantClass = {
    primary: 'bg-[#0284C7] hover:bg-[#0369A1] text-white border-transparent',
    secondary: 'bg-[#101E33] hover:bg-[#162945] text-[#94A3B8] hover:text-[#F8FAFC] border-[#1C3558]',
    ghost: 'bg-transparent hover:bg-[#101E33] text-[#94A3B8] hover:text-[#F8FAFC] border-transparent',
    danger: 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800/50',
  }[variant];

  const sizeClass = {
    xs: 'text-[11px] px-2 py-1 gap-1',
    sm: 'text-[12px] px-3 py-1.5 gap-1.5',
    md: 'text-[13px] px-4 py-2 gap-2',
  }[size];

  return (
    <button
      className={cn(
        'inline-flex items-center font-medium rounded border transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClass,
        sizeClass,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner size="sm" /> : icon}
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, id, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
        {label}
      </label>
    )}
    <input
      id={id}
      className={cn(
        'bg-[#0B1524] border border-[#1C3558] text-[#F8FAFC] text-[13px] rounded px-3 py-1.5',
        'placeholder:text-[#64748B] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/30',
        'transition-colors',
        error && 'border-red-600',
        className
      )}
      {...props}
    />
    {error && <p className="text-[11px] text-red-400">{error}</p>}
  </div>
);

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className, id, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
        {label}
      </label>
    )}
    <select
      id={id}
      className={cn(
        'bg-[#0B1524] border border-[#1C3558] text-[#F8FAFC] text-[13px] rounded px-3 py-1.5',
        'focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/30',
        'transition-colors cursor-pointer',
        error && 'border-red-600',
        className
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {error && <p className="text-[11px] text-red-400">{error}</p>}
  </div>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────────
interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex border-b border-[#1C3558]">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={cn(
          'px-4 py-2.5 text-[12px] font-medium transition-colors border-b-2 -mb-px',
          activeTab === tab.id
            ? 'border-[#0284C7] text-[#0284C7]'
            : 'border-transparent text-[#64748B] hover:text-[#94A3B8]'
        )}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span
            className={cn(
              'ml-1.5 text-[10px] px-1.5 py-0.5 rounded',
              activeTab === tab.id ? 'bg-[#0284C7]/20 text-[#0284C7]' : 'bg-[#1C3558] text-[#64748B]'
            )}
          >
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

export { ErrorBoundary } from './ErrorBoundary';

export { InlineSuggestionBadge } from './InlineSuggestionBadge';
export { SmartAlertBanner } from './SmartAlertBanner';
export { ArbitrageModal } from './ArbitrageModal';
export { MonteCarloCoaModal } from './MonteCarloCoaModal';
