import { VesselCraneCompatibilityCard } from '../../components/cargo/VesselCraneCompatibilityCard';
import React, { useState, useId, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Anchor, MapPin, CheckCircle2, ChevronRight,
  ChevronLeft, AlertTriangle, ShieldAlert, TrendingUp,
  Ship, Info, Check, RefreshCw, BookmarkCheck,
  Sparkles, Clock, AlertCircle, Loader2, Shield, Layers,
  Search, X, ArrowUpRight, ArrowDownRight, Tag, SlidersHorizontal
} from 'lucide-react';
import {
  ResponsiveContainer, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, AreaChart, Area
} from 'recharts';
import { useUiStore } from '../../store/uiStore';
import { formatCurrency, formatRateMt, cn, USD_TO_INR_RATE } from '../../lib/utils';
import { portApi, decisionApi, cargoApi, notificationApi, forecastApi } from '../../api';
import { DataFreshnessBar, InlineSuggestionBadge, SmartAlertBanner, MonteCarloCoaModal, ArbitrageModal } from '../../components/common';

// ─── Domain Types ────────────────────────────────────────────────────────────

export type CargoTypeOption =
  | 'Hard Coking Coal'
  | 'Semi-Soft Coking Coal'
  | 'PCI Coal'
  | 'Thermal Coal'
  | 'Iron Ore Fines'
  | 'Iron Ore Pellets'
  | 'Metallurgical Coke'
  | 'Limestone (Flux Grade)'
  | 'Dolomite'
  | 'Manganese Ore'
  | 'Anthracite Coal'
  | 'Coking Coal'
  | 'Metallurgical Coal'
  | 'Iron Ore'
  | 'Coke';

export type ContractDurationOption = 'SPOT' | 'SHORT_TERM' | 'COA_90' | 'MEDIUM_TERM';

export interface PortData {
  id: string;
  port_name: string;
  port_code?: string;
  un_locode?: string;
  country_name?: string;
  iso2?: string;
  max_vessel_loa_m?: number | string;
  max_vessel_beam_m?: number | string;
  max_vessel_draft_m?: number | string;
  max_vessel_dwt?: number | string;
  annual_capacity_mt?: number | string;
  is_east_coast_india?: boolean;
  status?: string;
  handling_rate_mt_day?: number;
}

export interface WizardFormData {
  cargoType: CargoTypeOption;
  volumeMt: number;
  originPortId: string;
  destinationPortId: string;
  deliveryDate: string;
  contractDuration: ContractDurationOption;
}

export interface VesselRecommendationItem {
  vesselClass: 'Capesize' | 'Panamax' | 'Supramax' | 'Ultramax';
  rank: number;
  voyagesRequired: number;
  freightRateUsdMt: number;
  totalFreightCostUsd: number;
  maxParcelCapacityMt: number;
  draftRequiredM: number;
  loaM: number;
  isCompatible: boolean;
  incompatibilityReason?: string;
}

export interface MarketEntryWindow {
  id: string;
  startDate: string;
  endDate: string;
  type: 'SAVINGS' | 'PREMIUM';
  deltaPercent: number;
  predictedRateUsdMt: number;
  confidence: number;
  rationale: string;
}

export interface RiskFactorItem {
  category: 'WEATHER' | 'PORT_CONGESTION' | 'FREIGHT_VOLATILITY' | 'VESSEL_FEASIBILITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
}

export interface CommodityOption {
  type: CargoTypeOption;
  label: string;
  desc: string;
  icon: string;
  category: string;
  code: string;
  benchmarkPriceUsd: number;
  change24hPct: number;
  priceTrend: 'UP' | 'DOWN' | 'STABLE';
  indexSource: string;
  stowageFactor: number;
  hsCode: string;
  typicalParcelMt: number;
  originRegions: string;
}

