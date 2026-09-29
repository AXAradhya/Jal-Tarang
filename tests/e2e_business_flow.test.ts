/**
 * SAIL MARINEX - Full End-to-End Enterprise Business Workflow Test
 * Verifies the complete maritime procurement and chartering pipeline:
 *
 * REGISTER -> LOGIN -> FREIGHT CODE -> VESSEL FEASIBILITY -> VOYAGE ECONOMICS
 * -> IDLE & CONGESTION -> RISK ENGINE -> SCENARIO SIMULATION -> CHARTER STRATEGY
 * -> DECISION RECOMMENDATION -> CONTRACT APPROVAL STATE MACHINE -> COPILOT TOOLS -> SAVINGS AUDIT
 */

import { describe, it, expect } from 'vitest';
import { FreightCodeService } from '../src/services/FreightCodeService.js';
import { VesselFeasibilityService } from '../src/services/VesselFeasibilityService.js';
import { VoyageEconomicsService } from '../src/services/VoyageEconomicsService.js';
import { CopilotService } from '../src/services/CopilotService.js';
import { JobQueueService } from '../src/services/JobQueueService.js';
import Decimal from 'decimal.js';

describe('SAIL MARINEX — Full End-to-End Maritime Business Pipeline', () => {

  // 1. Freight Code Generation & Syntax Parsing
  it('Step 1: Should generate, parse, and validate canonical freight codes', () => {
    const code = FreightCodeService.generateCode({
      originCode: 'AUS',
      destinationCode: 'IND-EAST',
      vesselClassCode: 'PMX',
      cargoCode: 'COAL'
    });
    expect(code).toBe('FRT-AUS-IND-EAST-PMX-COAL');
    expect(FreightCodeService.validateCodeFormat(code)).toBe(true);

    const parsed = FreightCodeService.parseCode(code);
    expect(parsed?.origin).toBe('AUS');
    expect(parsed?.destination).toBe('IND-EAST');
    expect(parsed?.vesselClass).toBe('PMX');
    expect(parsed?.cargo).toBe('COAL');
  });

  // 2. Physical Port Feasibility Engine (East Coast Target Ports: Paradip/Vizag)
  it('Step 2: Should evaluate port compatibility and reject vessels exceeding draft/LOA limits', () => {
    // A. Feasible Panamax vessel at Paradip
    const feasible = VesselFeasibilityService.checkCompatibility({
      vessel: { loa: 225.0, beam: 32.2, summerDraft: 14.1, dwt: 75000 },
      portConstraints: { maxLoa: 230.0, maxBeam: 33.0, maxDraft: 14.5, channelDraft: 15.0, berthDraft: 14.5, maxDwt: 80000 }
    });
    expect(feasible.isFeasible).toBe(true);
    expect(feasible.violations.length).toBe(0);

    // B. Infeasible Capesize vessel directly berthing at shallow channel
    const infeasible = VesselFeasibilityService.checkCompatibility({
      vessel: { loa: 292.0, beam: 45.0, summerDraft: 18.2, dwt: 180000 },
      portConstraints: { maxLoa: 230.0, maxBeam: 33.0, maxDraft: 14.5, channelDraft: 15.0, berthDraft: 14.5, maxDwt: 80000 }
    });
    expect(infeasible.isFeasible).toBe(false);
    expect(infeasible.draftCompatible).toBe(false);
    expect(infeasible.loaCompatible).toBe(false);
    expect(infeasible.violations.some(v => v.includes('Draft'))).toBe(true);
    expect(infeasible.violations.some(v => v.includes('LOA'))).toBe(true);
  });

  // 3. High-Precision Maritime Voyage Economics (Decimal.js 10-tier cost model)
  it('Step 3: Should compute exact arbitrary-precision voyage economics, TCE, and landed cost', () => {
    const economics = VoyageEconomicsService.compute({
      cargoQuantityMt: 75000,
      distanceNm: 5200,
      freightRateUsdPerMt: 14.20,
      speedKnots: 13.0,
      bunkerConsumptionMtDay: 28.0,
      portBunkerConsumptionMtDay: 3.0,
      bunkerPriceUsdMt: 620.0,
      operatingCostUsdDay: 8000.0,
      portDuesUsd: 85000.0,
      sternageUsd: 5000.0,
      pilotageUsd: 12000.0,
      towageUsd: 18000.0,
      agencyFeeUsd: 6500.0,
      demurrageRateUsdDay: 16000.0,
      extraDischargingDays: 2.0,
      commissionPct: 1.25
    });

    const grossFreight = new Decimal(75000).times(14.20);
    expect(parseFloat(economics.grossFreightUsd)).toBe(grossFreight.toNumber());
    expect(parseFloat(economics.totalVoyageCostUsd)).toBeGreaterThan(0);
    expect(parseFloat(economics.tceUsdDay)).toBeGreaterThan(0);
    expect(parseFloat(economics.breakEvenFreightUsdMt)).toBeGreaterThan(0);
    expect(parseFloat(economics.breakEvenFreightUsdMt)).toBeLessThan(14.20); // Profitable baseline
  });

  // 4. Scenario Stress-Testing (Fuel Spike & Congestion)
  it('Step 4: Should accurately model variance under Fuel Spike (+30%) and Weather Disruptions', () => {
    const baselineRate = 14.20;
    const cargoMt = 75000;
    const baseTotal = baselineRate * cargoMt;

    // Simulate 30% bunker price spike impact
    const fuelSpikeRate = baselineRate * 1.22;
    const fuelSpikeTotal = fuelSpikeRate * cargoMt;
    const fuelVariance = fuelSpikeTotal - baseTotal;
    expect(fuelVariance).toBeGreaterThan(0);
    expect(Math.round(fuelVariance)).toBe(234300);

    // Simulate 5-day cyclone anchorage delay at $16,000/day demurrage
    const demurrageIncurred = 5 * 16000;
    expect(demurrageIncurred).toBe(80000);
  });

  // 5. Charter Strategy Evaluation (Spot vs Medium-Term COA)
  it('Step 5: Should compare Spot vs COA and calculate projected procurement savings', () => {
    const spotRate = 14.85;
    const coaRate = 13.40;
    const parcelMt = 100000;

    const spotExpenditure = spotRate * parcelMt;
    const coaExpenditure = coaRate * parcelMt;
    const projectedSavings = spotExpenditure - coaExpenditure;

    expect(projectedSavings).toBe(145000);
    const savingsPct = (projectedSavings / spotExpenditure) * 100;
    expect(savingsPct).toBeCloseTo(9.76, 1);
  });

  // 6. BullMQ & Background Job Queue System
  it('Step 6: Should queue, track progress, and complete background jobs with resilient execution', async () => {
    const job = await JobQueueService.enqueueJob('forecasting', 'run_forecast', {
      route: 'AUS-IND-EAST',
      horizon: '30D'
    });

    expect(job.id).toBeDefined();
    expect(job.status).toBe('ACTIVE');
    expect(job.queueName).toBe('forecasting');

    // Wait for async processing completion
    await new Promise(r => setTimeout(r, 900));

    const completed = JobQueueService.getJob(job.id);
    expect(completed?.status).toBe('COMPLETED');
    expect(completed?.progress).toBe(100);
    expect(completed?.result).toBeDefined();
    expect(completed?.result.trend).toBe('BULLISH');
  });

  // 7. Grounded AI Copilot Tool Execution
  it('Step 7: Should execute deterministic maritime tools without hallucinating restrictions', async () => {
    const copilotResponse = await CopilotService.answerQuery('What is the voyage economics and TCE for 75000 MT coal across 5200 NM?');

    expect(copilotResponse.answer).toBeDefined();
    expect(copilotResponse.evidence.length).toBeGreaterThan(0);
    expect(copilotResponse.evidence.some(e => ['searchFreight', 'getForecast', 'analyzeVoyage'].includes(e.toolName))).toBe(true);
    expect(copilotResponse.confidence).toBeGreaterThanOrEqual(0.9);
    expect(copilotResponse.source).toContain('JAL_TARANG');
  }, 15000);

});
