import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUiStore, CurrencyMode } from '../store/uiStore';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const USD_TO_INR_RATE = 95.00;

/**
 * Format any USD base monetary value according to user's active currency mode (INR / USD).
 * When currency is INR: multiplies USD amount by 95.00 and formats with ₹ (Cr / Lakh for compact).
 * When currency is USD: formats with $ (M / K for compact).
 */
export function formatCurrency(
  value: number | string | null | undefined,
  opts?: { compact?: boolean; currencyOverride?: CurrencyMode; decimals?: number }
): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return '—';

  const activeCurrency: CurrencyMode =
    opts?.currencyOverride ||
    (typeof window !== 'undefined' ? (useUiStore.getState().currency || 'INR') : 'INR');

  const currentRate = typeof window !== 'undefined' ? (useUiStore.getState().exchangeRate || USD_TO_INR_RATE) : USD_TO_INR_RATE;

  if (activeCurrency === 'INR') {
    const inrVal = num * currentRate;
    const abs = Math.abs(inrVal);
    if (opts?.compact) {
      if (abs >= 10_000_000) {
        return `₹${(inrVal / 10_000_000).toFixed(opts.decimals ?? 2)} Cr`;
      }
      if (abs >= 100_000) {
        return `₹${(inrVal / 100_000).toFixed(opts.decimals ?? 2)} Lakh`;
      }
      if (abs >= 1_000) {
        return `₹${(inrVal / 1_000).toFixed(opts.decimals ?? 1)}k`;
      }
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: opts?.decimals ?? 0,
      minimumFractionDigits: opts?.decimals ?? 0,
    }).format(inrVal);
  }

  // USD formatting
  const absUsd = Math.abs(num);
  if (opts?.compact) {
    if (absUsd >= 1_000_000) return `$${(num / 1_000_000).toFixed(opts.decimals ?? 2)}M`;
    if (absUsd >= 1_000) return `$${(num / 1_000).toFixed(opts.decimals ?? 1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: opts?.decimals ?? 0,
    minimumFractionDigits: opts?.decimals ?? 0,
  }).format(num);
}

/**
 * Legacy compatibility wrapper: delegates to global dynamic formatCurrency
 */
export function formatUsd(
  value: number | string | null | undefined,
  opts?: { compact?: boolean; decimals?: number }
): string {
  return formatCurrency(value, opts);
}

/**
 * Formats freight rate per MT respecting global currency toggle (e.g. ₹989.50/MT or $11.85/MT)
 */
export function formatRateMt(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return '—';

  const activeCurrency: CurrencyMode =
    typeof window !== 'undefined' ? (useUiStore.getState().currency || 'INR') : 'INR';
  const currentRate =
    typeof window !== 'undefined' ? (useUiStore.getState().exchangeRate || USD_TO_INR_RATE) : USD_TO_INR_RATE;

  if (activeCurrency === 'INR') {
    const inr = num * currentRate;
    return `₹${inr.toFixed(2)}/MT`;
  }
  return `$${num.toFixed(2)}/MT`;
}

/**
 * Formats daily TCE / demurrage rate respecting global currency toggle (e.g. ₹18.4L/day or $22,000/day)
 */
export function formatDailyRate(
  value: number | string | null | undefined,
  opts?: { compact?: boolean }
): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return '—';

  const activeCurrency: CurrencyMode =
    typeof window !== 'undefined' ? (useUiStore.getState().currency || 'INR') : 'INR';
  const currentRate =
    typeof window !== 'undefined' ? (useUiStore.getState().exchangeRate || USD_TO_INR_RATE) : USD_TO_INR_RATE;

  if (activeCurrency === 'INR') {
    const inr = num * currentRate;
    if (opts?.compact) {
      if (inr >= 10_000_000) return `₹${(inr / 10_000_000).toFixed(2)} Cr/day`;
      if (inr >= 100_000) return `₹${(inr / 100_000).toFixed(1)}L/day`;
    }
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(inr)}/day`;
  }

  if (opts?.compact && num >= 1_000) {
    return `$${(num / 1_000).toFixed(0)}k/day`;
  }
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num)}/day`;
}

export function formatUsdMt(value: number | string | null | undefined): string {
  return formatRateMt(value);
}

export function formatMt(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M MT`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K MT`;
  return `${value.toFixed(0)} MT`;
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}

const TIMEZONE_IANA_MAP: Record<string, string> = {
  IST: 'Asia/Kolkata',
  UTC: 'UTC',
  SGT: 'Asia/Singapore',
};

export function getActiveTimezone(): { code: 'IST' | 'UTC' | 'SGT'; timeZone: string } {
  if (typeof window === 'undefined') return { code: 'IST', timeZone: 'Asia/Kolkata' };
  try {
    const raw = localStorage.getItem('sail_marinex_settings_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.timezone && TIMEZONE_IANA_MAP[parsed.timezone]) {
        return { code: parsed.timezone, timeZone: TIMEZONE_IANA_MAP[parsed.timezone] };
      }
    }
  } catch {}
  return { code: 'IST', timeZone: 'Asia/Kolkata' };
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const tz = getActiveTimezone();
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: tz.timeZone,
    });
  } catch {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}

export function formatDatetime(iso: string | null | undefined, showTz = true): string {
  if (!iso) return '—';
  const tz = getActiveTimezone();
  try {
    const dtStr = new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz.timeZone,
    });
    return showTz ? `${dtStr} ${tz.code}` : dtStr;
  } catch {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
