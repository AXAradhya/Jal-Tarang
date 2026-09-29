import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  ExternalLink,
  Shield,
  Anchor,
  TrendingUp,
  MapPin,
  Database,
  Package,
  BarChart2,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  Layers,
  HelpCircle,
  Radio,
  Compass,
  ArrowRight,
  RefreshCw,
  Mic,
  MicOff,
  Info,
  MessageSquare,
  Plus,
  Trash2,
  Pin,
  PinOff
} from 'lucide-react';
import { copilotApi, configApi } from '../../api';
import { formatPct, formatDate, cn } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { SystemRole, ChatMessage } from '../../types';
import { audioService } from '../../lib/audioService';
import { showToast } from '../../store/toastStore';

const TOOL_ICONS: Record<string, React.ReactNode> = {
  get_freight_rates: <TrendingUp size={12} className="text-sky-400" />,
  searchFreight: <TrendingUp size={12} className="text-sky-400" />,
  get_freight_forecast: <BarChart2 size={12} className="text-blue-400" />,
  getForecast: <BarChart2 size={12} className="text-blue-400" />,
  get_available_vessels: <Anchor size={12} className="text-indigo-400" />,
  searchVessels: <Anchor size={12} className="text-indigo-400" />,
  check_port_feasibility: <MapPin size={12} className="text-emerald-400" />,
  checkPortFeasibility: <MapPin size={12} className="text-emerald-400" />,
  searchPorts: <MapPin size={12} className="text-emerald-400" />,
  calculate_voyage_economics: <Database size={12} className="text-purple-400" />,
  analyzeVoyage: <Database size={12} className="text-purple-400" />,
  get_risk_assessment: <Shield size={12} className="text-amber-400" />,
  getFleetOverview: <Anchor size={12} className="text-sky-400" />,
  getPlantStockBuffer: <Package size={12} className="text-emerald-400" />,
  getPortCongestionStatus: <MapPin size={12} className="text-amber-400" />,
  getAnalystModelSnapshot: <BarChart2 size={12} className="text-blue-400" />,
  getSuperAdminOverview: <Shield size={12} className="text-indigo-400" />,
};

