import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Send,
  Bot,
  User,
  Database,
  BarChart2,
  Anchor,
  MapPin,
  Shield,
  TrendingUp,
  Sparkles,
  Package,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  HelpCircle,
  Briefcase,
  Copy,
  Plus,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  Download,
  FileText,
  Search,
  X,
  PanelLeftClose,
  PanelLeft,
  MoreVertical,
  Check,
  MessageSquare
} from 'lucide-react';
import { copilotApi, configApi } from '../../api';
import { LoadingSpinner, StatusBadge } from '../../components/common';
import { formatRateMt, formatDate, formatPct, cn } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { SystemRole } from '../../types';

const TOOL_ICONS: Record<string, React.ReactNode> = {
  get_freight_rates: <TrendingUp size={12} />,
  searchFreight: <TrendingUp size={12} />,
  get_freight_forecast: <BarChart2 size={12} />,
  getForecast: <BarChart2 size={12} />,
  get_available_vessels: <Anchor size={12} />,
  searchVessels: <Anchor size={12} />,
  check_port_feasibility: <MapPin size={12} />,
  checkPortFeasibility: <MapPin size={12} />,
  searchPorts: <MapPin size={12} />,
  calculate_voyage_economics: <Database size={12} />,
  analyzeVoyage: <Database size={12} />,
  get_risk_assessment: <Shield size={12} />,
  getFleetOverview: <Anchor size={12} />,
  getPlantStockBuffer: <Package size={12} />,
  getPortCongestionStatus: <MapPin size={12} />,
  getAnalystModelSnapshot: <BarChart2 size={12} />,
  getSuperAdminOverview: <Shield size={12} />,
};

const DEFAULT_ROLE_OPTIONS = [
  { role: SystemRole.CHARTERING_MANAGER, label: 'Chartering Manager', icon: <Anchor size={12} /> },
  { role: SystemRole.PROCUREMENT_MANAGER, label: 'Procurement Manager', icon: <Package size={12} /> },
  { role: SystemRole.PORT_MANAGER, label: 'Port Manager', icon: <MapPin size={12} /> },
  { role: SystemRole.ANALYST, label: 'Freight Analyst', icon: <TrendingUp size={12} /> },
  { role: SystemRole.SUPER_ADMIN, label: 'Super Admin', icon: <Shield size={12} /> },
];

