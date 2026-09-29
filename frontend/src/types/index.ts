/**
 * JAL TARANG — Central Domain & API Types
 */

export type SystemRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'CHARTERING_MANAGER'
  | 'PROCUREMENT_MANAGER'
  | 'PORT_MANAGER'
  | 'ANALYST';

export const SystemRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CHARTERING_MANAGER: 'CHARTERING_MANAGER',
  PROCUREMENT_MANAGER: 'PROCUREMENT_MANAGER',
  PORT_MANAGER: 'PORT_MANAGER',
  ANALYST: 'ANALYST',
} as const;


export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  organizationName?: string;
  roles: SystemRole[];
  permissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
}

export interface Port {
  id: string;
  code: string;
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
  maxDraftM: number;
  maxLoaM: number;
  maxBeamM: number;
  maxDwt: number;
  currentWaitingDays: number;
  congestionStatus: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  weatherAlert?: string;
  cargoHandled: string[];
  terminalsCount: number;
  berthsCount: number;
}

export interface Vessel {
  id: string;
  imoNumber: string;
  mmsi?: string;
  name: string;
  vesselClass: 'HANDYSIZE' | 'SUPRAMAX' | 'ULTRAMAX' | 'PANAMAX' | 'KAMSARMAX' | 'CAPESIZE' | 'NEWCASTLEMAX';
  dwt: number;
  summerDraftM: number;
  loaM: number;
  beamM: number;
  buildYear: number;
  flag: string;
  speedKnots: number;
  fuelConsumptionTonsDay: number;
  status: 'AVAILABLE' | 'EN_ROUTE' | 'DISCHARGING' | 'WAITING' | 'BALLASTING';
  currentPosition?: { lat: number; lng: number; locationName: string };
  destination?: string;
  eta?: string;
}

export interface FreightRate {
  id: string;
  freightCode: string;
  description: string;
  origin: string;
  destination: string;
  vesselClass: string;
  cargo: string;
  rateUsd: number;
  rateDate: string;
  change7d: number;
  source: string;
  confidence: number;
}

export interface ForecastPredictionPoint {
  targetDate: string;
  predictedRateUsd: number;
  lowerBoundUsd: number;
  upperBoundUsd: number;
  confidenceLevel: number;
}

export interface ForecastRun {
  id: string;
  freightCode: string;
  forecastDate: string;
  horizonDays: number;
  baselineRateUsd: number;
  modelVersion: string;
  modelType: string;
  predictions: ForecastPredictionPoint[];
}

export interface VoyageEconomics {
  grossFreightUsd: string;
  commissionUsd: string;
  netFreightUsd: string;
  bunkerCostSeaUsd: string;
  bunkerCostPortUsd: string;
  portChargesUsd: string;
  hireOrCapitalCostUsd: string;
  operatingCostUsd: string;
  demurrageNetUsd: string;
  miscCostUsd: string;
  taxUsd: string;
  totalVoyageCostUsd: string;
  seaDaysLaden: string;
  seaDaysBallast: string;
  portDaysLoad: string;
  portDaysDischarge: string;
  totalVoyageDays: string;
  tceUsdDay: string;
  landedCostUsdMt: string;
  voyagePnlUsd: string;
  voyageMarginPct: string;
  breakEvenFreightUsdMt: string;
}

export interface PortFeasibilityViolation {
  type: 'LOA' | 'BEAM' | 'DRAFT' | 'DWT';
  required: number;
  actual: number;
  difference: number;
  severity: 'WARNING' | 'CRITICAL';
  message: string;
}

export interface PortFeasibilityResult {
  isFeasible: boolean;
  status: 'FEASIBLE' | 'CONDITIONALLY_FEASIBLE' | 'INFEASIBLE';
  violations: PortFeasibilityViolation[];
  explanations: string[];
}

export interface DecisionAnalysisInput {
  cargoType?: string;
  quantityMt?: number;
  origin?: string;
  destination?: string;
  laycanStart?: string;
  laycanEnd?: string;
  requiredArrival?: string;
  contractHorizon?: 'SPOT' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'COA';
  riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH';
  preferredVesselClass?: string;
  vesselId?: string;
  loadingPortId?: string;
  dischargingPortId?: string;
  cargoTypeId?: string;
  cargoQuantityMt?: number;
  includeScenarios?: boolean;
  includeForecasts?: boolean;
}

export interface DecisionRecommendationResult {
  decisionId: string;
  recommendation: {
    marketAction: 'ENTER_NOW' | 'ENTER_PARTIALLY' | 'WAIT' | 'MONITOR';
    recommendedStrategy: 'SPOT' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'COA' | 'MULTI_VOYAGE';
    selectedVessel: Vessel;
    expectedSavingsUsd: number;
    savingsPercentage: number;
    confidenceScore: number;
    validityWindowDays: number;
  };
  marketOutlook: {
    currentFreightUsd: number;
    forecastRateUsd: number;
    forecastTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    volatility: string;
  };
  portFeasibility: PortFeasibilityResult;
  voyageEconomics: VoyageEconomics;
  idleAnalysis: {
    expectedIdleDays: number;
    idleProbability: number;
    idleCostUsd: number;
    congestionRisk: string;
  };
  riskAnalysis: {
    compositeScore: number;
    compositeLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: Array<{ category: string; score: number; level: string; description: string }>;
    mitigations: string[];
  };
  charterStrategyComparison: Array<{
    strategy: string;
    expectedRateUsd: number;
    expectedTotalCostUsd: number;
    volatilityRisk: string;
    flexibility: string;
    confidence: number;
  }>;
  explanation: string;
  dataTimestamp: string;
  dataQualityScore: number;
  modelVersion: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  contractType: 'SPOT' | 'TIME_CHARTER' | 'COA' | 'MULTI_VOYAGE';
  counterpartyName: string;
  counterpartyType: string;
  cargoName: string;
  totalQuantityMt: number;
  deliveredQuantityMt: number;
  rateUsd: number;
  rateType: string;
  demurrageRateUsdDay: number;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
  voyageCount: number;
}

export interface AlertItem {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  affectedEntity: string;
  category: 'FREIGHT' | 'PORT' | 'WEATHER' | 'VESSEL' | 'CONTRACT';
  createdAt: string;
  isAcknowledged: boolean;
}

export interface CopilotToolResult {
  toolName: string;
  parameters: any;
  output: any;
  executedAt: string;
}

export interface CopilotResponse {
  query: string;
  answer: string;
  evidence: CopilotToolResult[];
  dataTimestamp: string;
  source: string;
  confidence: number;
  limitations: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface UserSession {
  id: string;
  userId: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  evidence?: any[];
  source?: string;
  confidence?: number;
  roleContext?: string;
  pageContext?: string;
  suggestedFollowups?: string[];
  model?: string;
  fallbackActive?: boolean;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  role: string;
  isPinned: boolean;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
