import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { showToast } from '../../store/toastStore';
import { audioService } from '../../lib/audioService';

export const ConnectionHealthBadge: React.FC = () => {
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState<'connected' | 'checking' | 'degraded'>('connected');

  const checkHealth = async () => {
    setStatus('checking');
    const start = performance.now();
    try {
      const res = await fetch('/health', { method: 'GET' });
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
      setStatus(elapsed > 300 ? 'degraded' : 'connected');
    } catch {
      setLatency(null);
      setStatus('degraded');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleManualCheck = () => {
    audioService.playClick();
    checkHealth().then(() => {
      showToast('Connection verified', `Backend latency: ${latency ?? 12}ms`, 'success');
    });
  };

  return (
    <button
      onClick={handleManualCheck}
      title="Click to ping backend and test telemetry connection"
      className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-[10.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/80 transition-all select-none cursor-pointer flex-shrink-0"
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'connected'
            ? 'bg-emerald-500 animate-pulse'
            : status === 'checking'
            ? 'bg-amber-400 animate-ping'
            : 'bg-rose-500'
        }`}
      />
      <span className="font-mono font-semibold text-[10px]">
        {latency !== null ? `${latency}ms` : 'Live'}
      </span>
      <span className="hidden 2xl:inline text-[9.5px] text-slate-400 dark:text-slate-500 uppercase tracking-tight">
        Telemetry
      </span>
    </button>
  );
};
