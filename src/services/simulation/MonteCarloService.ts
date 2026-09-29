/**
 * JAL TARANG — Spot vs. COA Monte Carlo Simulator Service
 *
 * Implements 10,000-path stochastic simulation of dry bulk freight rates
 * to quantitatively evaluate Contracts of Affreightment (COA) versus spot procurement.
 * Calibrated against Baltic Exchange BCI historical volatility and Drewry/Clarksons COA tenor discounts.
 */

import Decimal from 'decimal.js';

export interface MonteCarloSimulationInput {
  currentSpotRateUsdPerMt: number;
  cargoQuantityMt: number;
  tenorMonths?: 3 | 6 | 12;
  annualizedVolatility?: number; // e.g. 0.28 for Capesize BCI, 0.22 for Panamax BPI
  numSimulations?: number;       // Default 10,000
  usdToInrRate?: number;         // Default 83.50
  fixedCoaRateDiscountPct?: number; // Optional user override, otherwise tenor default
}

export interface MonteCarloSimulationResult {
  tenorMonths: number;
  numSimulations: number;
  currentSpotRateUsdPerMt: number;
  recommendedCoaRateUsdPerMt: number;
  breakevenRateUsdPerMt: number;
  coaDiscountPct: number;
  probabilityCoaOutperformsSpotPct: number;
  expectedSpotExpenditureUsd: number;
  fixedCoaExpenditureUsd: number;
  expectedNetSavingsUsd: number;
  expectedNetSavingsInrCrore: number;
  percentilesUsd: {
    p5: number;
    p25: number;
    median: number;
    p75: number;
    p95: number;
  };
  valueAtRisk95Usd: number;
  recommendationSignal: 'STRONG_COA' | 'LEAN_COA' | 'NEUTRAL' | 'LEAN_SPOT' | 'STRONG_SPOT';
  signalColor: 'GREEN' | 'AMBER' | 'RED';
  decisionRationale: string;
}

export class MonteCarloService {
  /**
   * Default empirical tenor discounts calibrated against Clarksons / Drewry shipping benchmarks
   */
  private static readonly TENOR_DISCOUNTS: Record<number, { min: number; max: number; mean: number }> = {
    3: { min: 0.03, max: 0.07, mean: 0.05 },    // 3–7% below spot
    6: { min: 0.07, max: 0.12, mean: 0.095 },   // 7–12% below spot
    12: { min: 0.10, max: 0.15, mean: 0.125 },  // 10–15% below spot
  };

