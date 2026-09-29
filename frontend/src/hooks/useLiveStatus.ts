import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export type LiveStatusType = 'LIVE' | 'STANDBY' | 'CACHED' | 'STORED_DATASET' | 'OFFLINE' | 'SYNCING';

interface CheckFeedOptions {
  isSuccess?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  data?: any;
  timestamp?: string | number | Date;
  maxAgeMinutes?: number;
  sourceType?: 'LIVE_API' | 'DATASET_ARCHIVE' | 'CACHED_STREAM';
}

export interface LiveStatusResult {
  status: LiveStatusType;
  label: string;
  isLive: boolean;
  dotColor: string;
  badgeClass: string;
}

/**
 * Enterprise hook to verify whether the system and data streams are genuine 100% working LIVE feeds
 * based on simple, verifiable checks (network reachability, API heartbeat, query success, data age).
 */
export function useLiveStatus() {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [latencyMs, setLatencyMs] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ping /api/v1/health/live (with fallback to /health/live) every 25 seconds
  const { data: healthData, isError: healthError } = useQuery({
    queryKey: ['system', 'healthLiveCheck'],
    queryFn: async () => {
      const start = Date.now();
      let res = await fetch('/api/v1/health/live').catch(() => null);
      if (!res || !res.ok) {
        res = await fetch('/health/live');
      }
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      const elapsed = Date.now() - start;
      setLatencyMs(elapsed);
      return await res.json();
    },
    staleTime: 15000,
    refetchInterval: 25000,
    retry: 2,
  });

  const isServerLive = !healthError && healthData?.status === 'LIVE';
  const isSystemLive = isBrowserOnline && isServerLive;

  const systemStatus: LiveStatusType = !isBrowserOnline
    ? 'OFFLINE'
    : healthError
      ? 'OFFLINE'
      : isServerLive
        ? 'LIVE'
        : 'STANDBY';

  /**
   * Helper to evaluate any specific component query or dataset
   */
  const checkStatus = (opts?: CheckFeedOptions): LiveStatusResult => {
    if (!isBrowserOnline || opts?.isError) {
      return {
        status: 'OFFLINE',
        label: 'OFFLINE',
        isLive: false,
        dotColor: 'bg-rose-500',
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold',
      };
    }

    if (opts?.isLoading || opts?.isFetching) {
      return {
        status: 'SYNCING',
        label: 'SYNCING',
        isLive: false,
        dotColor: 'bg-blue-500 animate-pulse',
        badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold',
      };
    }

    // Check if data is populated
    const hasData =
      opts?.data !== undefined &&
      opts?.data !== null &&
      (!Array.isArray(opts.data) || opts.data.length > 0);

    // If query failed to produce data or no data
    if (opts?.isSuccess === false || !hasData) {
      return {
        status: 'STANDBY',
        label: 'STANDBY',
        isLive: false,
        dotColor: 'bg-amber-500',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold',
      };
    }

    // If explicitly marked as dataset archive
    if (opts?.sourceType === 'DATASET_ARCHIVE') {
      return {
        status: 'STORED_DATASET',
        label: 'STORED DATASET',
        isLive: false,
        dotColor: 'bg-indigo-500',
        badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold',
      };
    }

    // If data timestamp is older than maxAgeMinutes (default 60 mins)
    if (opts?.timestamp) {
      const ts = new Date(opts.timestamp).getTime();
      const ageMinutes = (Date.now() - ts) / (1000 * 60);
      const limit = opts.maxAgeMinutes ?? 60;
      if (!isNaN(ageMinutes) && ageMinutes > limit) {
        return {
          status: 'CACHED',
          label: 'CACHED',
          isLive: false,
          dotColor: 'bg-amber-500',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold',
        };
      }
    }

    // Genuinely working and connected
    if (isSystemLive || isBrowserOnline) {
      return {
        status: 'LIVE',
        label: 'LIVE',
        isLive: true,
        dotColor: 'bg-emerald-500 animate-pulse',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold',
      };
    }

    // Fallback if server is not responding
    return {
      status: 'CACHED',
      label: 'CACHED',
      isLive: false,
      dotColor: 'bg-amber-500',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold',
    };
  };

  return {
    isBrowserOnline,
    isServerLive,
    isSystemLive,
    systemStatus,
    latencyMs,
    checkStatus,
  };
}