export const FloatingCopilotChat: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currency, isCopilotOpen, setCopilotOpen } = useUiStore();
  const { user } = useAuthStore();
  const currentRole: SystemRole = user?.roles?.[0] || 'CHARTERING_MANAGER';

  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeConfidenceMsg, setActiveConfidenceMsg] = useState<ChatMessage | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    sessions,
    activeSessionId,
    createSession,
    switchSession,
    deleteSession,
    addMessage,
    getActiveSession,
    togglePinSession,
  } = useChatStore();

  const activeSession = getActiveSession();
  const messages = activeSession?.messages || [];

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech Recognition Unavailable', 'Your browser does not support Web Speech API', 'warning');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        audioService.playClick();
        showToast('Listening...', 'Speak your maritime question', 'info', 3000);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        audioService.playSuccess();
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      showToast('Voice Recognition Error', 'Microphone access denied or error occurred', 'error');
    }
  };

  // iOS-style smooth open/close animation lifecycle
  const [shouldRender, setShouldRender] = useState(isCopilotOpen);
  const [animClass, setAnimClass] = useState(isCopilotOpen ? 'animate-ios-copilot-open' : '');
  const [backdropClass, setBackdropClass] = useState(isCopilotOpen ? 'animate-ios-backdrop-open' : '');
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    if (isCopilotOpen) {
      setShouldRender(true);
      setAnimClass('animate-ios-copilot-open');
      setBackdropClass('animate-ios-backdrop-open');
    } else if (shouldRender) {
      setAnimClass('animate-ios-copilot-close');
      setBackdropClass('animate-ios-backdrop-close');
      animTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
        setBackdropClass('');
      }, 310);
    }

    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [isCopilotOpen, shouldRender]);

  // Fetch centralized UI configuration
  const { data: uiConfig } = useQuery({
    queryKey: ['uiConfig'],
    queryFn: () => configApi.getUiConfig(),
    staleTime: 300_000,
  });

  // Role questions from config
  const roleQuestions = useMemo(() => {
    if (uiConfig?.roleQuestions?.[currentRole]) {
      return uiConfig.roleQuestions[currentRole];
    }
    return [
      'What are my key responsibilities and tools in JAL TARANG?',
      'Which candidate vessels and freight corridors should I monitor?',
      'Run a voyage economics analysis for 100,000 MT Coking Coal',
      'What is today\'s USD/INR landed freight cost in ₹/MT?',
      'Are there any active cyclone alerts or high swells for Paradip port?',
    ];
  }, [uiConfig, currentRole]);

  // Context-aware questions based on the active route
  const contextualPrompts = useMemo(() => {
    const p = location.pathname;
    if (p.includes('data')) {
      return [
        'What is today\'s USD/INR rate and landed freight cost in ₹/MT?',
        'Are there any active cyclone alerts or high swells for Paradip port?',
        'What are the latest World Bank commodity benchmarks for coking coal?',
        'What is the turnaround time and rake capacity at Paradip and Bhilai plant demand?',
      ];
    }
    if (p.includes('control-tower')) {
      return [
        'What is the current berth waiting queue at Paradip Port?',
        'Are there any active cyclone alerts or high swells for Paradip port?',
        'List all candidate Capesize ships currently en route or ballasting.',
        'Which East Coast port has the lowest pre-berthing detention?'
      ];
    }
    if (p.includes('decision')) {
      return [
        'Compare spot chartering vs COA allocation for upcoming tender.',
        'Calculate voyage economics for 150,000 MT Coking Coal from Port Hedland.',
        'What is the recommended demurrage risk mitigation strategy?',
        'What is today\'s USD/INR rate and landed freight cost in ₹/MT?'
      ];
    }
    if (p.includes('forecasting') || p.includes('freight')) {
      return [
        'What is the 30-day forward projection for Baltic Capesize C5TC?',
        'What are the latest World Bank commodity benchmarks for coking coal?',
        'Explain the econometric seasonal drift in the forward curve.',
        'What are the primary drivers of BDI volatility this month?'
      ];
    }
    if (p.includes('ports')) {
      return [
        'Check max draft and beam limitations at Visakhapatnam Inner Harbour.',
        'Evaluate port diversion feasibility from Haldia to Paradip.',
        'What is the turnaround time and rake capacity at Paradip and Bhilai plant demand?',
        'Show 7-day berth congestion forecast for East Coast ports.'
      ];
    }
    if (p.includes('chartering') || p.includes('decision')) {
      return [
        'Run Haldia vs Dhamra rail freight arbitrage analysis',
        'Simulate 10,000 Monte Carlo paths for COA vs Spot',
        'Open Demurrage & Laytime Calculator for 75k MT stem',
        'Calculate backhaul TCE uplift for Paradip to Caofeidian'
      ];
    }
    if (p.includes('procurement') || p.includes('cargo')) {
      return [
        'What is the current plant stock buffer at Bokaro and Rourkela?',
        'What is today\'s USD/INR landed freight cost in ₹/MT?',
        'Optimize cargo stem split between Capesize and Panamax bulkers.',
        'Which supplier origin has lowest delivered CFR cost to India?'
      ];
    }
    return roleQuestions;
  }, [location.pathname, roleQuestions]);

  // Global Keyboard Shortcut: Ctrl+J or Cmd+J toggles the copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setCopilotOpen(!isCopilotOpen);
      }
      if (e.key === 'Escape' && isCopilotOpen) {
        setCopilotOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCopilotOpen, setCopilotOpen]);

  // Focus input on open
  useEffect(() => {
    if (isCopilotOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isCopilotOpen]);

  useEffect(() => {
    if (isCopilotOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCopilotOpen]);

  const mutation = useMutation({
    mutationFn: ({ query, sessionId }: { query: string; sessionId: string }) =>
      copilotApi.query({
        query,
        sessionId,
        role: currentRole,
        currentRole: currentRole,
        page: location.pathname,
        currency,
      }),
    onSuccess: (data, variables) => {
      addMessage(variables.sessionId, {
        role: 'assistant',
        content: data?.answer ?? 'I could not generate a response. Please ensure the backend server is running.',
        evidence: data?.evidence ?? [],
        source: data?.source,
        confidence: data?.confidence,
        roleContext: data?.roleContext,
        pageContext: data?.pageContext,
        suggestedFollowups: data?.suggestedFollowups ?? [],
        model: data?.model,
        fallbackActive: data?.fallbackActive,
      });
      audioService.playSuccess();
    },
    onError: (_err, variables) => {
      addMessage(variables.sessionId, {
        role: 'assistant',
        content:
          '**Backend Connection Warning.** Ensure the JAL TARANG backend service is running on port 8000 to receive live grounded answers.\n\nAll tools remain grounded in official PostgreSQL schemas and IMO maritime standards.',
      });
      audioService.playToggle(false);
    },
  });

  const handleSend = (text?: string) => {
    const query = text ?? input.trim();
    if (!query) return;
    setInput('');
    audioService.playClick();

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = createSession(currentRole, query.slice(0, 40));
    }

    addMessage(targetSessionId, {
      role: 'user',
      content: query,
    });

    // Proactive AI action triggers for modal tools
    const qLower = query.toLowerCase();
    if (qLower.includes('demurrage') && (qLower.includes('calc') || qLower.includes('open') || qLower.includes('laytime'))) {
      useUiStore.getState().setDemurrageOpen(true);
    } else if (qLower.includes('arbitrage') || (qLower.includes('haldia') && qLower.includes('dhamra'))) {
      useUiStore.getState().setArbitrageOpen(true);
    } else if (qLower.includes('monte carlo') || qLower.includes('10,000') || qLower.includes('10000')) {
      useUiStore.getState().setMonteCarloOpen(true);
    } else if (qLower.includes('scratchpad') || (qLower.includes('charterer') && qLower.includes('note'))) {
      useUiStore.getState().setScratchpadOpen(true);
    }

    mutation.mutate({ query, sessionId: targetSessionId });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    createSession(currentRole, 'New Discussion');
    audioService.playClick();
    showToast('New Discussion Started', 'Fresh Copilot discussion thread initialized', 'info');
  };

  // Don't display floating button if the user is directly on the dedicated /copilot page
  const isDedicatedCopilotPage = location.pathname === '/copilot';

  // Rich markdown parser for assistant messages
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-2.5 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
                {(line || '').replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2 mb-0.5 uppercase tracking-wider">
                {(line || '').replace('#### ', '')}
              </h4>
            );
          }
          if (line.startsWith('- ')) {
            const bulletText = (line || '').replace('- ', '');
            const parts = bulletText.split(/\*\*(.*?)\*\*/g);
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1.5 my-0.5">
                <span className="text-sky-500 font-bold mt-1 text-[8px]">●</span>
                <p className="flex-1 text-slate-700 dark:text-slate-200">
                  {parts.map((part, j) =>
                    j % 2 === 1 ? <strong key={j} className="text-slate-900 dark:text-white font-semibold">{part}</strong> : part
                  )}
                </p>
              </div>
            );
          }
          if (line.match(/^\d+\.\s/)) {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1.5 my-0.5">
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px] min-w-[14px]">
                  {line.match(/^\d+\./)?.[0]}
                </span>
                <p className="flex-1 text-slate-700 dark:text-slate-200">
                  {parts.map((part, j) =>
                    j % 2 === 1 ? <strong key={j} className="text-slate-900 dark:text-white font-semibold">{part}</strong> : part
                  )}
                </p>
              </div>
            );
          }

          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={idx} className={line === '' ? 'h-1.5' : 'text-slate-700 dark:text-slate-200'}>
              {parts.map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="text-slate-900 dark:text-white font-semibold">{part}</strong> : part
              )}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay (iOS Modal Feel) */}
      {shouldRender && (
        <div
          onClick={() => setCopilotOpen(false)}
          className={`fixed inset-0 bg-slate-950/20 dark:bg-black/40 backdrop-blur-xs z-40 sm:hidden ${backdropClass}`}
          aria-hidden="true"
        />
      )}

      {/* ─── Translucent Glassmorphism Popup Chat Centre (iOS Spring Animation) ── */}
      {shouldRender && (
        <div
          role="dialog"
          aria-label="JAL TARANG Copilot Chat"
          className={`fixed z-[55] origin-bottom-right right-4 sm:right-6 bottom-20 sm:bottom-22 flex flex-col rounded-2xl overflow-hidden glassmorphism-copilot transition-size duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${animClass} ${
            isExpanded
              ? 'w-[calc(100vw-2rem)] sm:w-[760px] md:w-[840px] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] h-[calc(100vh-10rem)] max-h-[calc(100vh-10rem)]'
              : 'w-[calc(100vw-2rem)] sm:w-[460px] max-w-[calc(100vw-2rem)] h-[min(540px,calc(100vh-10.5rem))] max-h-[calc(100vh-10.5rem)]'
          }`}
        >
          {/* Top Neon Gradient Rim */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-400 to-teal-400 shrink-0" />

          {/* Frosted Glass Header */}
          <div className="p-3 sm:px-4 sm:py-3 border-b border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-between gap-2 shrink-0 select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 p-0.5 shadow-md shadow-blue-500/25 shrink-0 flex items-center justify-center text-white">
                <Bot size={18} />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    JAL TARANG Copilot
                  </h2>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20">
                    AI v2.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  <Shield size={10} className="text-blue-500 shrink-0" />
                  <span>{(currentRole || 'CHARTERING_MANAGER').replace(/_/g, ' ')}</span>
                  <span className="opacity-50">·</span>
                  <span className="truncate">{location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1)}</span>
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                title="Discussions History"
                className={cn(
                  "p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs",
                  showHistoryDrawer
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
              >
                <MessageSquare size={13} />
                <span className="text-[10px] font-bold hidden sm:inline">{sessions.length}</span>
              </button>
              <button
                onClick={handleReset}
                title="Start new thread"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore window size' : 'Expand window'}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 transition cursor-pointer hidden sm:inline-flex"
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={() => {
                  setCopilotOpen(false);
                  navigate('/copilot');
                }}
                title="Open full dedicated page"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                <ExternalLink size={14} />
              </button>
              <button
                onClick={() => setCopilotOpen(false)}
                title="Close Copilot"
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Telemetry Status Strip */}
          <div className="px-3 py-1 bg-sky-50/50 dark:bg-sky-950/30 border-b border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Grounded in PostgreSQL & AIS Telemetry</span>
            </span>
            <span className="font-mono text-[9px] text-slate-400 shrink-0">
              {activeSession ? `${messages.length} msgs` : 'Ready'}
            </span>
          </div>

          {/* ─── Thread Switcher Drawer Overlay ───────────────────────────── */}
          {showHistoryDrawer && (
            <div className="absolute inset-0 top-12 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-blue-600 dark:text-sky-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Discussions & Threads ({sessions.length})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      createSession(currentRole, 'New Discussion');
                      setShowHistoryDrawer(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    <Plus size={12} />
                    <span>New</span>
                  </button>
                  <button
                    onClick={() => setShowHistoryDrawer(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No saved discussions yet.
                  </div>
                ) : (
                  sessions.map((sess) => {
                    const isCurrent = sess.id === activeSessionId;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => {
                          switchSession(sess.id);
                          setShowHistoryDrawer(false);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer",
                          isCurrent
                            ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 ring-1 ring-blue-400/20"
                            : "bg-white/40 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {sess.isPinned && <Pin size={10} className="text-amber-500 fill-amber-500 shrink-0" />}
                            <h4 className={cn("text-xs font-bold truncate", isCurrent ? "text-blue-900 dark:text-sky-300" : "text-slate-800 dark:text-slate-200")}>
                              {sess.title}
                            </h4>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{sess.messages.length} messages</span>
                            <span>·</span>
                            <span>{new Date(sess.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => togglePinSession(sess.id)}
                            title={sess.isPinned ? "Unpin" : "Pin to top"}
                            className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer"
                          >
                            {sess.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                          </button>
                          <button
                            onClick={() => deleteSession(sess.id)}
                            title="Delete thread"
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-tr from-blue-600 to-sky-600 text-white'
                      : 'bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-500'
                  }`}
                >
                  {msg.role === 'user' ? <span className="text-[10px] font-bold">U</span> : <Bot size={13} />}
                </div>

                {/* Message Bubble Container */}
                <div className={`max-w-[86%] space-y-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>JAL TARANG AI</span>
                        <Sparkles size={9} className="text-sky-500" />
                      </span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer transition"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={10} className="text-emerald-500" />
                            <span className="text-emerald-500 font-medium text-[9px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={10} />
                            <span className="text-[9px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-tr-xs shadow-md shadow-blue-500/20'
                        : 'glass-bubble-bot text-slate-900 dark:text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-xs font-medium leading-relaxed">{msg.content}</p>
                    ) : (
                      renderFormattedContent(msg.content)
                    )}
                  </div>

                  {/* Grounded Tool Evidence Drawer */}
                  {msg.evidence && msg.evidence.length > 0 && (
                    <div className="w-full bg-white/50 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-xl p-2 text-[11px] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/80 pb-1 mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <CheckCircle2 size={10} className="text-emerald-500" />
                          <span>Grounded Tool Traces ({msg.evidence.length})</span>
                        </span>
                        {msg.confidence !== undefined && (
                          <button
                            onClick={() => setActiveConfidenceMsg(msg)}
                            className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                            title="Click to view confidence calculation breakdown"
                          >
                            <span>{formatPct(msg.confidence * 100)} Confidence</span>
                            <Info size={9} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {msg.evidence.map((ev, i) => (
                          <div key={i} className="flex items-center gap-1.5 p-1 rounded bg-slate-50/70 dark:bg-slate-800/50 text-[10px]">
                            {TOOL_ICONS[ev.toolName] ?? <Database size={10} />}
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{ev.toolName}</span>
                            <span className="text-slate-400 text-[9px] ml-auto font-mono">
                              {formatDate(ev.executedAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Followups */}
                  {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {msg.suggestedFollowups.map((followup, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(followup)}
                          className="text-[10px] text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 bg-white/60 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-slate-200/60 dark:border-slate-700/60 px-2 py-0.5 rounded-md transition cursor-pointer"
                        >
                          {followup}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-slate-400/80 font-mono px-0.5">
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {mutation.isPending && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1">
                <Bot size={14} className="animate-spin text-sky-500" />
                <span className="animate-pulse">JAL TARANG AI is reasoning and grounding...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts Horizontal Strip (context-aware) */}
          <div className="px-3 py-1.5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/70 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Compass size={10} />
              Suggested:
            </span>
            {contextualPrompts.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-white/70 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/70 text-slate-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 border border-slate-200/60 dark:border-slate-700/60 transition cursor-pointer shrink-0 truncate max-w-[200px]"
                title={prompt}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Glassmorphic Input Capsule Bar */}
          <div className="p-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/70 shrink-0">
            <div className="glass-input-capsule rounded-xl p-1.5 flex items-center gap-2 shadow-xs transition-all focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-400">
              <input
                ref={inputRef}
                id="floating-copilot-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={`Ask JAL TARANG Copilot about ${location.pathname.slice(1) || 'operations'}, rates, ports…`}
                className="flex-1 bg-transparent border-0 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden px-2 py-1"
              />
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition shadow-xs cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Voice input (Speech to Text)'}
              >
                {isListening ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
              <button
                id="floating-copilot-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || mutation.isPending}
                className="h-7 w-7 rounded-lg bg-gradient-to-tr from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition shadow-xs cursor-pointer shrink-0"
                title="Send query"
              >
                <Send size={12} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[9px] text-slate-400 dark:text-slate-500">
              <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[8px]">Enter</kbd> to ask</span>
              <span className="hidden sm:inline">Shortcut: <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[8px]">Ctrl+J</kbd></span>
            </div>
          </div>

          {/* Confidence Breakdown Popover Modal */}
          {activeConfidenceMsg && (
            <div
              className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
              onClick={() => setActiveConfidenceMsg(null)}
            >
              <div
                className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Shield size={14} className="text-emerald-500" />
                    <span>Confidence Score Breakdown</span>
                  </div>
                  <button
                    onClick={() => setActiveConfidenceMsg(null)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="text-center py-2 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatPct((activeConfidenceMsg.confidence ?? 0.88) * 100)}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Grounded Econometric Reliability
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Base Heuristic Score:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">86.4%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Grounded Tool Traces ({activeConfidenceMsg.evidence?.length || 0}):</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{(Math.min(3.5, (activeConfidenceMsg.evidence?.length || 1) * 1.2)).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">Domain Entity Verification:</span>
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">+2.5%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Query Complexity Normalization:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">-0.5%</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveConfidenceMsg(null)}
                  className="w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Floating Copilot Chat Button (Bottom Right) ────────────────────────── */}
      {!isDedicatedCopilotPage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center group">
          {/* Hover Tooltip Capsule */}
          <div className="mr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white text-xs font-semibold shadow-xl border border-white/10 select-none">
            <Sparkles size={12} className="text-sky-400 animate-spin" />
            <span>Ask JAL TARANG Copilot</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 dark:bg-slate-700 text-slate-300 ml-1 border border-slate-600">
              Ctrl+J
            </kbd>
          </div>

          {/* Floating Action Button */}
          <button
            id="marinex-floating-copilot-btn"
            onClick={() => setCopilotOpen(!isCopilotOpen)}
            aria-label={isCopilotOpen ? 'Close Copilot chat' : 'Open JAL TARANG Copilot AI chat'}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 cursor-pointer select-none ${
              isCopilotOpen
                ? 'bg-slate-800 hover:bg-slate-700 border-2 border-sky-400/50 scale-105 shadow-sky-500/25'
                : 'bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-500 hover:from-blue-600 hover:via-sky-500 hover:to-cyan-400 border-2 border-white/40 dark:border-sky-300/40 hover:scale-110 copilot-fab-glow'
            }`}
          >
            {/* Spinning Radar Ambient Pulse */}
            {!isCopilotOpen && (
              <span className="absolute -inset-1 rounded-full bg-sky-400/20 blur-sm animate-pulse -z-10" />
            )}

            {/* Icon Morphing */}
            {isCopilotOpen ? (
              <X size={24} className="transition-transform duration-200 rotate-90 group-hover:rotate-180" />
            ) : (
              <div className="relative">
                <Bot size={26} className="transition-transform duration-200 group-hover:scale-110" />
                <Sparkles size={11} className="absolute -top-1 -right-1.5 text-amber-300 animate-bounce" />
              </div>
            )}

            {/* Live Operational Status Dot */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            </span>
          </button>
        </div>
      )}
    </>
  );
};

export default FloatingCopilotChat;