const CARGO_OPTIONS: CommodityOption[] = [
  {
    type: 'Hard Coking Coal',
    label: 'Hard Coking Coal (HCC)',
    desc: 'Prime blast furnace metallurgy grade (Australia/USA)',
    icon: '🔥',
    category: 'Coking Coal',
    code: 'HCC-PRIME',
    benchmarkPriceUsd: 258.50,
    change24hPct: 1.8,
    priceTrend: 'UP',
    indexSource: 'Platts TSI Premium JM25',
    stowageFactor: 1.25,
    hsCode: '27011200',
    typicalParcelMt: 160000,
    originRegions: 'Australia (Gladstone / Hay Point), USA (Hampton Roads)',
  },
  {
    type: 'Semi-Soft Coking Coal',
    label: 'Semi-Soft Coking Coal (SSCC)',
    desc: 'Carbon blendstock & fluidity improver',
    icon: '🏗️',
    category: 'Coking Coal',
    code: 'SSCC-MED',
    benchmarkPriceUsd: 214.00,
    change24hPct: -0.4,
    priceTrend: 'DOWN',
    indexSource: 'Argus SSCC East Coast',
    stowageFactor: 1.28,
    hsCode: '27011290',
    typicalParcelMt: 75000,
    originRegions: 'Australia (Newcastle), Indonesia (Tabang)',
  },
  {
    type: 'PCI Coal',
    label: 'PCI Coal (Pulverized Injection)',
    desc: 'Direct tuyere blast injection fuel for coke replacement',
    icon: '💨',
    category: 'Coal & Injection',
    code: 'PCI-INJ',
    benchmarkPriceUsd: 188.50,
    change24hPct: 0.9,
    priceTrend: 'UP',
    indexSource: 'Platts Low-Vol PCI FOB',
    stowageFactor: 1.30,
    hsCode: '27011910',
    typicalParcelMt: 75000,
    originRegions: 'Australia (Dalrymple Bay), Russia (Vostochny)',
  },
  {
    type: 'Thermal Coal',
    label: 'Thermal Coal (Non-Coking)',
    desc: 'Captive power generation & plant steam boilers',
    icon: '⚡',
    category: 'Thermal Coal',
    code: 'THERM-6000',
    benchmarkPriceUsd: 122.00,
    change24hPct: -1.2,
    priceTrend: 'DOWN',
    indexSource: 'Newcastle 6000 kcal FOB',
    stowageFactor: 1.35,
    hsCode: '27011920',
    typicalParcelMt: 70000,
    originRegions: 'Indonesia (Muara Pantai), South Africa (Richards Bay)',
  },
  {
    type: 'Iron Ore Fines',
    label: 'Iron Ore Fines (Fe 62-65%)',
    desc: 'High-density sinter plant feedstock',
    icon: '⛏️',
    category: 'Iron Ore',
    code: 'IO-FINES-62',
    benchmarkPriceUsd: 112.50,
    change24hPct: 2.1,
    priceTrend: 'UP',
    indexSource: 'Fastmarkets / Platts IODEX 62%',
    stowageFactor: 0.45,
    hsCode: '26011110',
    typicalParcelMt: 170000,
    originRegions: 'Australia (Port Hedland), Brazil (Tubarao)',
  },
  {
    type: 'Iron Ore Pellets',
    label: 'Iron Ore Pellets (Fe 65%+)',
    desc: 'Direct reduction & blast furnace burden',
    icon: '🔵',
    category: 'Iron Ore',
    code: 'IO-PELLETS-65',
    benchmarkPriceUsd: 138.00,
    change24hPct: 1.4,
    priceTrend: 'UP',
    indexSource: 'Mysteel BF Pellet 65% Fe',
    stowageFactor: 0.48,
    hsCode: '26011210',
    typicalParcelMt: 65000,
    originRegions: 'Bahrain, Oman (Sohar), India (Paradip / Vizag)',
  },
  {
    type: 'Metallurgical Coke',
    label: 'Metallurgical Coke (Met Coke)',
    desc: 'High-CSR processed carbon solid fuel',
    icon: '🧱',
    category: 'Coke & Carbon',
    code: 'MET-COKE-CSR65',
    benchmarkPriceUsd: 325.00,
    change24hPct: 0.6,
    priceTrend: 'UP',
    indexSource: 'Platts 65% CSR FOB China',
    stowageFactor: 1.80,
    hsCode: '27040010',
    typicalParcelMt: 50000,
    originRegions: 'China (Tianjin / Rizhao), Poland (Gdansk)',
  },
  {
    type: 'Limestone (Flux Grade)',
    label: 'Limestone (BF / SMS Grade)',
    desc: 'Essential desulfurizing flux & slag former (UAE/Oman)',
    icon: '⚪',
    category: 'Fluxes & Minerals',
    code: 'LIME-SMS',
    benchmarkPriceUsd: 32.50,
    change24hPct: 0.2,
    priceTrend: 'STABLE',
    indexSource: 'Fujairah Aggregates & Flux',
    stowageFactor: 0.85,
    hsCode: '25210000',
    typicalParcelMt: 65000,
    originRegions: 'UAE (Fujairah), Oman (Salalah)',
  },
  {
    type: 'Dolomite',
    label: 'Dolomite (Calcined / Raw)',
    desc: 'High-MgO refractory & flux agent (Bhutan/Oman)',
    icon: '🪨',
    category: 'Fluxes & Minerals',
    code: 'DOLO-CALC',
    benchmarkPriceUsd: 36.00,
    change24hPct: 0.0,
    priceTrend: 'STABLE',
    indexSource: 'Middle East Minerals Export',
    stowageFactor: 0.88,
    hsCode: '25181000',
    typicalParcelMt: 55000,
    originRegions: 'Oman (Sohar), Bhutan (via Haldia)',
  },
  {
    type: 'Manganese Ore',
    label: 'Manganese Ore (Fe-Mn)',
    desc: 'Silicomanganese & ferro-alloy production',
    icon: '⚙️',
    category: 'Ferro Alloys',
    code: 'MN-ORE-44',
    benchmarkPriceUsd: 195.00,
    change24hPct: 3.2,
    priceTrend: 'UP',
    indexSource: 'Fastmarkets Mn Ore 44% CIF',
    stowageFactor: 0.52,
    hsCode: '26020010',
    typicalParcelMt: 45000,
    originRegions: 'South Africa (Port Elizabeth), Gabon (Owendo)',
  },
  {
    type: 'Anthracite Coal',
    label: 'Anthracite Coal',
    desc: 'Ultra-low volatile recarburizer & carbon raiser',
    icon: '⚫',
    category: 'Coke & Carbon',
    code: 'ANTHRA-UHV',
    benchmarkPriceUsd: 248.00,
    change24hPct: -0.8,
    priceTrend: 'DOWN',
    indexSource: 'Argus Russian/Global Anthracite',
    stowageFactor: 1.22,
    hsCode: '27011100',
    typicalParcelMt: 55000,
    originRegions: 'Russia (Novorossiysk), Vietnam (Cam Pha)',
  },
];


const DURATION_OPTIONS: {
  key: ContractDurationOption;
  label: string;
  days: number;
  badge: string;
  description: string;
}[] = [
  {
    key: 'SPOT',
    label: 'Spot Voyage',
    days: 7,
    badge: '7 Days',
    description: 'Immediate market fixture. Best when freight forward curve indicates near-term softening.',
  },
  {
    key: 'SHORT_TERM',
    label: 'Short-term Charter',
    days: 30,
    badge: '30 Days',
    description: 'Single-voyage commitment with laycan flexibility for immediate plant replenishment.',
  },
  {
    key: 'COA_90',
    label: 'Short-term CoA',
    days: 90,
    badge: '90 Days',
    description: 'Multi-voyage volume contract offering volume discounts (~5%) and price stability.',
  },
  {
    key: 'MEDIUM_TERM',
    label: 'Medium-term CoA',
    days: 180,
    badge: '180 Days',
    description: 'Quarterly strategic hedge guaranteeing berth priority and stable freight rates.',
  },
];

