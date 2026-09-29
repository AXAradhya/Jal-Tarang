/**
 * JAL TARANG — 16-Step Decision Pipeline Types
 */

import { VoyageEconomicsResult } from '../VoyageEconomicsService.js';
import { VesselCompatibilityResult } from '../VesselFeasibilityService.js';

export interface DecisionAnalyzeInput {
  vesselId?: string;
  loadingPortId: string;
  dischargingPortId: string;
  cargoTypeId?: string;
  cargoQuantityMt: number;
  laycanStart?: string;
  laycanEnd?: string;
  freightRateOverrideUsd?: number;
  bunkerPriceOverrideUsd?: number;
  speedKnotsOverride?: number;
  includeScenarios?: boolean;
  includeForecasts?: boolean;
}

export interface StrategyMetrics {
  tce: string;
  landedCost: string;
  pnl: string;
  margin: string;
}

export interface StrategyComparison {
  SPOT: StrategyMetrics;
  COA: StrategyMetrics;
  TIME_CHARTER: StrategyMetrics;
}

export interface DecisionRiskItem {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

export interface DecisionRecommendation {
  strategy: string;
  reasoning: string[];
  confidenceScore: number;
  actionRequired: boolean;
}

export interface DecisionAnalyzeOutput {
  decisionId: string | null;
  serverTimestamp?: string;
  executionMs: number;
  forwardCurve?: any[];
  forecastSeries?: any[];
  entryWindows?: any[];
  input: {
    loadingPort: { id: string; name: string; locode: string };
    dischargingPort: { id: string; name: string; locode: string };
    vessel: { id: string; name: string; imo: string; class: string } | null;
    cargoType: { id: string; name: string; category: string } | null;
    cargoQuantityMt: number;
    distanceNm: number;
    speedKnots: number;
    freightRateUsdPerMt: number;
    bunkerPriceUsdMt: number;
  };
  feasibility: VesselCompatibilityResult | null;
  economics: VoyageEconomicsResult;
  strategyComparison: StrategyComparison;
  recommendation: DecisionRecommendation;
  risks: DecisionRiskItem[];
  forecasts?: any[];
  scenarios?: any;
  monteCarloSimulation?: any;
  arbitrageAnalysis?: any;
  portConditions: {
    loading: { port: string; weather: any };
    discharging: { port: string; weather: any };
  };
  idleAnalysis: any;
  marketContext: {
    latestFreightRate: any;
    bunkerPrice: any;
    route: any;
  };
}