const CopilotPage: React.FC = () => {
  const { currency } = useUiStore();
  const { user } = useAuthStore();
  const currentRole = user?.roles?.[0] || SystemRole.CHARTERING_MANAGER;

  // Centralized Chat Store (Multi-Thread Management & Sessions)
  const {
    sessions,
    activeSessionId,
    searchQuery,
    isSidebarOpen,
    setSearchQuery,
    toggleSidebar,
    fetchSessions,
    createSession,
    switchSession,
    renameSession,
    togglePinSession,
    deleteSession,
    clearAllSessions,
    addMessage,
    getActiveSession,
    exportSessionAsMarkdown,
    exportSessionAsJson,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch initial remote chat sessions for this role on mount
  useEffect(() => {
    fetchSessions(currentRole);
  }, [currentRole, fetchSessions]);

  // Fetch centralized dynamic UI configuration
  const { data: uiConfig } = useQuery({
    queryKey: ['uiConfig'],
    queryFn: () => configApi.getUiConfig(),
    staleTime: 300_000,
  });

  const activeSession = getActiveSession();
  const messages = activeSession?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeSessionId]);

  const mutation = useMutation({
    mutationFn: ({ query, sessionId }: { query: string; sessionId: string }) =>
      copilotApi.query({
        query,
        sessionId,
        role: currentRole,
        currentRole: currentRole,
        currency,
      }),
    onSuccess: (data, variables) => {
      addMessage(variables.sessionId, {
        role: 'assistant',
        content: data?.answer ?? 'I could not generate a response. Please ensure the backend is running.',
        evidence: data?.evidence ?? [],
        source: data?.source,
        confidence: data?.confidence,
        roleContext: data?.roleContext,
        pageContext: data?.pageContext,
        suggestedFollowups: data?.suggestedFollowups ?? [],
        model: data?.model,
      });
    },
    onError: (_err, variables) => {
      addMessage(variables.sessionId, {
        role: 'assistant',
        content:
          '**Backend Connection Warning.** Ensure the JAL TARANG backend server (port 8000) is running to receive live grounded responses.\n\nThe assistant is grounded across 15 project pages, 6 user roles, and deterministic maritime database tools.',
      });
    },
  });

  const sendMessage = (text?: string) => {
    const query = text ?? input.trim();
    if (!query) return;
    setInput('');

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = createSession(currentRole, query.slice(0, 42));
    }

    addMessage(targetSessionId, {
      role: 'user',
      content: query,
    });

    mutation.mutate({ query, sessionId: targetSessionId });
  };

  // Automatically execute query if forwarded from Search Platform Command Palette
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && q.trim()) {
      sendMessage(q.trim());
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartRename = (id: string, currentTitle: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(currentTitle);
    setActiveMenuId(null);
  };

  const handleSaveRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  // Filtered discussions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  const pinnedSessions = useMemo(() => filteredSessions.filter((s) => s.isPinned), [filteredSessions]);
  const recentSessions = useMemo(() => filteredSessions.filter((s) => !s.isPinned), [filteredSessions]);

  // Role-specific suggested questions from config API
  const roleQuestions = useMemo(() => {
    if (uiConfig?.roleQuestions?.[currentRole]) {
      return uiConfig.roleQuestions[currentRole];
    }
    return [
      'What are my key responsibilities and tools in JAL TARANG?',
      'Which candidate vessels and freight corridors should I monitor?',
      'Run a voyage economics analysis for 100,000 MT Coking Coal',
      "What is today's USD/INR landed freight cost in ₹/MT?",
      'Are there any active cyclone alerts or high swells for Paradip port?',
    ];
  }, [uiConfig, currentRole]);

  // Project pages exploration shortcuts
  const pageExplorationQuestions = [
    'How does the Decision Center compare spot fixtures vs COA allocation?',
    'What features are available in the Operations Control Tower?',
    'Explain the econometric models used in Freight Forecasting.',
    'How does Port Intelligence analyze congestion and draft restrictions?',
    'What risk mitigation workflows exist in the Risk Engine?',
  ];

  // Rich markdown parser for assistant messages
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-xs font-bold text-sky-600 dark:text-sky-300 mt-2 mb-1 flex items-center gap-1">
                <Sparkles size={11} />
                <span>{(line || '').replace('### ', '')}</span>
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-[13px] font-bold text-slate-900 dark:text-white mt-2.5 mb-1 pb-1 border-b border-slate-200/50 dark:border-slate-800/50">
                {(line || '').replace('## ', '')}
              </h3>
            );
          }
          if (line.startsWith('- ')) {
            const bulletText = (line || '').replace('- ', '');
            const parts = bulletText.split(/\*\*(.*?)\*\*/g);
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5">
                <span className="text-blue-500 font-bold mt-1 text-[8px]">●</span>
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
              <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5">
                <span className="text-slate-400 font-mono text-[11px] min-w-[16px]">{line.match(/^\d+\./)?.[0]}</span>
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
    <div className="h-full flex flex-col max-h-[calc(100vh-7rem)]">
      {/* Top Neon Accent Rim */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-sky-400 to-teal-400 rounded-t-xl mb-2" />

      {/* Header bar with Role & Grounding Info */}
      <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={toggleSidebar}
              title={isSidebarOpen ? 'Collapse Chat History' : 'Expand Chat History'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/25">
              <Bot size={18} />
            </div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">JAL TARANG Copilot</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Intelligence Online
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-300 border border-sky-500/20">
              Multi-Thread Sessions
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Operational maritime assistant grounded in PostgreSQL database records, East Coast Indian port constraints, and multi-session thread history.
          </p>
        </div>

        {/* Right Header Actions: Export & Verified Mandate */}
        <div className="flex items-center gap-2 flex-wrap">
          {activeSession && (
            <div className="flex items-center gap-1.5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80">
              <button
                onClick={() => exportSessionAsMarkdown(activeSession.id)}
                title="Export current thread as Markdown (.md)"
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
              >
                <FileText size={12} className="text-blue-500" />
                <span>Export MD</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                onClick={() => exportSessionAsJson(activeSession.id)}
                title="Export current thread as JSON"
                className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition cursor-pointer"
              >
                <Download size={12} className="text-sky-500" />
                <span>JSON</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 text-xs shadow-2xs">
            <Shield size={13} className="text-blue-600 dark:text-sky-400" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Verified Mandate:</span>
            <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-sky-300 font-bold text-[11px] border border-blue-200 dark:border-blue-900">
              {(currentRole || 'CHARTERING_MANAGER').replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3.5 flex-1 min-h-0">
        {/* ─── LEFT: Chat Threads & Sessions Sidebar ─────────────────────────── */}
        {isSidebarOpen && (
          <aside className="w-72 sm:w-80 flex-shrink-0 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-xs animate-in slide-in-from-left duration-200">
            {/* Sidebar Top: New Chat & Search */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
              <button
                onClick={() => createSession(currentRole, 'New Conversation')}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>New Discussion Thread</span>
              </button>

              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter discussions..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar Middle: Scrollable Threads List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* Pinned Section */}
              {pinnedSessions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider px-2 flex items-center gap-1">
                    <Pin size={10} /> Pinned Discussions ({pinnedSessions.length})
                  </span>
                  {pinnedSessions.map((sess) => renderThreadItem(sess))}
                </div>
              )}

              {/* Recent Section */}
              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block">
                  Recent Activity ({recentSessions.length})
                </span>
                {recentSessions.length === 0 ? (
                  <div className="px-3 py-6 text-center text-slate-400 text-xs">
                    <MessageSquare size={20} className="mx-auto mb-1.5 opacity-40" />
                    <p>No recent discussions found</p>
                  </div>
                ) : (
                  recentSessions.map((sess) => renderThreadItem(sess))
                )}
              </div>
            </div>

            {/* Sidebar Bottom: Summary & Clear */}
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
              <span>{sessions.length} discussions saved</span>
              {sessions.length > 0 && (
                confirmClearAll ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={async () => {
                        await clearAllSessions();
                        setConfirmClearAll(false);
                      }}
                      className="text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      Confirm
                    </button>
                    <span>/</span>
                    <button
                      onClick={() => setConfirmClearAll(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearAll(true)}
                    className="text-red-500/80 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Clear All</span>
                  </button>
                )
              )}
            </div>
          </aside>
        )}

        {/* ─── CENTER: Chat Messages & Input Pane ─────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto glassmorphism-copilot rounded-2xl mb-3 p-4 sm:p-5 space-y-4 min-h-0 shadow-lg">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-lg mx-auto my-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Bot size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    JAL TARANG Maritime Neural Copilot
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Ready to assist your <strong>{(currentRole || 'CHARTERING_MANAGER').replace(/_/g, ' ')}</strong> mandate. Inquire about freight rate trends, port constraints, or draft voyage models.
                  </p>
                </div>

                <div className="w-full space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">
                    Suggested Inquiries for You:
                  </span>
                  {roleQuestions.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-700 dark:text-slate-200 transition flex items-center justify-between group cursor-pointer"
                    >
                      <span>{q}</span>
                      <ChevronRight size={12} className="text-slate-400 group-hover:text-blue-500 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-tr from-blue-600 to-sky-600 text-white'
                        : 'bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-500'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  {/* Message content container */}
                  <div className={`space-y-1.5 max-w-[85%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                    {/* Role & Context banner for assistant */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            JAL TARANG AI Copilot
                          </span>
                          {msg.model && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {msg.model}
                            </span>
                          )}
                          {msg.fallbackActive && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Knowledge Fallback
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <span className="text-emerald-500 font-semibold text-[10px] flex items-center gap-0.5">
                              <CheckCircle2 size={11} /> Copied
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Copy size={11} /> Copy
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-xs ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white rounded-tr-xs shadow-md shadow-blue-500/20'
                          : 'glass-bubble-bot text-slate-900 dark:text-slate-100 rounded-tl-xs'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-[13px] font-medium leading-relaxed">{msg.content}</p>
                      ) : (
                        renderFormattedContent(msg.content)
                      )}
                    </div>

                    {/* Evidence traces */}
                    {msg.evidence && msg.evidence.length > 0 && (
                      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-xl px-3 py-2 w-full text-xs shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/80 pb-1.5 mb-2">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={11} className="text-emerald-500" />
                            Grounded Tool Evidence ({msg.evidence.length})
                          </span>
                          {msg.confidence !== undefined && (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              Confidence: {formatPct(msg.confidence * 100)}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {msg.evidence.map((ev, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] bg-white/70 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200/40 dark:border-slate-700/40">
                              <span className="text-emerald-500 shrink-0">
                                {TOOL_ICONS[ev.toolName] ?? <Database size={12} />}
                              </span>
                              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{ev.toolName}</span>
                              <span className="text-slate-400 text-[10px]">executed at</span>
                              <span className="text-slate-400 ml-auto text-[10px] font-mono">{formatDate(ev.executedAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clickable suggested follow-up chips */}
                    {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedFollowups.map((followup, idx) => (
                          <button
                            key={idx}
                            onClick={() => sendMessage(followup)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <Sparkles size={10} />
                            <span>{followup}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}

            {mutation.isPending && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-500">
                  <Bot size={14} className="animate-spin" />
                </div>
                <div className="glass-bubble-bot rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Consulting grounded database & {(currentRole || 'CHARTERING_MANAGER').replace(/_/g, ' ')} intelligence…
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input field */}
          <div className="glass-input-capsule rounded-xl p-1.5 flex gap-2 shadow-xs transition-all focus-within:ring-2 focus-within:ring-sky-500/30 focus-within:border-sky-400">
            <input
              id="copilot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={`Ask anything about ${(currentRole || 'CHARTERING_MANAGER').replace(/_/g, ' ')}, project pages, freight rates, or port constraints…`}
              className="flex-1 bg-transparent border-0 text-slate-900 dark:text-slate-100 text-xs rounded-lg px-3 py-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
            />
            <button
              id="copilot-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || mutation.isPending}
              className="bg-gradient-to-tr from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 disabled:opacity-40 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 font-semibold text-xs shadow-xs cursor-pointer"
            >
              <Send size={13} />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* ─── RIGHT: Role Persona & Page Navigation Directory ───────────────── */}
        <div className="w-64 flex-shrink-0 hidden xl:flex flex-col gap-3 overflow-y-auto">
          {/* Active Role Card */}
          <div className="bg-card border border-border rounded-lg p-3 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Active Persona</span>
              <StatusBadge value={currentRole} size="xs" label={currentRole.split('_')[0]} />
            </div>
            <p className="text-xs font-bold text-foreground">
              {(currentRole || 'CHARTERING_MANAGER').replace(/_/g, ' ')}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Copilot automatically tailors decisions, KPIs, and page recommendations to this role.
            </p>
          </div>

          {/* Role-Specific Questions */}
          <div className="bg-card border border-border rounded-lg p-3 shadow-xs">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles size={11} className="text-primary" />
              <span>{currentRole.split('_')[0]} Questions</span>
            </p>
            <div className="space-y-1">
              {roleQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2 py-1.5 rounded transition-colors leading-snug flex items-start gap-1 cursor-pointer"
                >
                  <ChevronRight size={11} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Project Pages Directory */}
          <div className="bg-card border border-border rounded-lg p-3 shadow-xs">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Layers size={11} className="text-primary" />
              <span>Explore Project Pages</span>
            </p>
            <div className="space-y-1">
              {pageExplorationQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2 py-1.5 rounded transition-colors leading-snug flex items-start gap-1 cursor-pointer"
                >
                  <ChevronRight size={11} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Available Grounded Tools */}
          <div className="bg-card border border-border rounded-lg p-3 shadow-xs">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Database size={11} className="text-primary" />
              <span>Available Grounded Tools</span>
            </p>
            <div className="space-y-1">
              {Object.entries(TOOL_ICONS).slice(0, 6).map(([name, icon]) => (
                <div key={name} className="flex items-center gap-2 py-1 text-[11px]">
                  <span className="text-emerald-500">{icon}</span>
                  <span className="text-muted-foreground font-mono truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper renderer for each thread item in the sidebar
  function renderThreadItem(sess: any) {
    const isActive = activeSessionId === sess.id;
    const isEditing = editingSessionId === sess.id;
    const isMenuOpen = activeMenuId === sess.id;

    return (
      <div
        key={sess.id}
        onClick={() => {
          if (!isEditing) switchSession(sess.id);
        }}
        className={cn(
          'group relative p-2.5 rounded-xl border transition-all text-left cursor-pointer flex flex-col gap-1',
          isActive
            ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700/80 shadow-2xs ring-1 ring-blue-400/30'
            : 'bg-white/40 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
        )}
      >
        <div className="flex items-center justify-between gap-1.5">
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(sess.id);
                  if (e.key === 'Escape') setEditingSessionId(null);
                }}
                autoFocus
                className="flex-1 py-0.5 px-1.5 text-xs rounded border border-blue-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
              <button
                onClick={() => handleSaveRename(sess.id)}
                className="p-1 rounded text-emerald-600 hover:bg-emerald-50 cursor-pointer"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {sess.isPinned && (
                <Pin size={11} className="text-amber-500 fill-amber-500 shrink-0" />
              )}
              <h4
                onDoubleClick={(e) => handleStartRename(sess.id, sess.title, e)}
                title="Double click to rename"
                className={cn(
                  'text-xs font-bold truncate',
                  isActive ? 'text-blue-900 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'
                )}
              >
                {sess.title}
              </h4>
            </div>
          )}

          {/* Action menu trigger */}
          <div className="relative shrink-0 flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePinSession(sess.id);
              }}
              title={sess.isPinned ? 'Unpin' : 'Pin to top'}
              className="p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-400 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              {sess.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : sess.id);
              }}
              className="p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 opacity-80 group-hover:opacity-100 transition cursor-pointer"
            >
              <MoreVertical size={12} />
            </button>

            {/* Context Dropdown Menu */}
            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="p-1 space-y-0.5">
                  <button
                    onClick={(e) => handleStartRename(sess.id, sess.title, e)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={() => {
                      togglePinSession(sess.id);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    {sess.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                    <span>{sess.isPinned ? 'Unpin' : 'Pin to Top'}</span>
                  </button>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      exportSessionAsMarkdown(sess.id);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <FileText size={11} />
                    <span>Export Markdown</span>
                  </button>
                  <button
                    onClick={() => {
                      exportSessionAsJson(sess.id);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <Download size={11} />
                    <span>Export JSON</span>
                  </button>
                </div>

                <div className="p-1">
                  <button
                    onClick={async () => {
                      await deleteSession(sess.id);
                      setActiveMenuId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer font-medium"
                  >
                    <Trash2 size={11} />
                    <span>Delete Thread</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message count, relative timestamp, and preview */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
          <span className="flex items-center gap-1">
            <MessageSquare size={9} />
            <span>{sess.messages.length} messages</span>
          </span>
          <span>
            {new Date(sess.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    );
  }
};

export default CopilotPage;
