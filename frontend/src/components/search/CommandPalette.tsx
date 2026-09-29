import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Radio,
  Brain,
  TrendingUp,
  Ship,
  Package,
  Anchor,
  MapPin,
  Shield,
  GitBranch,
  Bell,
  Bot,
  Users,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  Command,
  FileText,
  CornerDownLeft,
  X,
  Building2,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Activity,
  Layers,
  Cpu,
  Server,
  History
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { SystemRole } from '../../types';
import { vesselApi, portApi, contractApi, notificationApi } from '../../api';
import { useBookmarksStore } from '../../store/bookmarksStore';

export type SearchCategory = 'ALL' | 'PAGES' | 'FLEET' | 'PORTS' | 'CONTRACTS' | 'CARGO' | 'ACTIONS';

export interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'PAGES' | 'FLEET' | 'PORTS' | 'CONTRACTS' | 'CARGO' | 'ACTIONS';
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  route?: string;
  action?: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { theme, toggleTheme, currency, setCurrency } = useUiStore();
  const { user } = useAuthStore();
  const { recentHistory } = useBookmarksStore();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // iOS-style smooth modal open/close animation lifecycle
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animClass, setAnimClass] = useState(isOpen ? 'animate-ios-search-open' : '');
  const [backdropClass, setBackdropClass] = useState(isOpen ? 'animate-ios-backdrop-open' : '');
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    if (isOpen) {
      setShouldRender(true);
      setAnimClass('animate-ios-search-open');
      setBackdropClass('animate-ios-backdrop-open');
    } else if (shouldRender) {
      setAnimClass('animate-ios-search-close');
      setBackdropClass('animate-ios-backdrop-close');
      animTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
        setBackdropClass('');
      }, 230);
    }

    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [isOpen, shouldRender]);

  // Dynamic live data fetched on mount
  const [liveVessels, setLiveVessels] = useState<any[]>([]);
  const [livePorts, setLivePorts] = useState<any[]>([]);
  const [liveContracts, setLiveContracts] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch dynamic live entities in background to augment local database
    vesselApi.list({ limit: 15 }).then((data) => {
      const items = Array.isArray(data) ? data : data?.items || [];
      if (items.length > 0) setLiveVessels(items);
    }).catch(() => {});

    portApi.list({ limit: 15 }).then((data) => {
      const items = Array.isArray(data) ? data : data?.items || [];
      if (items.length > 0) setLivePorts(items);
    }).catch(() => {});

    contractApi.list({ limit: 15 }).then((data) => {
      const items = Array.isArray(data) ? data : data?.items || [];
      if (items.length > 0) setLiveContracts(items);
    }).catch(() => {});
  }, [isOpen]);

  // Focus input whenever opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static comprehensive platform catalog
  const catalog: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [
      // ─── Operational Pages ───────────────────────────────────────────────────
      {
        id: 'page-dashboard',
        title: 'Executive Dashboard',
        subtitle: 'Fleet health, aggregate cargo movement, and high-level KPIs',
        category: 'PAGES',
        icon: <LayoutDashboard size={16} className="text-blue-500" />,
        badge: '/dashboard',
        route: '/dashboard',
        keywords: ['kpi', 'executive', 'overview', 'summary', 'home']
      },
      {
        id: 'page-control-tower',
        title: 'Operations Control Tower',
        subtitle: 'Real-time telemetry, vessel tracking, port congestion & alerts',
        category: 'PAGES',
        icon: <Radio size={16} className="text-emerald-500" />,
        badge: '/control-tower',
        route: '/control-tower',
        keywords: ['telemetry', 'tower', 'map', 'tracking', 'live', 'satellite']
      },
      {
        id: 'page-decision',
        title: 'Decision Center',
        subtitle: 'AI-grounded chartering & spot vs COA allocation engine',
        category: 'PAGES',
        icon: <Brain size={16} className="text-purple-500" />,
        badge: '/decision',
        route: '/decision',
        keywords: ['ai', 'optimization', 'recommendation', 'fixture', 'spot', 'coa', 'allocation']
      },
      {
        id: 'page-forecasting',
        title: 'Freight Forecasting',
        subtitle: 'Baltic Dry Index (BDI), C5TC forward curves, ML predictions',
        category: 'PAGES',
        icon: <TrendingUp size={16} className="text-sky-500" />,
        badge: '/forecasting',
        route: '/forecasting',
        keywords: ['bdi', 'rates', 'capesize', 'panamax', 'forecast', 'forward curve', 'ml']
      },
      {
        id: 'page-chartering',
        title: 'Chartering & Vessels',
        subtitle: 'Capesize, Panamax & Supramax fleet availability and fixtures',
        category: 'PAGES',
        icon: <Ship size={16} className="text-cyan-500" />,
        badge: '/chartering',
        route: '/chartering',
        keywords: ['vessels', 'ships', 'fleet', 'charter', 'hire', 'laycan', 'dwt']
      },
      {
        id: 'page-procurement',
        title: 'Procurement Dashboard',
        subtitle: 'Steel plant raw material buffers, coking coal stock & consumption',
        category: 'PAGES',
        icon: <Package size={16} className="text-amber-500" />,
        badge: '/procurement',
        route: '/procurement',
        keywords: ['coal', 'coking', 'iron ore', 'inventory', 'stock', 'plants', 'sail', 'bhilai', 'rourkela', 'bokaro']
      },
      {
        id: 'page-contracts',
        title: 'Contracts & COA Management',
        subtitle: 'Contract of Affreightment (COA), Spot fixtures & CVC compliance',
        category: 'PAGES',
        icon: <Anchor size={16} className="text-indigo-500" />,
        badge: '/contracts',
        route: '/contracts',
        keywords: ['contracts', 'agreements', 'coa', 'fixture', 'charter party', 'bimco', 'cvc']
      },
      {
        id: 'page-cargo',
        title: 'Cargo Requirement Wizard',
        subtitle: '5-stage guided chartering & cargo procurement workflow with vessel feasibility',
        category: 'PAGES',
        icon: <Package size={16} className="text-blue-500" />,
        badge: '/cargo',
        route: '/cargo',
        keywords: ['cargo', 'requirement', 'wizard', 'shipment', 'chartering', 'draft', 'recommendation', 'parcel', 'volume', 'new cargo']
      },
      {
        id: 'page-ports',
        title: 'Port Intelligence',
        subtitle: 'Draft limits, berth waiting times & congestion at Indian/Global ports',
        category: 'PAGES',
        icon: <MapPin size={16} className="text-rose-500" />,
        badge: '/ports',
        route: '/ports',
        keywords: ['ports', 'berths', 'congestion', 'draft', 'tide', 'paradip', 'haldia', 'vizag', 'dhamra']
      },
      {
        id: 'page-risk',
        title: 'Risk Engine',
        subtitle: 'Bunker fuel volatility, demurrage exposure & geo-maritime hazards',
        category: 'PAGES',
        icon: <Shield size={16} className="text-red-500" />,
        badge: '/risk',
        route: '/risk',
        keywords: ['risk', 'demurrage', 'bunker', 'fuel', 'var', 'exposure', 'weather', 'geopolitical']
      },
      {
        id: 'page-scenarios',
        title: 'Scenario Center',
        subtitle: 'What-if simulations: Red Sea disruption, Australian cyclone, port strike',
        category: 'PAGES',
        icon: <GitBranch size={16} className="text-orange-500" />,
        badge: '/scenarios',
        route: '/scenarios',
        keywords: ['simulation', 'monte carlo', 'what if', 'disruption', 'cyclone', 'red sea', 'divert']
      },
      {
        id: 'page-copilot',
        title: 'AI Copilot MartinEx',
        subtitle: 'Autonomous role-aware maritime assistant with real-time tool grounding',
        category: 'PAGES',
        icon: <Bot size={16} className="text-violet-500" />,
        badge: '/copilot',
        route: '/copilot',
        keywords: ['copilot', 'martinex', 'assistant', 'chat', 'intelligence', 'gpt', 'llm']
      },
      {
        id: 'page-notifications',
        title: 'Notifications & Alerts',
        subtitle: 'Operational audit log, role alerts, critical demurrage dispatches',
        category: 'PAGES',
        icon: <Bell size={16} className="text-yellow-500" />,
        badge: '/notifications',
        route: '/notifications',
        keywords: ['alerts', 'notifications', 'bell', 'messages', 'critical', 'warnings']
      },
      {
        id: 'page-admin-users',
        title: 'User Management & RBAC',
        subtitle: 'Configured SAIL maritime personas, clearance levels & permissions',
        category: 'PAGES',
        icon: <Users size={16} className="text-blue-500" />,
        badge: '/admin/users',
        route: '/admin/users',
        keywords: ['admin', 'users', 'roles', 'permissions', 'rbac', 'officers', 'accounts']
      },
      {
        id: 'page-admin-audit',
        title: 'Enterprise Audit Trail & CVC Logs',
        subtitle: 'Immutable system event logs, operator actions & compliance verification',
        category: 'PAGES',
        icon: <Shield size={16} className="text-emerald-500" />,
        badge: '/admin/audit',
        route: '/admin/audit',
        keywords: ['admin', 'audit', 'logs', 'cvc', 'compliance', 'security', 'events']
      },
      {
        id: 'page-admin-jobs',
        title: 'Background Daemon Task Queue',
        subtitle: 'BullMQ asynchronous workers, AIS telemetry sync & forecast jobs',
        category: 'PAGES',
        icon: <Cpu size={16} className="text-amber-500" />,
        badge: '/admin/jobs',
        route: '/admin/jobs',
        keywords: ['admin', 'jobs', 'queue', 'bullmq', 'daemons', 'workers', 'background']
      },
      {
        id: 'page-admin-health',
        title: 'System Infrastructure Health',
        subtitle: 'API gateway latency, database cluster proxy & service status',
        category: 'PAGES',
        icon: <Activity size={16} className="text-rose-500" />,
        badge: '/admin/health',
        route: '/admin/health',
        keywords: ['admin', 'health', 'system', 'status', 'uptime', 'database', 'latency']
      },

      // ─── Vessels & Fleet ─────────────────────────────────────────────────────
      {
        id: 'vessel-steel-commander',
        title: 'MV Steel Commander',
        subtitle: 'Capesize • 182,000 DWT • En Route to Haldia (Gladstone load)',
        category: 'FLEET',
        icon: <Ship size={16} className="text-cyan-500" />,
        badge: 'CAPESIZE',
        badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
        route: '/chartering',
        keywords: ['vessel', 'cape', 'gladstone', 'haldia', 'coking coal']
      },
      {
        id: 'vessel-ocean-pioneer',
        title: 'MV Ocean Pioneer',
        subtitle: 'Panamax • 82,500 DWT • In Port at Paradip (Discharging)',
        category: 'FLEET',
        icon: <Ship size={16} className="text-blue-500" />,
        badge: 'PANAMAX',
        badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        route: '/chartering',
        keywords: ['vessel', 'panamax', 'paradip', 'discharging', 'thermal coal']
      },
      {
        id: 'vessel-bharat-shrestha',
        title: 'MV Bharat Shrestha',
        subtitle: 'Supramax • 58,000 DWT • Waiting for Berth at Visakhapatnam',
        category: 'FLEET',
        icon: <Ship size={16} className="text-amber-500" />,
        badge: 'SUPRAMAX',
        badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        route: '/chartering',
        keywords: ['vessel', 'supramax', 'vizag', 'waiting', 'limestone']
      },
      {
        id: 'vessel-bengal-glory',
        title: 'MV Bengal Glory',
        subtitle: 'Capesize • 175,000 DWT • Ballasting to Newcastle (ETA 3 Days)',
        category: 'FLEET',
        icon: <Ship size={16} className="text-cyan-500" />,
        badge: 'CAPESIZE',
        badgeColor: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
        route: '/chartering',
        keywords: ['vessel', 'cape', 'newcastle', 'ballasting']
      },
      {
        id: 'vessel-iron-victory',
        title: 'MV Iron Victory',
        subtitle: 'Capesize • 180,000 DWT • Completed Discharge at Dhamra',
        category: 'FLEET',
        icon: <Ship size={16} className="text-emerald-500" />,
        badge: 'CAPESIZE',
        badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        route: '/chartering',
        keywords: ['vessel', 'dhamra', 'available', 'spot candidate']
      },

      // ─── Ports & Terminals ───────────────────────────────────────────────────
      {
        id: 'port-paradip',
        title: 'Paradip Port (Odisha)',
        subtitle: 'Max Draft: 17.5m • 3 Capesize Berths • 2.4 days average waiting',
        category: 'PORTS',
        icon: <MapPin size={16} className="text-rose-500" />,
        badge: 'MAJOR HUB',
        badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        route: '/ports',
        keywords: ['port', 'odisha', 'capesize', 'rourkela feeder', 'coal berth']
      },
      {
        id: 'port-haldia',
        title: 'Haldia Dock Complex (West Bengal)',
        subtitle: 'Max Draft: 8.5m • Tidal lock gate entry • Feed to Durgapur/IISCO',
        category: 'PORTS',
        icon: <MapPin size={16} className="text-rose-500" />,
        badge: 'DOCK COMPLEX',
        badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        route: '/ports',
        keywords: ['port', 'haldia', 'bengal', 'durgapur', 'shallow draft', 'transshipment']
      },
      {
        id: 'port-vizag',
        title: 'Visakhapatnam Port (VPT)',
        subtitle: 'Max Draft: 18.5m • Outer Harbour iron ore & coking coal conveyor',
        category: 'PORTS',
        icon: <MapPin size={16} className="text-rose-500" />,
        badge: 'DEEP WATER',
        badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        route: '/ports',
        keywords: ['port', 'andhra', 'vizag', 'outer harbour', 'rinl', 'deep draft']
      },
      {
        id: 'port-dhamra',
        title: 'Dhamra Port (DPCL)',
        subtitle: 'Max Draft: 18.0m • Dedicated Cape coal berth • Quick discharge rate',
        category: 'PORTS',
        icon: <MapPin size={16} className="text-rose-500" />,
        badge: 'Cape Dedicated',
        badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800',
        route: '/ports',
        keywords: ['port', 'dhamra', 'adani', 'odisha', 'rapid discharge']
      },
      {
        id: 'port-gladstone',
        title: 'Gladstone (Queensland, Australia)',
        subtitle: 'World-scale coking coal export hub • Primary SAIL load port',
        category: 'PORTS',
        icon: <MapPin size={16} className="text-sky-500" />,
        badge: 'LOAD PORT',
        badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300 dark:border-sky-800',
        route: '/ports',
        keywords: ['port', 'australia', 'queensland', 'rg tanna', 'coking coal']
      },

      // ─── Contracts & Fixtures ────────────────────────────────────────────────
      {
        id: 'contract-coa-2026-sail',
        title: 'COA-2026-SAIL-01 (Contract of Affreightment)',
        subtitle: '1.8 MT Coking Coal • Gladstone → Paradip • Fixed Bunker Adjustment',
        category: 'CONTRACTS',
        icon: <FileText size={16} className="text-indigo-500" />,
        badge: 'ACTIVE COA',
        badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        route: '/contracts',
        keywords: ['contract', 'coa', 'gladstone', 'paradip', 'bhp', 'glencore']
      },
      {
        id: 'contract-spot-88',
        title: 'SPOT-FIX-2026-88 (Single Voyage Charter)',
        subtitle: 'Capesize Port Hedland → Dhamra • Spot Rate Benchmark Fixed',
        category: 'CONTRACTS',
        icon: <FileText size={16} className="text-indigo-500" />,
        badge: 'SPOT FIXTURE',
        badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        route: '/contracts',
        keywords: ['contract', 'spot', 'voyage', 'hedland', 'dhamra', 'iron ore']
      },
      {
        id: 'contract-coa-bhp',
        title: 'COA-2026-BHP-04 (BHP Billiton Annual)',
        subtitle: 'Annual Prime Hard Coking Coal supply agreement with escalation clauses',
        category: 'CONTRACTS',
        icon: <FileText size={16} className="text-indigo-500" />,
        badge: 'STRATEGIC COA',
        badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300 dark:border-purple-800',
        route: '/contracts',
        keywords: ['contract', 'bhp', 'annual', 'coking coal', 'saraji']
      },

      // ─── Cargo & Commodities ────────────────────────────────────────────────
      {
        id: 'cargo-hcc',
        title: '🔥 Hard Coking Coal (HCC)',
        subtitle: 'Prime blast furnace metallurgy grade (Australia/USA) • Benchmark ~$258.50/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-amber-500" />,
        badge: 'CRITICAL FEED',
        badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        route: '/cargo',
        keywords: ['coal', 'coking', 'phcc', 'hcc', 'blast furnace', 'australia', 'platts', 'raw material']
      },
      {
        id: 'cargo-sscc',
        title: '🏗️ Semi-Soft Coking Coal (SSCC)',
        subtitle: 'Carbon blendstock & fluidity improver (Newcastle/Tabang) • Benchmark ~$214.00/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-amber-600" />,
        badge: 'BLENDSTOCK',
        badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        route: '/cargo',
        keywords: ['sscc', 'semi-soft', 'coking', 'coal', 'argus', 'fluidity']
      },
      {
        id: 'cargo-pci',
        title: '💨 PCI Coal (Pulverized Injection)',
        subtitle: 'Direct tuyere blast injection fuel for coke replacement • Benchmark ~$188.50/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-blue-500" />,
        badge: 'INJECTION FUEL',
        badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        route: '/cargo',
        keywords: ['pci', 'pulverized', 'low vol', 'blast furnace', 'tuyere']
      },
      {
        id: 'cargo-thermal',
        title: '⚡ Thermal Coal (Non-Coking)',
        subtitle: 'Captive power generation & plant steam boilers • Benchmark ~$122.00/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-yellow-500" />,
        badge: 'POWER / UTILITY',
        badgeColor: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/70 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800',
        route: '/cargo',
        keywords: ['thermal coal', 'steam coal', 'power plant', 'boilers', 'newcastle']
      },
      {
        id: 'cargo-iron-fines',
        title: '⛏️ Iron Ore Fines (Fe 62-65%)',
        subtitle: 'High-density sinter plant feedstock (Port Hedland / Tubarao) • Benchmark ~$112.50/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-orange-500" />,
        badge: 'SINTER FEED',
        badgeColor: 'bg-orange-50 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 border-orange-300 dark:border-orange-800',
        route: '/cargo',
        keywords: ['iron ore', 'fines', 'fe 62', 'sinter plant', 'iodex', 'fastmarkets']
      },
      {
        id: 'cargo-iron-pellets',
        title: '🔵 Iron Ore Pellets (Fe 65%+)',
        subtitle: 'Direct reduction & blast furnace burden (Bahrain / Oman) • Benchmark ~$138.00/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-blue-600" />,
        badge: 'DRI / BF BURDEN',
        badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        route: '/cargo',
        keywords: ['pellets', 'iron ore pellets', 'fe 65', 'direct reduction', 'mysteel']
      },
      {
        id: 'cargo-met-coke',
        title: '🧱 Metallurgical Coke (Met Coke)',
        subtitle: 'High-CSR processed carbon solid fuel (China / Poland) • Benchmark ~$325.00/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-zinc-600 dark:text-zinc-400" />,
        badge: 'HIGH-CSR COKE',
        badgeColor: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700',
        route: '/cargo',
        keywords: ['met coke', 'metallurgical coke', 'csr 65', 'blast furnace fuel']
      },
      {
        id: 'cargo-limestone',
        title: '⚪ Limestone (BF / SMS Grade)',
        subtitle: 'Essential desulfurizing flux & slag former (UAE / Oman) • Benchmark ~$32.50/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-slate-500" />,
        badge: 'FLUX AGENT',
        badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        route: '/cargo',
        keywords: ['limestone', 'sms grade', 'flux', 'slag former', 'fujairah', 'desulfurizing']
      },
      {
        id: 'cargo-dolomite',
        title: '🪨 Dolomite (Calcined / Raw)',
        subtitle: 'High-MgO refractory & flux agent (Bhutan / Oman) • Benchmark ~$36.00/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-stone-500" />,
        badge: 'REFRACTORY FLUX',
        badgeColor: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-300 dark:border-stone-700',
        route: '/cargo',
        keywords: ['dolomite', 'calcined', 'high-mgo', 'refractory', 'bhutan', 'flux']
      },
      {
        id: 'cargo-manganese',
        title: '⚙️ Manganese Ore (Fe-Mn)',
        subtitle: 'Silicomanganese & ferro-alloy production (South Africa / Gabon) • Benchmark ~$195.00/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-indigo-500" />,
        badge: 'FERRO ALLOY',
        badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
        route: '/cargo',
        keywords: ['manganese', 'fe-mn', 'silicomanganese', 'alloy', 'ore 44']
      },
      {
        id: 'cargo-anthracite',
        title: '⚫ Anthracite Coal',
        subtitle: 'Ultra-low volatile recarburizer & carbon raiser • Benchmark ~$248.00/MT',
        category: 'CARGO',
        icon: <Package size={16} className="text-neutral-700 dark:text-neutral-300" />,
        badge: 'CARBON RAISER',
        badgeColor: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700',
        route: '/cargo',
        keywords: ['anthracite', 'recarburizer', 'carbon raiser', 'ultra-low volatile']
      },

      // ─── Executive Quick Actions ────────────────────────────────────────────
      {
        id: 'action-new-cargo',
        title: 'Launch New Cargo Requirement Wizard',
        subtitle: 'Configure shipment parcel, validate port constraints & generate chartering options',
        category: 'ACTIONS',
        icon: <Package size={16} className="text-blue-500" />,
        badge: 'WORKFLOW',
        action: () => {
          navigate('/cargo');
        },
        keywords: ['new cargo', 'requirement', 'wizard', 'chartering', 'parcel', 'create shipment']
      },
      {
        id: 'action-curr-inr',
        title: 'Switch Currency to Indian Rupees (₹ INR)',
        subtitle: 'Set platform-wide valuation to ₹ INR across all 15 operational modules',
        category: 'ACTIONS',
        icon: <DollarSign size={16} className="text-emerald-500" />,
        badge: 'CURRENCY',
        action: () => {
          setCurrency('INR');
          notificationApi.create({
            title: 'Platform Currency Switched to ₹ INR',
            message: 'All freight valuations, voyage estimates, and contract values now displayed in Indian Rupees.',
            role: 'ALL',
            severity: 'INFO',
            category: 'SYSTEM'
          });
        },
        keywords: ['inr', 'rupees', 'rs', 'currency', 'money', 'convert']
      },
      {
        id: 'action-curr-usd',
        title: 'Switch Currency to US Dollars ($ USD)',
        subtitle: 'Set platform-wide valuation to $ USD for global freight standard benchmark',
        category: 'ACTIONS',
        icon: <DollarSign size={16} className="text-blue-500" />,
        badge: 'CURRENCY',
        action: () => {
          setCurrency('USD');
          notificationApi.create({
            title: 'Platform Currency Switched to $ USD',
            message: 'All freight valuations and maritime fixtures now displayed in US Dollars.',
            role: 'ALL',
            severity: 'INFO',
            category: 'SYSTEM'
          });
        },
        keywords: ['usd', 'dollar', 'currency', 'money', 'convert']
      },
      {
        id: 'action-theme-toggle',
        title: `Switch to ${theme === 'light' ? 'Dark Operations Mode' : 'Light Enterprise Mode'}`,
        subtitle: `Currently in ${theme === 'light' ? 'Light' : 'Dark'} mode — toggle platform aesthetic`,
        category: 'ACTIONS',
        icon: theme === 'light' ? <Moon size={16} className="text-indigo-500" /> : <Sun size={16} className="text-amber-500" />,
        badge: 'THEME',
        action: () => toggleTheme(),
        keywords: ['theme', 'dark', 'light', 'mode', 'color', 'night']
      },
      {
        id: 'action-role-mandate',
        title: `Role Mandate: ${(user?.roles?.[0] || 'CHARTERING_MANAGER').replace(/_/g, ' ')}`,
        subtitle: 'Profile role credentials locked. Role reassignment requires Central Administration clearance.',
        category: 'ACTIONS',
        icon: <Shield size={16} className="text-blue-500" />,
        badge: 'SECURITY',
        keywords: ['role', 'mandate', 'permission', 'security', 'profile']
      },
      {
        id: 'action-ask-copilot',
        title: 'Ask AI Copilot MartinEx',
        subtitle: 'Initiate role-grounded maritime query in Copilot with full database context',
        category: 'ACTIONS',
        icon: <Sparkles size={16} className="text-violet-500" />,
        badge: 'AI COPILOT',
        route: '/copilot',
        keywords: ['copilot', 'ai', 'martinex', 'ask', 'help', 'question']
      }
    ];

    // Merge live dynamic vessels if available
    liveVessels.forEach((v) => {
      const vName = v.name || v.vesselName;
      if (vName && !items.some((i) => i.title.toLowerCase().includes(vName.toLowerCase()))) {
        items.push({
          id: `live-vessel-${v.id || vName}`,
          title: vName,
          subtitle: `${v.vesselClass || 'Vessel'} • ${v.dwt ? `${v.dwt.toLocaleString()} DWT` : ''} • Status: ${v.status || 'Active'}`,
          category: 'FLEET',
          icon: <Ship size={16} className="text-cyan-500" />,
          badge: v.vesselClass || 'FLEET',
          route: '/chartering',
          keywords: [vName, v.status, v.flag, 'vessel', 'fleet']
        });
      }
    });

    // Merge live dynamic ports if available
    livePorts.forEach((p) => {
      const pName = p.name || p.portName;
      if (pName && !items.some((i) => i.title.toLowerCase().includes(pName.toLowerCase()))) {
        items.push({
          id: `live-port-${p.id || pName}`,
          title: `${pName} (${p.country || 'India'})`,
          subtitle: `Max Draft: ${p.maxDraft ? `${p.maxDraft}m` : 'Deep water'} • Waiting: ${p.averageWaitDays || '1.8'} days`,
          category: 'PORTS',
          icon: <MapPin size={16} className="text-rose-500" />,
          badge: 'PORT',
          route: '/ports',
          keywords: [pName, p.country, 'port', 'berth']
        });
      }
    });

    // Merge live dynamic contracts if available
    liveContracts.forEach((c) => {
      const cRef = c.contractNumber || c.reference || c.title;
      if (cRef && !items.some((i) => i.title.toLowerCase().includes(cRef.toLowerCase()))) {
        items.push({
          id: `live-contract-${c.id || cRef}`,
          title: cRef,
          subtitle: `${c.contractType || 'COA'} • Quantity: ${c.quantity ? `${c.quantity.toLocaleString()} MT` : ''} • Status: ${c.status || 'ACTIVE'}`,
          category: 'CONTRACTS',
          icon: <FileText size={16} className="text-indigo-500" />,
          badge: c.status || 'CONTRACT',
          route: '/contracts',
          keywords: [cRef, c.contractType, 'contract', 'fixture']
        });
      }
    });

    return items;
  }, [liveVessels, livePorts, liveContracts, theme, setCurrency, toggleTheme, user]);

  // Filtered items based on query & category
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();

    return catalog.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Query match
      if (!q) return true;

      const titleMatch = item.title.toLowerCase().includes(q);
      const subMatch = item.subtitle.toLowerCase().includes(q);
      const badgeMatch = item.badge?.toLowerCase().includes(q);
      const kwMatch = item.keywords?.some((k) => k.toLowerCase().includes(q));

      return titleMatch || subMatch || badgeMatch || kwMatch;
    });
  }, [catalog, query, selectedCategory]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Handle item execution
  const executeItem = (item: SearchItem) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigate(item.route);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex]);
      } else if (query.trim()) {
        // Fallback: navigate to Copilot with this question
        onClose();
        navigate(`/copilot?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!shouldRender) return null;

  const categories: { id: SearchCategory; label: string }[] = [
    { id: 'ALL', label: 'All Results' },
    { id: 'PAGES', label: 'Modules' },
    { id: 'FLEET', label: 'Fleet & Vessels' },
    { id: 'PORTS', label: 'Ports' },
    { id: 'CONTRACTS', label: 'Contracts' },
    { id: 'CARGO', label: 'Commodities' },
    { id: 'ACTIONS', label: 'Quick Actions' }
  ];

  const popularTags = [
    'Capesize',
    'Paradip Port',
    'Coking Coal',
    'BDI Index',
    'Decision Center',
    'INR Currency',
    'Demurrage'
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center pt-14 md:pt-20 px-4 bg-slate-950/70 backdrop-blur-md transition-all ${backdropClass}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all ${animClass}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search size={18} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vessels, ports, fixtures, raw materials, or execute actions..."
            className="flex-1 bg-transparent text-sm md:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Category Pills Header */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                selectedCategory === cat.id
                  ? 'bg-blue-600 dark:bg-sky-500 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quick Suggestion Chips (when query is short or empty) */}
        {!query && (
          <div className="flex flex-col border-b border-slate-100 dark:border-slate-800/60 divide-y divide-slate-100 dark:divide-slate-800/40">
            {recentHistory.length > 0 && (
              <div className="px-4 py-2 bg-slate-50/90 dark:bg-slate-950/60 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                  <History size={11} />
                  Recent:
                </span>
                {recentHistory.slice(0, 5).map((h) => (
                  <button
                    key={h.path}
                    onClick={() => {
                      onClose();
                      navigate(h.path);
                    }}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 text-[11px] font-medium transition-colors cursor-pointer flex-shrink-0"
                  >
                    {h.label || h.path}
                  </button>
                ))}
              </div>
            )}
            <div className="px-4 py-2 bg-slate-50/70 dark:bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex-shrink-0">
                Popular:
              </span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-sky-500 hover:text-blue-600 dark:hover:text-sky-400 text-[11px] font-medium transition-colors cursor-pointer flex-shrink-0"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[220px] max-h-[420px] divide-y divide-slate-100 dark:divide-slate-800/50"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <Search size={22} />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No platform results found for "{query}"
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Try searching for a vessel class like Capesize, an Indian port like Paradip, or a contract fixture.
              </p>
              <button
                onClick={() => {
                  onClose();
                  navigate(`/copilot?q=${encodeURIComponent(query.trim())}`);
                }}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles size={14} />
                Ask AI Copilot MartinEx about "{query}"
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-selected={isSelected}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.985]',
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-slate-800 text-slate-900 dark:text-white ring-1 ring-blue-500/30 dark:ring-sky-500/30 shadow-2xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-850/60 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors border',
                        isSelected
                          ? 'bg-white dark:bg-slate-700 border-blue-200 dark:border-slate-600 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      )}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm font-semibold truncate text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              'text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider',
                              item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 dark:text-sky-400 font-bold bg-blue-100/80 dark:bg-sky-950/80 px-1.5 py-0.5 rounded">
                        <span>Select</span>
                        <CornerDownLeft size={10} />
                      </span>
                    )}
                    <ArrowRight
                      size={14}
                      className={cn(
                        'transition-transform',
                        isSelected
                          ? 'text-blue-600 dark:text-sky-400 translate-x-0.5'
                          : 'text-slate-300 dark:text-slate-600'
                      )}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↑↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ↵
              </kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                ESC
              </kbd>
              <span>Close</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <Command size={12} />
            <span className="font-semibold text-slate-600 dark:text-slate-300">JAL TARANG</span>
            <span>Platform Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};