  /**
   * Generates standard normal random numbers using the Box-Muller transform
   */
  private static randomNormal(): number {
    let u1 = 0;
    let u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  /**
   * Executes 10,000-path Monte Carlo simulation for Spot vs. COA freight economics
   */
  public static simulate(input: MonteCarloSimulationInput): MonteCarloSimulationResult {
    const spot = input.currentSpotRateUsdPerMt;
    const qty = input.cargoQuantityMt;
    const tenor = input.tenorMonths ?? 6;
    const numSims = input.numSimulations ?? 10000;
    const vol = input.annualizedVolatility ?? 0.28;
    const fxRate = input.usdToInrRate ?? 83.50;

    if (spot <= 0 || qty <= 0) {
      throw new Error('INVALID_INPUT: currentSpotRateUsdPerMt and cargoQuantityMt must be positive.');
    }

    const tenorConfig = this.TENOR_DISCOUNTS[tenor] || this.TENOR_DISCOUNTS[6];
    const discountPct = input.fixedCoaRateDiscountPct !== undefined
      ? input.fixedCoaRateDiscountPct / 100
      : tenorConfig.mean;

    // Locked COA Rate: e.g. Spot * (1 - 0.095)
    const coaRate = spot * (1.0 - discountPct);
    const coaTotalExpenditure = coaRate * qty;

    // Time horizon in years (e.g. 6/12 = 0.5 year)
    const timeHorizonYears = tenor / 12.0;
    const dt = timeHorizonYears / (tenor * 4); // Weekly evaluation steps
    const numSteps = Math.max(4, tenor * 4);

    const savingsList: number[] = new Array(numSims);
    let outperformanceCount = 0;
    let totalSpotExpenditureSum = 0;

    // Mean-reversion parameter (Ornstein-Uhlenbeck / GBM hybrid for freight rates)
    const drift = 0.01; // Slight upward bias reflecting global bunker / carbon inflation
    const meanReversionSpeed = 0.35;
    const longTermMean = spot * 1.02;

    for (let i = 0; i < numSims; i++) {
      let currentRate = spot;
      let pathRateSum = 0;

      for (let s = 0; s < numSteps; s++) {
        const dW = Math.sqrt(dt) * this.randomNormal();
        const reversionDrift = meanReversionSpeed * (longTermMean - currentRate) * dt;
        const diffusion = vol * currentRate * dW;
        currentRate += reversionDrift + currentRate * drift * dt + diffusion;
        // Floor rate to operational bunker + vessel operating cost limit ($7.50/MT)
        currentRate = Math.max(7.50, currentRate);
        pathRateSum += currentRate;
      }

      const avgPathSpotRate = pathRateSum / numSteps;
      const pathSpotExpenditure = avgPathSpotRate * qty;
      totalSpotExpenditureSum += pathSpotExpenditure;

      const netSaving = pathSpotExpenditure - coaTotalExpenditure;
      savingsList[i] = netSaving;

      if (netSaving >= 0) {
        outperformanceCount++;
      }
    }

    // Sort savings for percentile calculations
    savingsList.sort((a, b) => a - b);

    const p5 = savingsList[Math.floor(numSims * 0.05)];
    const p25 = savingsList[Math.floor(numSims * 0.25)];
    const median = savingsList[Math.floor(numSims * 0.50)];
    const p75 = savingsList[Math.floor(numSims * 0.75)];
    const p95 = savingsList[Math.floor(numSims * 0.95)];

    const expectedSpotExpenditure = totalSpotExpenditureSum / numSims;
    const expectedNetSavingsUsd = expectedSpotExpenditure - coaTotalExpenditure;
    const expectedNetSavingsInrCrore = (expectedNetSavingsUsd * fxRate) / 10000000;
    const probCoaOutperforms = (outperformanceCount / numSims) * 100;

    // Breakeven rate is equal to the locked COA rate
    const breakevenRate = coaRate;

    // 95% Value at Risk (VaR): worst-case downside relative to expectation
    const valueAtRisk95Usd = Math.max(0, -p5);

    // Formulate actionable procurement signal
    let signal: 'STRONG_COA' | 'LEAN_COA' | 'NEUTRAL' | 'LEAN_SPOT' | 'STRONG_SPOT';
    let color: 'GREEN' | 'AMBER' | 'RED';
    let rationale = '';

    if (probCoaOutperforms >= 75) {
      signal = 'STRONG_COA';
      color = 'GREEN';
      rationale = `High confidence (${probCoaOutperforms.toFixed(1)}% win probability). Locking a ${tenor}-month COA at $${coaRate.toFixed(2)}/MT (${(discountPct * 100).toFixed(1)}% below spot) yields expected savings of ₹${expectedNetSavingsInrCrore.toFixed(1)} Cr ($${(expectedNetSavingsUsd / 1e6).toFixed(2)}M) vs. spot exposure.`;
    } else if (probCoaOutperforms >= 60) {
      signal = 'LEAN_COA';
      color = 'GREEN';
      rationale = `Moderate advantage (${probCoaOutperforms.toFixed(1)}% win probability). Recommend locking at least 60% of volume under ${tenor}-month COA to hedge upside rate spikes while maintaining 40% spot flexibility.`;
    } else if (probCoaOutperforms >= 45) {
      signal = 'NEUTRAL';
      color = 'AMBER';
      rationale = `Balanced market (${probCoaOutperforms.toFixed(1)}% win probability). Spot and COA are near financial parity. Recommend hybrid tranche allocation.`;
    } else if (probCoaOutperforms >= 30) {
      signal = 'LEAN_SPOT';
      color = 'AMBER';
      rationale = `Rates expected to soften. Favor spot charters on 7–14 day market dips unless shipowner offers COA discount > 12%.`;
    } else {
      signal = 'STRONG_SPOT';
      color = 'RED';
      rationale = `Downside market cycle. Keep 100% volume in spot charters to capture falling freight rates. Avoid fixed COA commitments.`;
    }

    return {
      tenorMonths: tenor,
      numSimulations: numSims,
      currentSpotRateUsdPerMt: Number(spot.toFixed(2)),
      recommendedCoaRateUsdPerMt: Number(coaRate.toFixed(2)),
      breakevenRateUsdPerMt: Number(breakevenRate.toFixed(2)),
      coaDiscountPct: Number((discountPct * 100).toFixed(1)),
      probabilityCoaOutperformsSpotPct: Number(probCoaOutperforms.toFixed(1)),
      expectedSpotExpenditureUsd: Math.round(expectedSpotExpenditure),
      fixedCoaExpenditureUsd: Math.round(coaTotalExpenditure),
      expectedNetSavingsUsd: Math.round(expectedNetSavingsUsd),
      expectedNetSavingsInrCrore: Number(expectedNetSavingsInrCrore.toFixed(2)),
      percentilesUsd: {
        p5: Math.round(p5),
        p25: Math.round(p25),
        median: Math.round(median),
        p75: Math.round(p75),
        p95: Math.round(p95),
      },
      valueAtRisk95Usd: Math.round(valueAtRisk95Usd),
      recommendationSignal: signal,
      signalColor: color,
      decisionRationale: rationale,
    };
  }
}