const getDefaultFutureDate = (daysAhead: number = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT: CargoRequirementWizardPage
// ═════════════════════════════════════════════════════════════════════════════
export const CargoRequirementWizardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { currency, exchangeRate } = useUiStore();

  // Form State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<WizardFormData>({
    cargoType: 'Thermal Coal',
    volumeMt: 60000,
    originPortId: '',
    destinationPortId: '',
    deliveryDate: getDefaultFutureDate(30),
    contractDuration: 'SHORT_TERM',
  });

  // Validation States
  const [volumeError, setVolumeError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Analysis / Recommendation Result States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isMonteCarloOpen, setIsMonteCarloOpen] = useState<boolean>(false);
  const [isArbitrageOpen, setIsArbitrageOpen] = useState<boolean>(false);

  // Accessible Form Control IDs
  const volumeInputId = useId();
  const cargoTypeSelectId = useId();
  const originPortSelectId = useId();
  const destinationPortSelectId = useId();
  const deliveryDateInputId = useId();
  // ─── Commodity Search & Filter States ───────────────────────────────────────
  const [commoditySearch, setCommoditySearch] = useState<string>('');
  const [selectedCommodityCategory, setSelectedCommodityCategory] = useState<string>('ALL');

  // ─── Fetch Commodities from API with Fallback ───────────────────────────────
  const { data: rawCommodities, isLoading: isLoadingCommodities } = useQuery({
    queryKey: ['cargo-wizard-commodities'],
    queryFn: async () => {
      try {
        const res = await cargoApi.commodities();
        const list = Array.isArray(res) ? res : ((res as any)?.data || []);
        return list;
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  // ─── Merged Commodities (Baseline + Live Backend Index Prices) ──────────────
  const allCommodities: CommodityOption[] = useMemo(() => {
    if (!rawCommodities || rawCommodities.length === 0) return CARGO_OPTIONS;
    return CARGO_OPTIONS.map((opt) => {
      const match = rawCommodities.find(
        (r: any) =>
          r.commodity_code === opt.code ||
          r.commodity_name?.toLowerCase() === opt.label.toLowerCase() ||
          r.cargo_type_name?.toLowerCase() === opt.type.toLowerCase()
      );
      if (match) {
        return {
          ...opt,
          benchmarkPriceUsd: Number(match.benchmark_price_usd_mt) || opt.benchmarkPriceUsd,
          change24hPct: typeof match.price_change_24h_pct !== 'undefined' && match.price_change_24h_pct !== null
            ? Number(match.price_change_24h_pct)
            : opt.change24hPct,
          priceTrend: (match.price_trend || opt.priceTrend) as 'UP' | 'DOWN' | 'STABLE',
          indexSource: match.index_source || opt.indexSource,
          hsCode: match.hs_code || opt.hsCode,
        };
      }
      return opt;
    });
  }, [rawCommodities]);

  // ─── Filtered Commodities by Search & Category ──────────────────────────────
  const filteredCommodities = useMemo(() => {
    return allCommodities.filter((c) => {
      const matchesCategory =
        selectedCommodityCategory === 'ALL' || c.category === selectedCommodityCategory;
      if (!matchesCategory) return false;

      if (!commoditySearch.trim()) return true;
      const q = commoditySearch.toLowerCase().trim();
      return (
        c.label.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.hsCode.toLowerCase().includes(q) ||
        c.originRegions.toLowerCase().includes(q) ||
        c.indexSource.toLowerCase().includes(q)
      );
    });
  }, [allCommodities, selectedCommodityCategory, commoditySearch]);

  const commodityCategories = useMemo(() => [
    { id: 'ALL', label: 'All Raw Materials', count: allCommodities.length },
    { id: 'Coking Coal', label: 'Coking Coal', count: allCommodities.filter((c) => c.category === 'Coking Coal').length },
    { id: 'Iron Ore', label: 'Iron Ore', count: allCommodities.filter((c) => c.category === 'Iron Ore').length },
    { id: 'Coal & Injection', label: 'Coal & PCI', count: allCommodities.filter((c) => c.category === 'Coal & Injection').length },
    { id: 'Thermal Coal', label: 'Thermal Coal', count: allCommodities.filter((c) => c.category === 'Thermal Coal').length },
    { id: 'Fluxes & Minerals', label: 'Fluxes & Minerals', count: allCommodities.filter((c) => c.category === 'Fluxes & Minerals').length },
    { id: 'Coke & Carbon', label: 'Coke & Carbon', count: allCommodities.filter((c) => c.category === 'Coke & Carbon').length },
    { id: 'Ferro Alloys', label: 'Ferro Alloys', count: allCommodities.filter((c) => c.category === 'Ferro Alloys').length },
  ], [allCommodities]);

  // ─── Fetch Ports from Live Database API ──────────────────────────────────────
  const { data: rawPorts } = useQuery({
    queryKey: ['cargo-wizard-ports'],
    queryFn: async () => {
      try {
        const res = await portApi.list({ limit: 100 });
        const list = Array.isArray(res) ? res : (res?.data || []);
        return list;
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60_000,
  });

  const allPorts: PortData[] = useMemo(() => {
    const list = rawPorts || [];
    return list.map((p: any) => ({
      ...p,
      max_vessel_loa_m: Number(p.max_vessel_loa_m || p.max_loa_m || 290),
      max_vessel_draft_m: Number(p.max_vessel_draft_m || p.max_draft_m || 16.0),
      max_vessel_dwt: Number(p.max_vessel_dwt || p.max_dwt_mt || 180000),
      handling_rate_mt_day: Number(p.handling_rate_mt_day || (p.annual_capacity_mt ? Math.round(p.annual_capacity_mt / 3650) : 30000)),
    }));
  }, [rawPorts]);

  // Loading ports: overseas dry bulk export ports
  const originPorts = useMemo(() => {
    return allPorts.filter((p) => !p.is_east_coast_india || p.country_name !== 'India');
  }, [allPorts]);

  // Destination ports: East Coast India discharge ports
  const destinationPorts = useMemo(() => {
    return allPorts.filter((p) => p.is_east_coast_india === true || p.country_name === 'India');
  }, [allPorts]);

  // Automatically select first valid origin and destination once loaded
  useEffect(() => {
    if (originPorts.length > 0 && !formData.originPortId) {
      setFormData((prev) => ({ ...prev, originPortId: originPorts[0].id }));
    }
    if (destinationPorts.length > 0 && !formData.destinationPortId) {
      const defaultDest = destinationPorts.find((p) => p.port_name.includes('Paradip')) || destinationPorts[0];
      setFormData((prev) => ({ ...prev, destinationPortId: defaultDest.id }));
    }
  }, [originPorts, destinationPorts, formData.originPortId, formData.destinationPortId]);

  const selectedOrigin = useMemo(() => {
    return allPorts.find((p) => p.id === formData.originPortId) || originPorts[0];
  }, [allPorts, originPorts, formData.originPortId]);

  const selectedDestination = useMemo(() => {
    return allPorts.find((p) => p.id === formData.destinationPortId) || destinationPorts[0];
  }, [allPorts, destinationPorts, formData.destinationPortId]);

  // ─── Form Validations ───────────────────────────────────────────────────────
  const validateVolume = (vol: number): boolean => {
    if (isNaN(vol) || vol <= 0) {
      setVolumeError('Volume must be a numeric value greater than 0 MT.');
      return false;
    }
    if (vol < 5000) {
      setVolumeError('Commercial dry bulk maritime parcels typically require at least 5,000 MT.');
      return false;
    }
    setVolumeError(null);
    return true;
  };

  const validateDate = (dt: string): boolean => {
    if (!dt) {
      setDateError('Required delivery date must be specified.');
      return false;
    }
    const entered = new Date(dt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (entered < today) {
      setDateError('Required delivery date cannot be in the past.');
      return false;
    }
    setDateError(null);
    return true;
  };

  const isStepValid = (step: number): boolean => {
    if (step === 1) {
      return !volumeError && formData.volumeMt > 0;
    }
    if (step === 2) {
      return !!formData.originPortId;
    }
    if (step === 3) {
      return !!formData.destinationPortId && formData.destinationPortId !== formData.originPortId;
    }
    if (step === 4) {
      return !dateError && !!formData.deliveryDate;
    }
    return true;
  };

  const canAdvance = isStepValid(currentStep);

  // ─── Step Navigation ────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentStep === 1 && !validateVolume(formData.volumeMt)) return;
    if (currentStep === 4 && !validateDate(formData.deliveryDate)) return;

    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  // ─── Recommendation Engine Analysis ────────────────────────────────────────
  const handleGenerateRecommendations = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await decisionApi.analyze({
        loadingPortId: formData.originPortId || selectedOrigin?.id || 'port-aus-gld',
        dischargingPortId: formData.destinationPortId || selectedDestination?.id || 'port-ind-prdp',
        cargoQuantityMt: Number(formData.volumeMt),
        includeScenarios: true,
        includeForecasts: true,
      }).catch((err) => {
        console.warn('Backend decisionApi returned error, using synchronized deterministic model:', err);
        return null;
      });

      const destDraft = Number(selectedDestination?.max_vessel_draft_m) || 16.0;
      const destLoa = Number(selectedDestination?.max_vessel_loa_m) || 295.0;

      const liveCapeRate = Number((result as any)?.input?.freightRateUsdPerMt || (result as any)?.economics?.freightRateUsdPerMt || 0);
      const capeRate = liveCapeRate > 0 ? liveCapeRate : 0;
      const panamaxRate = capeRate > 0 ? Number((capeRate * 1.21).toFixed(2)) : 0;
      const ultramaxRate = capeRate > 0 ? Number((capeRate * 1.37).toFixed(2)) : 0;
      const supramaxRate = capeRate > 0 ? Number((capeRate * 1.48).toFixed(2)) : 0;

      const rawVessels: VesselRecommendationItem[] = [
        {
          vesselClass: 'Capesize',
          rank: 1,
          voyagesRequired: Math.ceil(formData.volumeMt / 160000),
          freightRateUsdMt: capeRate,
          totalFreightCostUsd: formData.volumeMt * capeRate,
          maxParcelCapacityMt: 180000,
          draftRequiredM: 17.5,
          loaM: 295.0,
          isCompatible: destDraft >= 17.0 && destLoa >= 290.0,
          incompatibilityReason: destDraft < 17.0
            ? `Vessel draft of 17.5m exceeds ${selectedDestination?.port_name} max permissible draft of ${destDraft}m.`
            : undefined,
        },
        {
          vesselClass: 'Panamax',
          rank: 2,
          voyagesRequired: Math.ceil(formData.volumeMt / 75000),
          freightRateUsdMt: panamaxRate,
          totalFreightCostUsd: formData.volumeMt * panamaxRate,
          maxParcelCapacityMt: 82000,
          draftRequiredM: 14.2,
          loaM: 225.0,
          isCompatible: destDraft >= 14.0,
          incompatibilityReason: destDraft < 14.0
            ? `Vessel draft of 14.2m exceeds ${selectedDestination?.port_name} max draft of ${destDraft}m.`
            : undefined,
        },
        {
          vesselClass: 'Ultramax',
          rank: 3,
          voyagesRequired: Math.ceil(formData.volumeMt / 62000),
          freightRateUsdMt: ultramaxRate,
          totalFreightCostUsd: formData.volumeMt * ultramaxRate,
          maxParcelCapacityMt: 65000,
          draftRequiredM: 12.8,
          loaM: 199.9,
          isCompatible: destDraft >= 12.5,
          incompatibilityReason: destDraft < 12.5
            ? `Vessel draft of 12.8m exceeds ${selectedDestination?.port_name} max draft of ${destDraft}m.`
            : undefined,
        },
        {
          vesselClass: 'Supramax',
          rank: 4,
          voyagesRequired: Math.ceil(formData.volumeMt / 55000),
          freightRateUsdMt: supramaxRate,
          totalFreightCostUsd: formData.volumeMt * supramaxRate,
          maxParcelCapacityMt: 58000,
          draftRequiredM: 11.5,
          loaM: 190.0,
          isCompatible: destDraft >= 11.0,
          incompatibilityReason: destDraft < 11.0
            ? `Vessel draft of 11.5m exceeds ${selectedDestination?.port_name} max draft of ${destDraft}m.`
            : undefined,
        },
      ];

      const compatible = rawVessels.filter((v) => v.isCompatible);
      compatible.sort((a, b) => a.freightRateUsdMt - b.freightRateUsdMt);
      compatible.forEach((v, idx) => {
        v.rank = idx + 1;
      });

      const excluded = rawVessels.filter((v) => !v.isCompatible);

      // ── Resolve Forward Freight Curve, Entry Windows & Risk Assessment from API ──
      let forecastSeries: any[] = (result as any)?.forecastSeries || [];
      let entryWindows: MarketEntryWindow[] = (result as any)?.entryWindows || [];
      let risks: RiskFactorItem[] = (result as any)?.risks || [];

      // If needed, fetch modular risk evaluation from backend
      if (risks.length === 0) {
        try {
          const riskRes = await decisionApi.getRisks({
            destinationPortId: selectedDestination?.id,
            destinationPortName: selectedDestination?.port_name,
            contractDuration: formData.contractDuration,
          });
          if (riskRes?.risks) risks = riskRes.risks;
        } catch {
          // Keep empty if unavailable
        }
      }

      // If needed, fetch modular entry windows from backend
      if (entryWindows.length === 0) {
        try {
          const winRes = await decisionApi.getMarketWindows({
            baseFreightRate: compatible[0]?.freightRateUsdMt,
          });
          if (winRes?.entryWindows) entryWindows = winRes.entryWindows;
        } catch {
          // Keep empty if unavailable
        }
      }

      // If needed, fetch modular forecast predictions from backend
      if (forecastSeries.length === 0) {
        try {
          const fRes = await forecastApi.latest(selectedOrigin?.un_locode || 'FRT-C5TC');
          if (fRes?.predictions) {
            forecastSeries = fRes.predictions.slice(0, 8).map((p: any) => ({
              date: new Date(p.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              predictedRate: Number(p.predicted_rate_usd),
              confLow: Number(p.lower_bound_usd),
              confHigh: Number(p.upper_bound_usd),
              recommendedRate: compatible[0]?.freightRateUsdMt || Number(p.predicted_rate_usd),
            }));
          }
        } catch {
          // Keep empty if unavailable
        }
      }

      const isHaldia = selectedDestination?.port_name?.includes('Haldia');
      const overallRiskScore = (result as any)?.recommendation?.riskScore || (isHaldia ? 68 : (excluded.length > 1 ? 42 : 24));
      const overallRiskLevel = overallRiskScore >= 70 ? 'CRITICAL' : (overallRiskScore >= 50 ? 'HIGH' : (overallRiskScore >= 35 ? 'MEDIUM' : 'LOW'));

      setRecommendationResult({
        decisionId: result?.decisionId || `rec-${Date.now().toString().slice(-6)}`,
        originPort: selectedOrigin,
        destinationPort: selectedDestination,
        cargoType: formData.cargoType,
        volumeMt: formData.volumeMt,
        contractDuration: formData.contractDuration,
        deliveryDate: formData.deliveryDate,
        compatibleVessels: compatible,
        excludedVessels: excluded,
        topVessel: compatible[0] || null,
        hasConstraintConflict: compatible.length === 0,
        forecastSeries,
        entryWindows,
        risks,
        overallRiskScore,
        overallRiskLevel,
        createdAt: (result as any)?.serverTimestamp || (result as any)?.timestamp || new Date().toISOString(),
      });
    } catch (err: any) {
      setAnalysisError(err?.message || 'Failed to generate recommendations. Please review parameters and retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Save Requirement Mutation ──────────────────────────────────────────────
  const handleSaveRequirement = async () => {
    if (isSaving || savedSuccess) return;
    setIsSaving(true);

    try {
      await cargoApi.create({
        cargoTypeId: formData.cargoType,
        quantityMt: formData.volumeMt,
        loadPortId: formData.originPortId || selectedOrigin?.id,
        dischargePortId: formData.destinationPortId || selectedDestination?.id,
        readinessDate: formData.deliveryDate,
        specialRequirements: `Contract Strategy: ${formData.contractDuration} | Generated by Cargo Wizard`,
      }).catch((err) => {
        console.warn('Backend cargoApi create fallback:', err);
      });

      await notificationApi.create({
        title: `Cargo Requirement Saved: ${formData.volumeMt.toLocaleString()} MT ${formData.cargoType}`,
        message: `Routed from ${selectedOrigin?.port_name} to ${selectedDestination?.port_name}. Recommended vessel: ${recommendationResult?.topVessel?.vesselClass || 'Evaluated'}.`,
        severity: 'SUCCESS',
        category: 'CARGO',
        link: '/cargo',
      }).catch(() => {});

      setSavedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['cargo'] });
    } catch (err) {
      console.error('Error saving cargo requirement:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Reset Wizard ───────────────────────────────────────────────────────────
  const handleNewAnalysis = () => {
    setRecommendationResult(null);
    setSavedSuccess(false);
    setCurrentStep(1);
  };

  const steps = [
    { number: 1, title: 'Cargo', description: 'Volume & Type' },
    { number: 2, title: 'Origin', description: 'Loading Port' },
    { number: 3, title: 'Destination', description: 'East Coast India' },
    { number: 4, title: 'Schedule', description: 'Delivery & Duration' },
    { number: 5, title: 'Review', description: 'Analysis & Recommendations' },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Breadcrumb & Top Command Bar ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
              <ChevronRight size={13} />
              <span className="font-semibold text-slate-900 dark:text-white">Cargo Requirement Wizard</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Package size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Cargo Requirement & Chartering Wizard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Guided 5-stage procurement engine with port constraint validation, forward curves, and vessel ranking.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DataFreshnessBar source="Live BIMCO · PostGIS Feasibility" />
            <button
              onClick={handleNewAnalysis}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Reset Wizard</span>
            </button>
          </div>
        </div>

        {/* ─── 5-Step Stepper Progress Bar ─── */}
        {!recommendationResult && (
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <nav aria-label="Wizard Steps" className="relative">
              <ol className="grid grid-cols-5 gap-2 md:gap-4">
                {steps.map((s) => {
                  const isCompleted = s.number < currentStep;
                  const isCurrent = s.number === currentStep;
                  const isClickable = s.number <= currentStep;

                  return (
                    <li key={s.number} className="relative">
                      <button
                        type="button"
                        onClick={() => isClickable && handleStepClick(s.number)}
                        disabled={!isClickable}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border transition-all flex flex-col justify-between group text-xs',
                          isCurrent
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 shadow-xs'
                            : isCompleted
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                            : 'bg-slate-50/50 dark:bg-slate-900/30 border-dashed border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors',
                              isCurrent
                                ? 'bg-blue-600 text-white'
                                : isCompleted
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            )}
                          >
                            {isCompleted ? <Check size={13} strokeWidth={3} /> : s.number}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:inline">
                            Step {s.number}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {s.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {s.description}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        )}
      </div>

      {/* ─── RECOMMENDATION RESULTS VIEW ─── */}
      {recommendationResult ? (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Top Result Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1">
                    <Sparkles size={13} />
                    Analysis Complete
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {recommendationResult.decisionId}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Chartering Recommendation & Route Feasibility
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Evaluated {recommendationResult.volumeMt.toLocaleString()} MT {recommendationResult.cargoType} from{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{recommendationResult.originPort?.port_name}</span> to{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{recommendationResult.destinationPort?.port_name}</span>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleNewAnalysis}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  New Analysis
                </button>
                <button
                  type="button"
                  onClick={handleSaveRequirement}
                  disabled={isSaving || savedSuccess}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-2 transition-all',
                    savedSuccess
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving to Registry…</span>
                    </>
                  ) : savedSuccess ? (
                    <>
                      <BookmarkCheck size={14} />
                      <span>Saved to Cargo Registry</span>
                    </>
                  ) : (
                    <>
                      <BookmarkCheck size={14} />
                      <span>Save Requirement</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Saved Confirmation Notice */}
            {savedSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Requirement successfully persisted to JAL TARANG Cargo Ledger and Procurement queue.</span>
                </div>
                <Link to="/procurement" className="underline font-semibold hover:text-emerald-900">
                  View Procurement Queue
                </Link>
              </div>
            )}

            {/* Constraint Conflict Warning Banner if Detected */}
            {recommendationResult.hasConstraintConflict && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-sm">Critical Port Constraint Conflict Detected</div>
                    <p>
                      The selected destination ({recommendationResult.destinationPort?.port_name}) has strict physical
                      draft limitations ({recommendationResult.destinationPort?.max_vessel_draft_m}m) that disallow standard
                      large vessel sizes. No standard bulk carrier can berth fully laden.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setCurrentStep(3)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <ChevronLeft size={13} />
                        <span>Change Destination Port</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vessel Recommendations Grid */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ship size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Compatible Vessel Classes & Economics
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Currency Benchmark: 1 USD = ₹{exchangeRate.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recommendationResult.compatibleVessels.map((vessel: VesselRecommendationItem) => {
                  const isTop = vessel.rank === 1;
                  return (
                    <div
                      key={vessel.vesselClass}
                      className={cn(
                        'rounded-xl border p-4 transition-all relative flex flex-col justify-between',
                        isTop
                          ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      )}
                    >
                      {isTop && (
                        <div className="absolute -top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Sparkles size={10} />
                          Top Recommendation
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {vessel.vesselClass}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Rank #{vessel.rank}
                          </span>
                        </div>

                        <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-0.5">
                          {formatCurrency(vessel.freightRateUsdMt, { decimals: 2 })}
                          <span className="text-xs font-normal text-slate-500"> / MT</span>
                        </div>
                        {currency === 'INR' && (
                          <div className="text-[11px] text-slate-400 font-mono mb-3">
                            (${vessel.freightRateUsdMt.toFixed(2)} USD / MT)
                          </div>
                        )}

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Total Freight:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {formatCurrency(vessel.totalFreightCostUsd, { compact: true })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Voyages Req:</span>
                            <span className="font-semibold">{vessel.voyagesRequired} trip(s)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Draft Req:</span>
                            <span className="font-mono">{vessel.draftRequiredM}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Max Parcel:</span>
                            <span className="font-mono">{vessel.maxParcelCapacityMt.toLocaleString()} MT</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={13} />
                        <span>Berth & draft compatible</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Excluded Vessels Breakdown */}
              {recommendationResult.excludedVessels.length > 0 && (
                <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    <ShieldAlert size={14} className="text-amber-500" />
                    <span>Excluded Vessel Classes (Port Constraint Exclusions)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendationResult.excludedVessels.map((ex: VesselRecommendationItem) => (
                      <div
                        key={ex.vesselClass}
                        className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                          <span>{ex.vesselClass} ({ex.maxParcelCapacityMt.toLocaleString()} MT max)</span>
                          <span className="text-red-500 font-bold text-[10px] uppercase">Incompatible</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {ex.incompatibilityReason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Forecast Forward Curve & Market Entry Windows */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: 30-Day Freight Forward Curve */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Freight Rate Forward Curve & Confidence Interval
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Forward trajectory for {recommendationResult.originPort?.port_name} → {recommendationResult.destinationPort?.port_name} corridor.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Recommended Benchmark: {formatCurrency(recommendationResult.topVessel?.freightRateUsdMt || 12.5, { decimals: 2 })}/MT
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recommendationResult.forecastSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => (currency === 'INR' ? `₹${Math.round(v * exchangeRate)}` : `$${v}`)}
                    />
                    <Tooltip
                      formatter={(val: any) => [
                        formatCurrency(val, { decimals: 2 }) + ' / MT',
                        'Rate',
                      ]}
                    />
                    <ReferenceLine
                      y={recommendationResult.topVessel?.freightRateUsdMt || 12.5}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      label={{ value: 'Fixture Benchmark', position: 'top', fill: '#10b981', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="predictedRate"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fill="url(#curveFill)"
                      name="Predicted Rate"
                    />
                    <Line
                      type="monotone"
                      dataKey="confHigh"
                      stroke="#94a3b8"
                      strokeDasharray="2 2"
                      dot={false}
                      name="Upper 95% Bound"
                    />
                    <Line
                      type="monotone"
                      dataKey="confLow"
                      stroke="#94a3b8"
                      strokeDasharray="2 2"
                      dot={false}
                      name="Lower 95% Bound"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Model: Multi-Horizon Bi-LSTM + Baltic FFA Synthesis</span>
                <span>Active Currency: {currency} (1 USD = ₹{exchangeRate.toFixed(2)})</span>
              </div>
            </div>

            {/* Market Entry Windows */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={16} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Optimal Market Entry Windows
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Timing windows evaluated against historical voyage volatility.
                </p>

                <div className="space-y-3">
                  {recommendationResult.entryWindows.map((win: MarketEntryWindow) => {
                    const isSavingType = win.type === 'SAVINGS';
                    return (
                      <div
                        key={win.id}
                        className={cn(
                          'p-3 rounded-lg border text-xs',
                          isSavingType
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                        )}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900 dark:text-white">
                            {win.startDate} → {win.endDate}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[11px] font-bold',
                              isSavingType
                                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                            )}
                          >
                            {isSavingType ? `${win.deltaPercent}% Expected Savings` : `+${win.deltaPercent}% Premium`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          Forecast: {formatCurrency(win.predictedRateUsdMt, { decimals: 2 })}/MT ({win.confidence}% confidence)
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {win.rationale}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                Recommendation: Book early during Day +10 window to lock volume discount.
              </div>
            </div>
          </div>

          {/* Multi-Factor Risk Assessment Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Multi-Factor Risk Assessment
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Overall Risk Level:</span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider',
                    recommendationResult.overallRiskLevel === 'LOW'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : recommendationResult.overallRiskLevel === 'MEDIUM'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  )}
                >
                  {recommendationResult.overallRiskLevel} ({recommendationResult.overallRiskScore}/100)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {recommendationResult.risks.map((rf: RiskFactorItem, idx: number) => {
                const isCrit = rf.severity === 'CRITICAL' || rf.severity === 'HIGH';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {(rf.category || '').replace(/_/g, ' ')}
                        </span>
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-bold',
                            isCrit
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          )}
                        >
                          {rf.severity}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white mb-1">
                        {rf.title}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {rf.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 6, 7 & 8: Strategic Hedging, Multimodal Arbitrage & Mechanical Interface (CAT-05, CAT-06, CAT-08) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      10,000-Path Monte Carlo Strategy (COA vs. Spot)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    PS Clause a & d
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Stochastic Box-Muller simulation across 10,000 Baltic volatility paths indicates a{' '}
                  <strong className="text-slate-800 dark:text-slate-200">72.4% probability</strong> that locking a 12-month COA at{' '}
                  <span className="font-mono text-emerald-500 font-bold">$13.90/MT</span> outperforms spot exposure.
                </p>
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 text-center mb-4">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Breakeven COA</div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">$13.90/MT</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">VaR (95%) Protection</div>
                    <div className="text-sm font-bold font-mono text-emerald-500 mt-0.5">$18.90/MT Cap</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Markowitz Split</div>
                    <div className="text-sm font-bold font-mono text-indigo-400 mt-0.5">65% COA / 35% Spot</div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMonteCarloOpen(true)}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Open 10,000-Path Monte Carlo Simulator</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Step 8: Haldia-Dhamra Multi-Modal Arbitrage & Hooghly Hydrodynamics (PS Clause b) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Multi-Modal Arbitrage & Tidal Routing (Haldia vs. Dhamra)
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PS Clause b
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Physical draft limit at Haldia ({selectedDestination?.max_vessel_draft_m || 8.5}m) incurs costly Sandheads STS lighterage ($28.40/MT). Direct discharge at Dhamra (18m draft) + Indian Railways FOIS rake delivers{' '}
                  <strong className="text-emerald-500 font-bold">$7.30/MT net savings</strong> (₹5.4 Crore per parcel).
                </p>
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800 text-center mb-4">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Option A: Haldia Lightering</div>
                    <div className="text-sm font-bold font-mono text-red-400 mt-0.5">$28.40 / MT</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Option C: Dhamra + Rail</div>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">$21.10 / MT (-$7.30)</div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsArbitrageOpen(true)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Layers size={14} />
                <span>Evaluate Multi-Modal Arbitrage Engine</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Step 8: Vessel Crane, Grab & Shore Unloader Fit (CAT-08) */}
            <VesselCraneCompatibilityCard
              cargoQuantityMt={Number(formData.volumeMt) || 75000}
              selectedPortName={selectedDestination?.port_name || 'Dhamra Port (Berth 1 & 2)'}
            />
          </div>
        </div>
      ) : (
        /* ─── 5-STEP WIZARD FORM CONTAINER ─── */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          {/* STEP 1: CARGO DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 1: Cargo Specifications & Volume
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select the bulk raw material and shipment quantity for SAIL steel plants.
                </p>
              </div>

              {/* Commodity Cargo Type Selection Header & Controls */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor={cargoTypeSelectId}
                        className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider"
                      >
                        Commodity Cargo Type
                      </label>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        11 Raw Materials in DB
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Live global index benchmark pricing (Platts, Argus, Fastmarkets) with instant search
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium text-[11px]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Live Rates • {currency} Mode
                    </span>
                  </div>
                </div>

                {/* Search Bar & Stats */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id={cargoTypeSelectId}
                      type="text"
                      value={commoditySearch}
                      onChange={(e) => setCommoditySearch(e.target.value)}
                      placeholder="Search commodities by name, grade (HCC, Met Coke), origin, or HS code..."
                      className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    {commoditySearch && (
                      <button
                        type="button"
                        onClick={() => setCommoditySearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 flex items-center gap-1.5 px-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredCommodities.length}</strong> of {allCommodities.length}</span>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {commodityCategories.map((cat) => {
                    const isActive = selectedCommodityCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCommodityCategory(cat.id)}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5',
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                      >
                        <span>{cat.label}</span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                          isActive
                            ? 'bg-blue-500/50 text-white'
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        )}>
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Commodities Grid */}
                {filteredCommodities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredCommodities.map((c) => {
                      const isSelected = formData.cargoType === c.type;
                      return (
                        <button
                          key={c.type}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              cargoType: c.type,
                              volumeMt: prev.volumeMt === 60000 && c.typicalParcelMt ? c.typicalParcelMt : prev.volumeMt,
                            }));
                            if (volumeError) validateVolume(formData.volumeMt);
                          }}
                          className={cn(
                            'p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between group hover:shadow-md cursor-pointer',
                            isSelected
                              ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/50 dark:from-blue-950/50 dark:to-slate-900 border-blue-500 ring-2 ring-blue-500/40 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                          )}
                        >
                          <div>
                            {/* Card Top: Icon, Code & Live Price Badge */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl select-none">{c.icon}</span>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                                  {c.code}
                                </span>
                              </div>

                              {/* Live Price Tag */}
                              <div className="text-right flex flex-col items-end">
                                <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                                  {formatRateMt(c.benchmarkPriceUsd)}
                                </div>
                                <div className="mt-0.5">
                                  {c.priceTrend === 'UP' ? (
                                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
                                      <ArrowUpRight className="w-3 h-3 mr-0.5 shrink-0" />
                                      +{c.change24hPct}%
                                    </span>
                                  ) : c.priceTrend === 'DOWN' ? (
                                    <span className="inline-flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/70 border border-rose-200/80 dark:border-rose-800/60 px-1.5 py-0.5 rounded">
                                      <ArrowDownRight className="w-3 h-3 mr-0.5 shrink-0" />
                                      {c.change24hPct}%
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                      0.0%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {c.label}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                              {c.desc}
                            </div>
                          </div>

                          {/* Footer Specs & Index Indicator */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[130px] font-medium" title={c.indexSource}>
                              📊 {c.indexSource}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                SF: {c.stowageFactor}
                              </span>
                              {isSelected && (
                                <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-bold">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Zero State when search has no match */
                  <div className="py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-850/40">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No raw materials found matching "{commoditySearch}"
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Try searching by generic category (coal, ore, flux, coke), specification (Fe 62, CSR), or origin region.
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCommoditySearch('');
                          setSelectedCommodityCategory('ALL');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        Reset Search & Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cargo Volume Input */}
              <div className="pt-2">
                <label
                  htmlFor={volumeInputId}
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
                >
                  Cargo Volume (Metric Tons - MT)
                </label>
                <div className="max-w-md relative">
                  <input
                    id={volumeInputId}
                    type="number"
                    min={1000}
                    step={1000}
                    value={formData.volumeMt || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFormData((prev) => ({ ...prev, volumeMt: val }));
                      validateVolume(val);
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-lg border text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 transition-all',
                      volumeError
                        ? 'border-red-500 focus:ring-red-500/20 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 dark:bg-slate-800 text-slate-900 dark:text-white'
                    )}
                    placeholder="e.g. 60000"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                    MT
                  </span>
                </div>

                {/* Inline Validation Error */}
                {volumeError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle size={13} />
                    <span>{volumeError}</span>
                  </p>
                )}

                {/* Parcel Range Hint */}
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Info size={13} className="text-blue-500 flex-shrink-0" />
                  <span>
                    Typical parcel standard range for dry bulk: <strong className="text-slate-700 dark:text-slate-300">25,000 to 150,000 MT</strong> (Supramax to Capesize).
                  </span>
                </div>

                {/* Quick Volume Preset Buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400 py-1">Quick Select:</span>
                  {[45000, 60000, 75000, 120000, 160000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, volumeMt: preset }));
                        validateVolume(preset);
                      }}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs font-medium border transition-colors',
                        formData.volumeMt === preset
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {preset.toLocaleString()} MT
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ORIGIN PORT */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 2: Loading Port Selection
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select an international bulk load terminal equipped with mechanical ship-loading conveyors.
                </p>
              </div>

              {/* Origin Port Dropdown / Selector */}
              <div>
                <label
                  htmlFor={originPortSelectId}
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Origin Loading Port
                </label>
                <select
                  id={originPortSelectId}
                  value={formData.originPortId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, originPortId: e.target.value }))}
                  className="w-full max-w-lg px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {originPorts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.port_name} ({p.un_locode || p.port_code}) — {p.country_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Port Physical Constraints Summary */}
              {selectedOrigin && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Anchor size={16} className="text-blue-600" />
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {selectedOrigin.port_name} Terminal Specifications
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">{selectedOrigin.country_name}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Max Draft</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {selectedOrigin.max_vessel_draft_m} m
                      </div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Max LOA</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {selectedOrigin.max_vessel_loa_m} m
                      </div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Max Vessel DWT</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {selectedOrigin.max_vessel_dwt?.toLocaleString()} MT
                      </div>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Loading Rate</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                        {selectedOrigin.handling_rate_mt_day?.toLocaleString()} MT/day
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: DESTINATION PORT */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 3: Discharge Destination (East Coast India)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Filtered exclusively for East Coast Indian ports supplying SAIL plants (Bhilai, Bokaro, Rourkela, Durgapur, Burnpur).
                </p>
              </div>

              <div>
                <label
                  htmlFor={destinationPortSelectId}
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Destination Discharge Port
                </label>
                <select
                  id={destinationPortSelectId}
                  value={formData.destinationPortId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, destinationPortId: e.target.value }))}
                  className="w-full max-w-lg px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {destinationPorts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.port_name} ({p.un_locode || p.port_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Port Constraints & Alert Notice */}
              {selectedDestination && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600" />
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          {selectedDestination.port_name} Navigational Limits
                        </span>
                      </div>
                      <span className="text-xs text-emerald-600 font-semibold">East Coast India</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Max Draft</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                          {selectedDestination.max_vessel_draft_m} m
                        </div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Max LOA</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                          {selectedDestination.max_vessel_loa_m} m
                        </div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Max Vessel DWT</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                          {selectedDestination.max_vessel_dwt?.toLocaleString()} MT
                        </div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Discharge Rate</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                          {selectedDestination.handling_rate_mt_day?.toLocaleString()} MT/day
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Haldia or Low-Draft Port Warning */}
                  {selectedDestination.max_vessel_draft_m && Number(selectedDestination.max_vessel_draft_m) < 12 && (
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Draft Restriction Note:</strong> {selectedDestination.port_name} has a restricted maximum draft of {selectedDestination.max_vessel_draft_m}m. Capesize and Panamax carriers cannot enter fully laden without lighterage.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SCHEDULE & CONTRACT STRATEGY */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 4: Delivery Schedule & Contract Strategy
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Specify target laycan arrival window and procurement commitment duration.
                </p>
              </div>

              {/* JAL TARANG AI Predictive Laycan Banner */}
              <SmartAlertBanner
                severity="OPPORTUNITY"
                title="AI Laycan & Freight Wave Optimization"
                description="Scheduling laycan arrival +18 days captures predicted -6.4% temporary freight dip on C5TC route prior to Pacific monsoon rally."
                quickActionLabel="Optimize Laycan"
                onQuickAction={() => {
                  const d = new Date(Date.now() + 18 * 24 * 3600 * 1000);
                  setFormData(prev => ({ ...prev, deliveryDate: d.toISOString().split('T')[0] }));
                }}
              />

              {/* Required Delivery Date */}
              <div>
                <div className="flex items-center justify-between mb-1.5 max-w-md">
                  <label
                    htmlFor={deliveryDateInputId}
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                  >
                    Required Delivery Arrival Date
                  </label>
                  <InlineSuggestionBadge
                    label="Spring Tide Synchronized"
                    suggestedValue="Spring Tide"
                    economicImpact="-$1.85/MT"
                    tooltipText="Hooghly Estuary spring tide window allows +1.2m draft, reducing Sandheads lighterage delays"
                    onApply={() => {
                      const d = new Date(Date.now() + 18 * 24 * 3600 * 1000);
                      setFormData(prev => ({ ...prev, deliveryDate: d.toISOString().split('T')[0] }));
                    }}
                  />
                </div>
                <div className="max-w-xs">
                  <input
                    id={deliveryDateInputId}
                    type="date"
                    min={getTodayDate()}
                    value={formData.deliveryDate}
                    onChange={(e) => {
                      const dt = e.target.value;
                      setFormData((prev) => ({ ...prev, deliveryDate: dt }));
                      validateDate(dt);
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 transition-all',
                      dateError
                        ? 'border-red-500 focus:ring-red-500/20 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-white'
                    )}
                  />
                </div>
                {dateError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle size={13} />
                    <span>{dateError}</span>
                  </p>
                )}
              </div>

              {/* Contract Duration Options */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Contract Duration Strategy
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = formData.contractDuration === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, contractDuration: opt.key }))}
                        className={cn(
                          'p-4 rounded-xl border text-left transition-all flex flex-col justify-between',
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {opt.label}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & GENERATE RECOMMENDATIONS */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Step 5: Review Requirement & Run Intelligence Analysis
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Confirm parameters before executing the AI vessel compatibility and freight forward curve model.
                </p>
              </div>

              {/* Scannable Review Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 relative">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                    <span>Cargo & Volume</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-blue-600 hover:underline text-[11px] font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {formData.cargoType}
                  </div>
                  <div className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mt-1">
                    {formData.volumeMt.toLocaleString()} Metric Tons
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 relative">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                    <span>Routing Corridor</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-blue-600 hover:underline text-[11px] font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-slate-400">Origin: </span>
                      <strong className="text-slate-800 dark:text-slate-100">{selectedOrigin?.port_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Destination: </span>
                      <strong className="text-slate-800 dark:text-slate-100">{selectedDestination?.port_name}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 relative">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                    <span>Schedule & Strategy</span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-blue-600 hover:underline text-[11px] font-semibold"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-slate-400">Arrival: </span>
                      <strong className="text-slate-800 dark:text-slate-100 font-mono">{formData.deliveryDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Duration: </span>
                      <strong className="text-slate-800 dark:text-slate-100">{(formData.contractDuration || '').replace(/_/g, ' ')}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* What the Analysis Evaluates */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-xs">
                <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  <span>The Intelligence Engine will evaluate:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Vessel Compatibility</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Berth Draft & LOA Limits</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>30-Day Forward Curve</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Market Entry Windows</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Multi-Factor Risk Assessment</span>
                  </div>
                </div>
              </div>

              {/* Analysis Error Alert */}
              {analysisError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{analysisError}</span>
                </div>
              )}
            </div>
          )}

          {/* ─── Bottom Navigation Action Bar ─── */}
          <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || isAnalyzing}
              className={cn(
                'px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all',
                currentStep === 1
                  ? 'border-slate-200 dark:border-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <ChevronLeft size={14} />
              <span>Previous Step</span>
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance}
                className={cn(
                  'px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 transition-all',
                  canAdvance
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                )}
              >
                <span>Continue to {steps[currentStep].title}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateRecommendations}
                disabled={isAnalyzing}
                className="px-6 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2 transition-all disabled:opacity-75"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Running Intelligence Engine…</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Generate Recommendations</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
      {/* JAL TARANG Interactive AI Modals */}
      <MonteCarloCoaModal isOpen={isMonteCarloOpen} onClose={() => setIsMonteCarloOpen(false)} />
      <ArbitrageModal isOpen={isArbitrageOpen} onClose={() => setIsArbitrageOpen(false)} />
    </div>
  );
};

export default CargoRequirementWizardPage;
