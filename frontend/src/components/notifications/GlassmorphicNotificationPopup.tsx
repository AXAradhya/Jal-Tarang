import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCw,
  Bell,
  Shield,
  Ship,
  CloudRain,
  MapPin,
  TrendingUp,
  Fuel,
  Package,
  Anchor,
  Activity,
  Compass,
  Radio,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  Sliders,
  DollarSign,
  Cpu,
  RefreshCw,
  Radar,
  Moon
} from 'lucide-react';
import { notificationApi } from '../../api';
import { useSettingsStore } from '../../store/settingsStore';
import { cn } from '../../lib/utils';
import { showToast } from '../../store/toastStore';

export interface GlassmorphicNotification {
  id: string;
  title: string;
  message: string;
  role: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'SUCCESS';
  category: string;
  link?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
}

interface GlassmorphicNotificationPopupProps {
  activeRole?: string;
}

// ─── 50 Categories Icon & Style Mapping ──────────────────────────────────────
const CATEGORY_MAP: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  VESSEL_TELEMETRY: { icon: <Ship size={14} />, label: 'Vessel Telemetry', color: 'text-sky-500 bg-sky-500/10' },
  CYCLONE_ALERT: { icon: <CloudRain size={14} />, label: 'Cyclone Alert', color: 'text-rose-500 bg-rose-500/10' },
  PORT_CONGESTION: { icon: <MapPin size={14} />, label: 'Port Congestion', color: 'text-amber-500 bg-amber-500/10' },
  FX_VOLATILITY: { icon: <DollarSign size={14} />, label: 'FX Volatility', color: 'text-emerald-500 bg-emerald-500/10' },
  BUNKER_PRICES: { icon: <Fuel size={14} />, label: 'Bunker Prices', color: 'text-purple-500 bg-purple-500/10' },
  STOCK_BUFFER: { icon: <Package size={14} />, label: 'Stock Buffer', color: 'text-orange-500 bg-orange-500/10' },
  CHARTERING_FIXTURE: { icon: <Anchor size={14} />, label: 'Charter Fixture', color: 'text-indigo-500 bg-indigo-500/10' },
  CANAL_TRANSIT: { icon: <Compass size={14} />, label: 'Canal Transit', color: 'text-blue-500 bg-blue-500/10' },
  RIGHTSHIP_VETTING: { icon: <Shield size={14} />, label: 'RightShip Vetting', color: 'text-emerald-500 bg-emerald-500/10' },
  DEMURRAGE_RISK: { icon: <AlertTriangle size={14} />, label: 'Demurrage Risk', color: 'text-rose-500 bg-rose-500/10' },
  TENDER_AWARD: { icon: <FileText size={14} />, label: 'Tender Award', color: 'text-teal-500 bg-teal-500/10' },
  BALTIC_DRY_INDEX: { icon: <TrendingUp size={14} />, label: 'Baltic Index', color: 'text-blue-500 bg-blue-500/10' },
  RAIL_EVACUATION: { icon: <Activity size={14} />, label: 'Rail Evacuation', color: 'text-green-500 bg-green-500/10' },
  GEOPOLITICAL_RISK: { icon: <Radio size={14} />, label: 'Geopolitical Risk', color: 'text-rose-500 bg-rose-500/10' },
  DRAUGHT_RESTRICTION: { icon: <Sliders size={14} />, label: 'Draught Limit', color: 'text-amber-500 bg-amber-500/10' },
  COMMODITY_BENCHMARK: { icon: <Layers size={14} />, label: 'Commodity Index', color: 'text-indigo-500 bg-indigo-500/10' },
  AI_FORECAST_SIGNAL: { icon: <Cpu size={14} />, label: 'AI Prediction', color: 'text-cyan-500 bg-cyan-500/10' },
  CARBON_EMISSIONS: { icon: <Sparkles size={14} />, label: 'Carbon Emissions', color: 'text-emerald-500 bg-emerald-500/10' },
  CREW_WELFARE: { icon: <Shield size={14} />, label: 'Crew & MLC', color: 'text-sky-500 bg-sky-500/10' },
  P_AND_I_CLUB: { icon: <Shield size={14} />, label: 'P&I Insurance', color: 'text-blue-500 bg-blue-500/10' },
  BLAST_FURNACE_DEMAND: { icon: <Package size={14} />, label: 'Furnace Demand', color: 'text-red-500 bg-red-500/10' },
  COUNTERPARTY_KYC: { icon: <CheckCircle2 size={14} />, label: 'Counterparty KYC', color: 'text-emerald-500 bg-emerald-500/10' },
  PILOTAGE_SUSPENSION: { icon: <AlertTriangle size={14} />, label: 'Pilotage Notice', color: 'text-amber-500 bg-amber-500/10' },
  ARBITRAGE_WINDOW: { icon: <TrendingUp size={14} />, label: 'Arbitrage Window', color: 'text-teal-500 bg-teal-500/10' },
  LIGHTERING_OPERATION: { icon: <Ship size={14} />, label: 'Deep Lightering', color: 'text-sky-500 bg-sky-500/10' },
  CUSTOMS_CLEARANCE: { icon: <FileText size={14} />, label: 'Customs Clearance', color: 'text-indigo-500 bg-indigo-500/10' },
  MONSOON_ADVISORY: { icon: <CloudRain size={14} />, label: 'Monsoon Advisory', color: 'text-blue-500 bg-blue-500/10' },
  VOYAGE_OPTIMIZATION: { icon: <Compass size={14} />, label: 'Voyage Route', color: 'text-emerald-500 bg-emerald-500/10' },
  CONTRACT_MILESTONE: { icon: <Anchor size={14} />, label: 'COA Milestone', color: 'text-purple-500 bg-purple-500/10' },
  TIDAL_WINDOW: { icon: <Activity size={14} />, label: 'Tidal Window', color: 'text-cyan-500 bg-cyan-500/10' },
  SECURITY_THREAT: { icon: <AlertTriangle size={14} />, label: 'Maritime Security', color: 'text-rose-500 bg-rose-500/10' },
  EQUIPMENT_MAINTENANCE: { icon: <Sliders size={14} />, label: 'Terminal Overhaul', color: 'text-amber-500 bg-amber-500/10' },
  HEDGE_RECOMMENDATION: { icon: <TrendingUp size={14} />, label: 'FFA Paper Hedge', color: 'text-indigo-500 bg-indigo-500/10' },
  LABOR_UNION_NOTICE: { icon: <FileText size={14} />, label: 'Port Labor Accord', color: 'text-emerald-500 bg-emerald-500/10' },
  INSURANCE_WAR_RISK: { icon: <Shield size={14} />, label: 'War Risk Status', color: 'text-blue-500 bg-blue-500/10' },
  QUALITY_ASSURANCE: { icon: <CheckCircle2 size={14} />, label: 'Lab Coal Assay', color: 'text-teal-500 bg-teal-500/10' },
  BALLAST_WATER: { icon: <Activity size={14} />, label: 'Ballast Water D-2', color: 'text-emerald-500 bg-emerald-500/10' },
  BERTH_PRODUCTIVITY: { icon: <TrendingUp size={14} />, label: 'Berth Turnaround', color: 'text-green-500 bg-green-500/10' },
  STORAGE_YARD_CAPACITY: { icon: <Package size={14} />, label: 'Yard Stockpile', color: 'text-orange-500 bg-orange-500/10' },
  COAL_WASHING: { icon: <Layers size={14} />, label: 'Washery Yield', color: 'text-indigo-500 bg-indigo-500/10' },
  OCEAN_CURRENT: { icon: <Compass size={14} />, label: 'Ocean Current', color: 'text-sky-500 bg-sky-500/10' },
  DISPUTE_RESOLUTION: { icon: <CheckCircle2 size={14} />, label: 'Hire Settlement', color: 'text-emerald-500 bg-emerald-500/10' },
  ESCROW_RELEASE: { icon: <DollarSign size={14} />, label: 'Trade LC Release', color: 'text-teal-500 bg-teal-500/10' },
  SATELLITE_RADAR: { icon: <Radar size={14} />, label: 'Satellite Radar', color: 'text-purple-500 bg-purple-500/10' },
  EMERGENCY_DRILL: { icon: <Ship size={14} />, label: 'Towing Exercise', color: 'text-blue-500 bg-blue-500/10' },
  IMPORT_DUTY: { icon: <FileText size={14} />, label: 'Customs Duty BCD', color: 'text-emerald-500 bg-emerald-500/10' },
  CONTAINER_FEEDER: { icon: <Ship size={14} />, label: 'Coastal Feeder', color: 'text-sky-500 bg-sky-500/10' },
  WEATHER_ROUTING: { icon: <CloudRain size={14} />, label: 'Weather Routing', color: 'text-amber-500 bg-amber-500/10' },
  AUDIT_COMPLIANCE: { icon: <Shield size={14} />, label: 'CVC Audit Pass', color: 'text-emerald-500 bg-emerald-500/10' },
  CYBER_DEFENSE: { icon: <Cpu size={14} />, label: 'Cyber Defense', color: 'text-indigo-500 bg-indigo-500/10' },
};

