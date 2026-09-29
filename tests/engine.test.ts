import { describe, it, expect } from 'vitest';
import { FreightCodeService } from '../src/services/FreightCodeService.js';
import { VesselFeasibilityService } from '../src/services/VesselFeasibilityService.js';
import { VoyageEconomicsService } from '../src/services/VoyageEconomicsService.js';

describe('Freight Code Engine', () => {
  it('should correctly format structured maritime freight code', () => {
    const code = FreightCodeService.generateCode({
      originCode: 'AUS',
      destinationCode: 'IND-EAST',
      vesselClassCode: 'PMX',
      cargoCode: 'COAL'
    });
    expect(code).toBe('FRT-AUS-IND-EAST-PMX-COAL');
    expect(FreightCodeService.validateCodeFormat(code)).toBe(true);
  });

  it('should accurately deconstruct freight code into components', () => {
    const parsed = FreightCodeService.parseCode('FRT-AUS-IND-EAST-PMX-COAL');
    expect(parsed).not.toBeNull();
    expect(parsed?.origin).toBe('AUS');
    expect(parsed?.destination).toBe('IND-EAST');
    expect(parsed?.vesselClass).toBe('PMX');
    expect(parsed?.cargo).toBe('COAL');
  });
});

describe('Vessel Feasibility Engine', () => {
  it('should approve vessel when within all port physical parameters', () => {
    const res = VesselFeasibilityService.checkCompatibility({
      vessel: {
        loa: 225.0,
        beam: 32.2,
        summerDraft: 14.2,
        dwt: 75000
      },
      portConstraints: {
        maxLoa: 230.0,
        maxBeam: 33.0,
        maxDraft: 14.5,
        channelDraft: 15.0,
        berthDraft: 14.5,
        maxDwt: 80000
      }
    });

    expect(res.isFeasible).toBe(true);
    expect(res.violations.length).toBe(0);
  });

  it('should reject vessel and identify draft violation when exceeding harbor depth', () => {
    const res = VesselFeasibilityService.checkCompatibility({
      vessel: {
        loa: 290.0,
        beam: 45.0,
        summerDraft: 18.2,
        dwt: 180000
      },
      portConstraints: {
        maxLoa: 300.0,
        maxBeam: 50.0,
        maxDraft: 14.5, // Capesize draft exceeds 14.5m limit
        maxDwt: 200000
      }
    });

    expect(res.isFeasible).toBe(false);
    expect(res.draftCompatible).toBe(false);
    expect(res.violations.some(v => v.includes('Draft violation'))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOYAGE ECONOMICS ENGINE — 10-Component Cost Model (NUMERIC precision)
// ═══════════════════════════════════════════════════════════════════════════════
describe('Voyage Economics Engine', () => {
  /** Reference: 100,000 MT Coking Coal, Australia → Paradip, Panamax, $22.50/MT */
  const base = {
    distanceNm: 6200, speedKnots: 13.5, cargoQuantityMt: 100_000,
    freightRateUsdPerMt: 22.50, cargoLoadingRateMtDay: 30_000, cargoDischargingRateMtDay: 25_000,
    bunkerConsumptionMtDay: 38, bunkerPriceUsdMt: 620,
    portDuesUsd: 35_000, sternageUsd: 28_000, pilotageUsd: 12_000, towageUsd: 8_000, agencyFeeUsd: 6_000,
    commissionPct: 1.25,
  };

  it('gross freight = 100k MT × $22.50 = $2,250,000', () => {
    const r = VoyageEconomicsService.compute(base);
    expect(r.grossFreightUsd).toBe('2250000.00');
  });

  it('commission = 1.25% of gross = $28,125; net freight = $2,221,875', () => {
    const r = VoyageEconomicsService.compute(base);
    expect(r.commissionUsd).toBe('28125.00');
    expect(r.netFreightUsd).toBe('2221875.00');
  });

  it('sea days laden ≈ 19.136 (6200 NM ÷ 13.5 kn ÷ 24 h/day)', () => {
    const r = VoyageEconomicsService.compute(base);
    expect(parseFloat(r.seaDaysLaden)).toBeCloseTo(19.136, 2);
  });

  it('port charges = $35k + $28k + $12k + $8k + $6k = $89,000', () => {
    const r = VoyageEconomicsService.compute(base);
    expect(r.portChargesUsd).toBe('89000.00');
  });

  it('TCE is positive for a profitable voyage at market rate', () => {
    const r = VoyageEconomicsService.compute(base);
    expect(parseFloat(r.tceUsdDay)).toBeGreaterThan(0);
  });

  it('P&L is negative when freight rate is well below cost ($5/MT)', () => {
    const r = VoyageEconomicsService.compute({ ...base, freightRateUsdPerMt: 5 });
    expect(parseFloat(r.voyagePnlUsd)).toBeLessThan(0);
  });

  it('break-even > actual rate when voyage is unprofitable ($5/MT)', () => {
    const r = VoyageEconomicsService.compute({ ...base, freightRateUsdPerMt: 5 });
    expect(parseFloat(r.breakEvenFreightUsdMt)).toBeGreaterThan(5);
  });

  it('ballast leg adds sea days and bunker cost', () => {
    const with2k = VoyageEconomicsService.compute({ ...base, deadheadDistanceNm: 2000 });
    const without = VoyageEconomicsService.compute(base);
    expect(parseFloat(with2k.totalVoyageDays)).toBeGreaterThan(parseFloat(without.totalVoyageDays));
    expect(parseFloat(with2k.bunkerCostSeaUsd)).toBeGreaterThan(parseFloat(without.bunkerCostSeaUsd));
  });

  it('40% bunker price spike raises total cost and reduces margin', () => {
    const spike = VoyageEconomicsService.compute({ ...base, bunkerPriceUsdMt: 620 * 1.40 });
    const normal = VoyageEconomicsService.compute(base);
    expect(parseFloat(spike.totalVoyageCostUsd)).toBeGreaterThan(parseFloat(normal.totalVoyageCostUsd));
  });

  it('demurrage at 2.5 extra days × $18,000/day = $45,000', () => {
    const r = VoyageEconomicsService.compute({ ...base, demurrageRateUsdDay: 18_000, extraLoadingDays: 2.5 });
    expect(r.demurrageNetUsd).toBe('45000.00');
  });

  it('time-charter hire raises cost vs owned vessel (zero hire)', () => {
    const tc = VoyageEconomicsService.compute({ ...base, hireRateUsdDay: 15_000 });
    const owned = VoyageEconomicsService.compute(base);
    expect(parseFloat(tc.hireOrCapitalCostUsd)).toBeGreaterThan(parseFloat(owned.hireOrCapitalCostUsd));
  });

  it('5% tax on freight applies correctly', () => {
    const r = VoyageEconomicsService.compute({ ...base, taxPct: 5 });
    expect(parseFloat(r.taxUsd)).toBeCloseTo(2_250_000 * 0.05, 0);
  });

  it('does not throw on zero cargo quantity (edge case)', () => {
    expect(() => VoyageEconomicsService.compute({ ...base, cargoQuantityMt: 0 })).not.toThrow();
  });

  it('real-world: 75k MT coal, Brazil→Vizag, $19/MT → gross = $1,425,000', () => {
    const r = VoyageEconomicsService.compute({
      distanceNm: 8400, speedKnots: 13.0, cargoQuantityMt: 75_000,
      freightRateUsdPerMt: 19.00, cargoLoadingRateMtDay: 28_000, cargoDischargingRateMtDay: 22_000,
      bunkerConsumptionMtDay: 36, bunkerPriceUsdMt: 610,
      portDuesUsd: 32_000, sternageUsd: 25_000, pilotageUsd: 10_000, towageUsd: 7_000, agencyFeeUsd: 5_000,
      commissionPct: 1.25,
    });
    expect(r.grossFreightUsd).toBe('1425000.00');
    expect(parseFloat(r.seaDaysLaden)).toBeCloseTo(26.92, 1);
  });
});
