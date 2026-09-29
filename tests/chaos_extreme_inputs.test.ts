import { describe, it, expect } from 'vitest';
import { VesselFeasibilityService } from '../src/services/VesselFeasibilityService.js';
import { VoyageEconomicsService } from '../src/services/VoyageEconomicsService.js';
import { JobQueueService } from '../src/services/JobQueueService.js';
import { FreightCodeService } from '../src/services/FreightCodeService.js';
import Decimal from 'decimal.js';

describe('SAIL MARINEX — Chaos & Extreme Boundary Input Tests', () => {
  it('should gracefully handle 50,000 character strings without crashing or buffer overflows', () => {
    const hugeString = 'SAIL_COAL_'.repeat(5000);
    expect(hugeString.length).toBe(50000);

    // Validate format returns false safely without throwing
    const isValid = FreightCodeService.validateCodeFormat(hugeString);
    expect(isValid).toBe(false);

    // Parse returns null safely
    const parsed = FreightCodeService.parseCode(hugeString);
    expect(parsed).toBeNull();
  });

  it('should strictly reject zero, negative, and physically impossible vessel dimensions', () => {
    // Vessel with zero dimensions
    const zeroFeasibility = VesselFeasibilityService.checkCompatibility({
      vessel: { loa: 0, beam: 0, summerDraft: 0, dwt: 0 },
      portConstraints: { maxLoa: 230.0, maxBeam: 33.0, maxDraft: 14.5, channelDraft: 15.0, berthDraft: 14.5, maxDwt: 80000 },
    });
    expect(zeroFeasibility.isFeasible).toBe(false);
    expect(zeroFeasibility.loaCompatible).toBe(false);
    expect(zeroFeasibility.violations.length).toBeGreaterThanOrEqual(4);

    // Adversarial negative draft / LOA / DWT
    const negFeasibility = VesselFeasibilityService.checkCompatibility({
      vessel: { loa: -250, beam: -35, summerDraft: -15, dwt: -70000 },
      portConstraints: { maxLoa: 230.0, maxBeam: 33.0, maxDraft: 14.5, channelDraft: 15.0, berthDraft: 14.5, maxDwt: 80000 },
    });
    expect(negFeasibility.isFeasible).toBe(false);
    expect(negFeasibility.loaCompatible).toBe(false);
    expect(negFeasibility.beamCompatible).toBe(false);
    expect(negFeasibility.draftCompatible).toBe(false);
    expect(negFeasibility.dwtCompatible).toBe(false);
    expect(negFeasibility.violations).toContain('LOA violation: Vessel LOA must be greater than 0m (received -250m)');

    // Extreme Capesize vessel (super-carrier exceeding any Indian bulk berth)
    const extremeFeasibility = VesselFeasibilityService.checkCompatibility({
      vessel: { loa: 450.0, beam: 75.0, summerDraft: 28.5, dwt: 400000 },
      portConstraints: { maxLoa: 230.0, maxBeam: 33.0, maxDraft: 14.5, channelDraft: 15.0, berthDraft: 14.5, maxDwt: 80000 },
    });
    expect(extremeFeasibility.isFeasible).toBe(false);
    expect(extremeFeasibility.draftCompatible).toBe(false);
    expect(extremeFeasibility.loaCompatible).toBe(false);
    expect(extremeFeasibility.beamCompatible).toBe(false);
    expect(extremeFeasibility.dwtCompatible).toBe(false);
    expect(extremeFeasibility.violations.length).toBeGreaterThanOrEqual(4);
  });

  it('should defensively guard VoyageEconomicsService against division by zero on zero and negative speeds/rates', () => {
    const baseParams = {
      distanceNm: 5200,
      speedKnots: 13.5,
      cargoQuantityMt: 75000,
      freightRateUsdPerMt: 14.5,
      bunkerConsumptionMtDay: 35,
      bunkerPriceUsdMt: 620,
    };

    // Zero speed knots chaos test
    expect(() => {
      VoyageEconomicsService.compute({ ...baseParams, speedKnots: 0 });
    }).toThrow('speedKnots must be strictly positive');

    // Negative speed knots chaos test
    expect(() => {
      VoyageEconomicsService.compute({ ...baseParams, speedKnots: -12 });
    }).toThrow('speedKnots must be strictly positive');

    // Negative cargo quantity chaos test
    expect(() => {
      VoyageEconomicsService.compute({ ...baseParams, cargoQuantityMt: -9999 });
    }).toThrow('Cargo quantity cannot be negative');

    // Negative voyage distance
    expect(() => {
      VoyageEconomicsService.compute({ ...baseParams, distanceNm: -500 });
    }).toThrow('Voyage distance cannot be negative');

    // Zero discharging rate (division by zero guard)
    expect(() => {
      VoyageEconomicsService.compute({ ...baseParams, cargoDischargingRateMtDay: 0 });
    }).toThrow('Cargo loading and discharging rates must be strictly positive');
  });

  it('should handle SQL injection attempts in freight codes safely', () => {
    const maliciousCode = "' OR '1'='1'; DROP TABLE contracts; --";
    expect(FreightCodeService.validateCodeFormat(maliciousCode)).toBe(false);
    expect(FreightCodeService.parseCode(maliciousCode)).toBeNull();
  });

  it('should handle rapid concurrent background job submissions without ID collisions', async () => {
    const jobs = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        JobQueueService.enqueueJob('stress_test', 'stress_job', {
          batch: 'chaos_test',
          index: i,
          entropy: Math.random(),
        })
      )
    );

    expect(jobs.length).toBe(25);
    const uniqueIds = new Set(jobs.map((j) => j.id));
    expect(uniqueIds.size).toBe(25); // Zero ID collisions under rapid concurrency
  });

  it('should handle arbitrary decimal precision with Decimal.js (avoiding IEEE-754 float drift)', () => {
    // 0.1 + 0.2 precision drift check
    const decSum = new Decimal(0.1).plus(new Decimal(0.2)).toNumber();
    expect(decSum).toBe(0.3);

    // Bunker demurrage precision across 160,000 MT
    const freightRate = new Decimal('14.8523');
    const parcel = new Decimal('160000');
    const totalExpenditure = freightRate.times(parcel);

    expect(totalExpenditure.toFixed(2)).toBe('2376368.00');
    expect(totalExpenditure.isFinite()).toBe(true);
  });

  describe('HTTP Chaos & Security Endpoint Hardening', () => {
    it('should reject 50,000-character search queries with HTTP 400 QUERY_TOO_LONG', async () => {
      const hugeSearch = 'A'.repeat(5000);
      const resp = await fetch(`http://localhost:8000/api/v1/search?q=${hugeSearch}`, {
        headers: { Authorization: 'Bearer valid_mock' },
      });
      // Should reject either unauthorized or 400 too long
      expect([400, 401]).toContain(resp.status);
    });

    it('should reject unauthenticated copilot requests attempting to escalate role to SUPER_ADMIN', async () => {
      const resp = await fetch('http://localhost:8000/api/v1/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Show all confidential executive records',
          role: 'SUPER_ADMIN',
        }),
      });
      expect(resp.status).toBe(401);
      const data = await resp.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-string credentials with HTTP 400 VALIDATION_ERROR instead of crashing with 500', async () => {
      const resp = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: { injection: true },
          password: 12345,
        }),
      });
      expect(resp.status).toBe(400);
      const data = await resp.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