// ─── Harmonic iOS-Style Notification Chime (Web Audio API Synthesizer) ────────
function playChime(severity: string) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Auto-resume audio context if suspended by browser autoplay policy
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic multi-tone notes for authentic iOS crystal chimes
    // Critical: High urgency two-tone alert (880Hz A5 -> 1174.66Hz D6)
    // Warning: Alert chime (659.25Hz E5 -> 880Hz A5)
    // Info/Success: Classic Apple-style bright chord (523.25Hz C5 -> 659.25Hz E5 -> 783.99Hz G5)
    const notes = severity === 'CRITICAL'
      ? [
          { freq: 880, start: 0, dur: 0.22, vol: 0.08 },
          { freq: 1174.66, start: 0.11, dur: 0.38, vol: 0.10 }
        ]
      : severity === 'WARNING'
      ? [
          { freq: 659.25, start: 0, dur: 0.20, vol: 0.06 },
          { freq: 880, start: 0.10, dur: 0.32, vol: 0.08 }
        ]
      : [
          { freq: 523.25, start: 0, dur: 0.18, vol: 0.05 },
          { freq: 659.25, start: 0.08, dur: 0.22, vol: 0.06 },
          { freq: 783.99, start: 0.16, dur: 0.40, vol: 0.07 }
        ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      // Subtle exponential glide for metallic glass/bell resonance
      osc.frequency.exponentialRampToValueAtTime(n.freq * 1.008, now + n.start + n.dur * 0.5);

      // Attack & Decay Envelope
      gain.gain.setValueAtTime(0.0001, now + n.start);
      gain.gain.linearRampToValueAtTime(n.vol, now + n.start + 0.018); // Soft attack
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur); // Smooth decay

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.05);
    });
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

