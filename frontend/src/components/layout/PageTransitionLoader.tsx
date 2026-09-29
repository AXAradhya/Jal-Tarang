import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Compass, Shield, Activity, Anchor, Ship, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSettingsStore } from '../../store/settingsStore';

interface RouteMetadata {
  title: string;
  badge: string;
  icon: typeof Compass;
}

const ROUTE_CONFIG: Record<string, RouteMetadata> = {
  '/dashboard': {
    title: 'Command & Control Tower',
    badge: 'EXECUTIVE HQ',
    icon: Compass,
  },
  '/freight': {
    title: 'Freight Market & Baltic Intelligence',
    badge: 'BALTIC FEED',
    icon: Activity,
  },
  '/ports': {
    title: 'Port Operations & Berth Queues',
    badge: 'PORT TELEMETRY',
    icon: Anchor,
  },
  '/decision': {
    title: 'Chartering Decision Optimization Engine',
    badge: 'DECISION ENGINE',
    icon: Shield,
  },
  '/forecasting': {
    title: 'FFA Econometric Curves & ML Forecasts',
    badge: 'PREDICTIVE AI',
    icon: Activity,
  },
  '/procurement': {
    title: 'Coal Procurement & Strategic Reserves',
    badge: 'SUPPLY CHAIN',
    icon: Shield,
  },
  '/chartering': {
    title: 'Chartering Desk & Vessel Fixtures',
    badge: 'CHARTERING DESK',
    icon: Ship,
  },
  '/scenarios': {
    title: 'Monte Carlo Stress Simulation',
    badge: 'STRESS TEST',
    icon: Compass,
  },
  '/risk': {
    title: 'Maritime Risk & Weather Intelligence',
    badge: 'RISK RADAR',
    icon: Activity,
  },
  '/data': {
    title: 'Enterprise Cryptographic Data Explorer',
    badge: 'DATABASE SYNC',
    icon: Shield,
  },
  '/settings': {
    title: 'Enterprise Governance Parameters',
    badge: 'SYSTEM SETTINGS',
    icon: Compass,
  },
};

export const PageTransitionLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(0);

  const prevPathRef = useRef(location.pathname);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  // Find metadata for current route
  const matchingKey = Object.keys(ROUTE_CONFIG).find((k) => location.pathname.startsWith(k));
  const currentMeta = (matchingKey && ROUTE_CONFIG[matchingKey]) || {
    title: 'Maritime Operations Command',
    badge: 'JAL TARANG',
    icon: Compass,
  };

  const enableAnimations = useSettingsStore((s) => s.settings?.enableAnimations ?? true);
  const IconComponent = currentMeta.icon;

  useEffect(() => {
    // Only trigger on route changes
    if (location.pathname === prevPathRef.current) return;
    prevPathRef.current = location.pathname;

    // Clear any previous active timers
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];

    const startTime = performance.now();

    setIsLoading(true);
    setIsExiting(false);
    setProgress(28);

    // Fast progressive runner increments (fast but smooth telemetry)
    const t1 = setTimeout(() => setProgress(62), 50);
    const t2 = setTimeout(() => setProgress(86), 130);
    timerRef.current.push(t1, t2);

    // Measure when the DOM and background page has mounted and stabilized
    const measurePageReady = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const readyTime = performance.now();
          const renderDurationMs = Math.max(30, readyTime - startTime);

          // Fast but smooth target display time:
          // Instantaneous cache / fast render: ~280ms total (feels swift, no sluggish lag)
          // Slower dynamic pages: up to ~800ms
          let targetDisplayMs: number;
          if (renderDurationMs <= 250) {
            targetDisplayMs = 280;
          } else {
            targetDisplayMs = Math.min(950, renderDurationMs + 180);
          }

          const elapsedMs = performance.now() - startTime;
          const remainingMs = Math.max(50, targetDisplayMs - elapsedMs);

          // Swiftly accelerate to 100%
          const tComplete = setTimeout(() => {
            setProgress(100);
          }, Math.max(0, remainingMs - 70));

          // Graceful fade out
          const tExit = setTimeout(() => {
            setIsExiting(true);
          }, remainingMs);

          // Cleanup
          const tDone = setTimeout(() => {
            setIsLoading(false);
            setIsExiting(false);
            setProgress(0);
          }, remainingMs + 180);

          timerRef.current.push(tComplete, tExit, tDone);
        });
      });
    };

    const tStart = setTimeout(measurePageReady, 40);
    timerRef.current.push(tStart);

    return () => {
      timerRef.current.forEach(clearTimeout);
    };
  }, [location.pathname]);

  // Loading line JSX: Luminous beam with glowing leading tip
  const loadingLineElement = isLoading ? (
    <div
      className={cn(
        'w-full h-[2.5px] bg-transparent overflow-visible pointer-events-none transition-opacity duration-200',
        isExiting ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 relative transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '120ms' : '180ms',
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.75), 0 0 3px rgba(37, 99, 235, 0.5)',
        }}
      >
        {/* Luminous beacon at the leading tip */}
        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#38bdf8] animate-pulse" />
      </div>
    </div>
  ) : null;

  // Check if header loading line anchor exists in DOM
  const topBarAnchor = typeof document !== 'undefined' ? document.getElementById('top-bar-loading-line-anchor') : null;

  return (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col">
      {/* ─── Stick Loading Line to Bottom of Top Bar Header via Portal ─── */}
      {topBarAnchor && loadingLineElement ? (
        createPortal(loadingLineElement, topBarAnchor)
      ) : (
        /* Fallback if anchor is not yet mounted */
        <div className="sticky top-0 left-0 right-0 z-50 overflow-visible pointer-events-none">
          {loadingLineElement}
        </div>
      )}

      {/* ─── Page Content with Smooth Reloading Animation While Loading ─── */}
      <div
        key={location.pathname}
        className={cn(
          'w-full h-full min-h-0 flex-1 flex flex-col relative transition-all duration-300',
          isLoading && 'animate-page-reloading opacity-85',
          enableAnimations && !isLoading && 'animate-ios-page-enter'
        )}
      >
        {/* ─── Glassmorphic Page Reload Status Indicator (Center Toast) ─── */}
        {isLoading && (
          <div
            className={cn(
              'absolute inset-0 z-30 pointer-events-none flex items-start justify-center pt-14 sm:pt-20 transition-opacity duration-200 select-none',
              isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            )}
          >
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xl text-[12px] font-semibold animate-in fade-in zoom-in-95 duration-150">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
              <RefreshCw size={13} className="text-sky-500 animate-spin" />
              <span className="font-bold tracking-tight">Syncing {currentMeta.title}...</span>
              <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">?</span>
              <span className="text-sky-600 dark:text-sky-400 font-mono text-[11px] font-bold">{progress}%</span>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