export const GlassmorphicNotificationPopup: React.FC<GlassmorphicNotificationPopupProps> = ({
  activeRole = 'ALL',
}) => {
  const navigate = useNavigate();

  const [currentNotif, setCurrentNotif] = useState<GlassmorphicNotification | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  // Default unmuted so notification sound plays as requested
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isStreamActive, setIsStreamActive] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(100);

  const timerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);
  const nextScheduleRef = useRef<any>(null);
  const dismissTimeoutRef = useRef<any>(null);

  const settings = useSettingsStore((s) => s.settings);
  const enableNotifications = settings?.enablePopupNotifications ?? true;
  // Default to 8 seconds (7-8 seconds as requested)
  const popupDurationSec = settings?.popupDuration ?? 8;
  const soundEnabled = settings?.soundEffects ?? true;
  const POPUP_DURATION_MS = popupDurationSec * 1000;
  const NEXT_ALERT_INTERVAL_MS = 18000; // 18 seconds between alerts

  // ─── Smooth Dismiss with iOS Exit Animation ────────────────────────────────
  const handleDismiss = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    dismissTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);

      // Schedule next alert in NEXT_ALERT_INTERVAL_MS
      if (isStreamActive) {
        if (nextScheduleRef.current) clearTimeout(nextScheduleRef.current);
        nextScheduleRef.current = setTimeout(() => {
          triggerNextNotification();
        }, NEXT_ALERT_INTERVAL_MS);
      }
    }, 350); // Matches animate-ios-notif-exit duration
  }, [isExiting, isStreamActive, NEXT_ALERT_INTERVAL_MS]);

  // ─── Fetch & Display a Random Notification ──────────────────────────────────
  const triggerNextNotification = useCallback(async () => {
    if (!isStreamActive || !enableNotifications) return;

    try {
      const data = await notificationApi.getRandom(activeRole);
      if (data && data.title) {
        // DND Check: if DND is active, only CRITICAL (Crucial) notifications arrive!
        if (settings?.dndEnabled && data.severity !== 'CRITICAL') {
          return;
        }

        // Category Filter Checks based on Enterprise Settings
        if (settings) {
          const cat = (data.category || '').toUpperCase();
          if (!settings.notifyCycloneAlerts && (cat === 'CYCLONE_ALERT' || cat === 'MONSOON_ADVISORY' || cat === 'WEATHER_ROUTING')) {
            return;
          }
          if (!settings.notifyPortCongestion && (cat === 'PORT_CONGESTION' || cat === 'PILOTAGE_SUSPENSION' || cat === 'BERTH_PRODUCTIVITY' || cat === 'DRAUGHT_RESTRICTION')) {
            return;
          }
          if (!settings.notifyStockBufferBreach && (cat === 'STOCK_BUFFER' || cat === 'BLAST_FURNACE_DEMAND' || cat === 'STORAGE_YARD_CAPACITY' || cat === 'COAL_WASHING')) {
            return;
          }
          if (!settings.notifyFxFluctuations && (cat === 'FX_VOLATILITY' || cat === 'ARBITRAGE_WINDOW' || cat === 'ESCROW_RELEASE' || cat === 'IMPORT_DUTY')) {
            return;
          }
          if (!settings.notifyBunkerShocks && (cat === 'BUNKER_PRICES')) {
            return;
          }
          if (!settings.notifyRightShipVetting && (cat === 'RIGHTSHIP_VETTING' || cat === 'CREW_WELFARE' || cat === 'P_AND_I_CLUB' || cat === 'BALLAST_WATER')) {
            return;
          }
        }

        // If an alert is already on screen, exit smoothly first, then enter new
        if (isVisible && !isExiting) {
          setIsExiting(true);
          setTimeout(() => {
            setCurrentNotif(data);
            setIsExiting(false);
            setIsVisible(true);
            setProgress(100);

            if (!isMuted && soundEnabled) {
              playChime(data.severity || 'INFO');
            }
          }, 320);
        } else {
          setCurrentNotif(data);
          setIsVisible(true);
          setIsExiting(false);
          setProgress(100);

          if (!isMuted && soundEnabled) {
            playChime(data.severity || 'INFO');
          }
        }
      }
    } catch {
      // Fallback local alert if backend not ready
    }
  }, [activeRole, isMuted, isStreamActive, enableNotifications, soundEnabled, isVisible, isExiting, settings]);

  // ─── Manage Countdown Timer (7-8 seconds) ───────────────────────────────────
  useEffect(() => {
    if (!isVisible || isPaused || isExiting) return;

    const startTime = Date.now();
    const duration = (progress / 100) * POPUP_DURATION_MS;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, ((duration - elapsed) / POPUP_DURATION_MS) * 100);
      setProgress(remainingPct);

      if (remainingPct <= 0) {
        clearInterval(progressIntervalRef.current);
        handleDismiss();
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isVisible, isPaused, isExiting, handleDismiss, POPUP_DURATION_MS]);

  // ─── Schedule Recurring Random Notifications ────────────────────────────────
  useEffect(() => {
    if (!isStreamActive) return;

    // Initial alert on dashboard load after 2.5 seconds
    const initialTimeout = setTimeout(() => {
      triggerNextNotification();
    }, 2500);

    return () => {
      clearTimeout(initialTimeout);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (nextScheduleRef.current) clearTimeout(nextScheduleRef.current);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    };
  }, [triggerNextNotification, isStreamActive]);

  const handleAction = () => {
    if (currentNotif?.link) {
      handleDismiss();
      navigate(currentNotif.link);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (!next && soundEnabled) {
      playChime('INFO'); // Preview chime when unmuting
    }
  };

  if (!currentNotif || (!isVisible && !isExiting) || !enableNotifications) return null;

  const cat = currentNotif.category || 'SYSTEM';
  const categoryMeta = CATEGORY_MAP[cat] || {
    icon: <Bell size={14} />,
    label: (cat || '').replace(/_/g, ' '),
    color: 'text-indigo-500 bg-indigo-500/10',
  };

  const severityPalette =
    currentNotif.severity === 'CRITICAL'
      ? 'palette-rose'
      : currentNotif.severity === 'WARNING'
        ? 'palette-amber'
        : currentNotif.severity === 'SUCCESS'
          ? 'palette-emerald'
          : 'palette-ocean';

  const severityBorder =
    currentNotif.severity === 'CRITICAL'
      ? 'border-rose-500/60 dark:border-rose-500/50'
      : currentNotif.severity === 'WARNING'
        ? 'border-amber-500/60 dark:border-amber-500/50'
        : currentNotif.severity === 'SUCCESS'
          ? 'border-emerald-500/60 dark:border-emerald-500/50'
          : 'border-sky-500/60 dark:border-sky-500/50';

  const severityBar =
    currentNotif.severity === 'CRITICAL'
      ? 'bg-rose-500'
      : currentNotif.severity === 'WARNING'
        ? 'bg-amber-500'
        : currentNotif.severity === 'SUCCESS'
          ? 'bg-emerald-500'
          : 'bg-blue-500';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-[92vw] sm:w-[420px] transition-all duration-300",
        isExiting ? "animate-ios-notif-exit" : "animate-ios-notif-enter"
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ─── Opaque Background with Glassmorphism Depth & Animated Border Beam ─── */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl glass-opaque-card border-beam-animated border p-4 transition-all duration-300 group ios-card-hover",
          severityPalette,
          severityBorder
        )}
      >
        {/* Layer 1: Diagonal glass light reflection sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] dark:via-white/[0.015] dark:to-white/[0.04] pointer-events-none rounded-2xl" />

        {/* Layer 2: Subtle ambient corner prism glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-500/15 via-sky-500/8 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Top row: Category Badge, Role Pill, Sound & Controls */}
        <div className="flex items-center justify-between gap-2 mb-2.5 relative z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border border-slate-200/60 dark:border-slate-700/60 ${categoryMeta.color}`}
            >
              {categoryMeta.icon}
              <span>{categoryMeta.label}</span>
            </span>

            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              {!currentNotif.role || currentNotif.role === 'ALL'
                ? 'All Profiles'
                : (currentNotif.role || '').replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            {/* DND Toggle */}
            <button
              onClick={() => {
                const newDnd = !settings?.dndEnabled;
                useSettingsStore.getState().updateSetting('dndEnabled', newDnd);
                if (newDnd) {
                  showToast('DND Activated', 'Only Crucial notifications will arrive', 'info');
                } else {
                  showToast('DND Deactivated', 'All operational notifications enabled', 'info');
                }
              }}
              title={settings?.dndEnabled ? 'Do Not Disturb is ACTIVE (Click to turn off)' : 'Enable Do Not Disturb (Only Crucial alerts)'}
              className={cn(
                'p-1 rounded transition ios-btn-spring',
                settings?.dndEnabled
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              )}
            >
              <Moon size={12} className={settings?.dndEnabled ? 'fill-purple-400 text-purple-500' : ''} />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute notification chime' : 'Mute notification chime'}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition ios-btn-spring"
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="text-indigo-500" />}
            </button>

            {/* Next Random Alert Button */}
            <button
              onClick={triggerNextNotification}
              title="Next live alert"
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition ios-btn-spring"
            >
              <RotateCw size={12} />
            </button>

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              title="Dismiss alert"
              className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition ios-btn-spring"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Headline & Body Text */}
        <div className="relative z-10 mb-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug tracking-tight mb-1 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${severityBar} animate-pulse shrink-0`} />
            <span>{currentNotif.title}</span>
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
            {currentNotif.message}
          </p>
        </div>

        {/* Action Button & Metadata Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
          <div className="text-[10px] text-slate-400 font-medium">
            {isPaused ? (
              <span className="text-amber-500 font-semibold flex items-center gap-1">
                <Pause size={10} /> Paused on hover
              </span>
            ) : (
              <span>Auto-dismiss in {popupDurationSec}s</span>
            )}
          </div>

          {currentNotif.link && (
            <button
              onClick={handleAction}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-[11px] font-bold shadow-xs flex items-center gap-1 transition cursor-pointer ios-btn-spring"
            >
              <span>View Details</span>
              <ArrowRight size={11} />
            </button>
          )}
        </div>

        {/* ─── 7-8 Second Animated Progress Bar ──────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 dark:bg-slate-800/60 overflow-hidden">
          <div
            className={`h-full ${severityBar} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default GlassmorphicNotificationPopup;
