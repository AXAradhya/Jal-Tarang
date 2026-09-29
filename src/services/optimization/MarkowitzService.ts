/**
 * JAL TARANG — Modern Portfolio Theory (Markowitz) Chartering Allocation Service
 *
 * Models Spot market exposure as a high-volatility asset and COA as a lower-volatility hedging instrument.
 * Computes the Efficient Frontier of expected landed freight cost vs. rate variance,
 * deriving the mathematically optimal spot/COA volume split per quarter per trade lane.
 */

export interface MarkowitzOptimizationInput {
  spotExpectedRateUsdMt: number;
  spotRateVariance: number;         // (std_dev)^2 of spot rate distribution
  coaExpectedRateUsdMt: number;      // Fixed COA contract rate
  coaRateVariance?: number;         // Low residual variance (default ~0.05 for operational demurrage fluctuations)
  correlationSpotCoa?: number;      // Empirical covariance factor (default ~0.35)
  totalQuarterlyVolumeMt: number;   // e.g. 2,100,000 MT for SAIL quarterly coal requirements
  riskAversionFactor?: number;      // Lambda: 0.0 (pure cost minimizer) to 1.0 (pure risk minimizer), default 0.50
  frontierPointsCount?: number;     // Number of points to plot on efficient frontier curve
}

export interface EfficientFrontierPoint {
  coaAllocationPct: number;
  spotAllocationPct: number;
  expectedPortfolioCostUsdMt: number;
  portfolioRiskStdDev: number;
  totalCostUsd: number;
}

export interface MarkowitzOptimizationResult {
  optimalSpotPct: number;
  optimalCoaPct: number;
  optimalSpotVolumeMt: number;
  optimalCoaVolumeMt: number;
  portfolioExpectedRateUsdMt: number;
  portfolioRiskStdDev: number;
  unhedgedSpotRiskStdDev: number;
  riskReductionPct: number;
  totalFreightBudgetUsd: number;
  efficientFrontier: EfficientFrontierPoint[];
  recommendedStrategy: string;
}

export class MarkowitzService {
  /**
   * Computes the mean-variance optimal spot vs COA volume allocation
   */
  public static optimize(input: MarkowitzOptimizationInput): MarkowitzOptimizationResult {
    const rSpot = input.spotExpectedRateUsdMt;
    const varSpot = input.spotRateVariance > 0 ? input.spotRateVariance : Math.pow(rSpot * 0.25, 2);
    const rCoa = input.coaExpectedRateUsdMt;
    const varCoa = input.coaRateVariance ?? Math.pow(rCoa * 0.05, 2);
    const corr = input.correlationSpotCoa ?? 0.30;
    const covar = corr * Math.sqrt(varSpot) * Math.sqrt(varCoa);

    const volume = input.totalQuarterlyVolumeMt;
    const lambda = Math.min(1.0, Math.max(0.0, input.riskAversionFactor ?? 0.50));
    const pointsCount = input.frontierPointsCount ?? 21;

    // Generate Efficient Frontier curve by sweeping COA allocation from 0% to 100%
    const frontier: EfficientFrontierPoint[] = [];

    for (let i = 0; i < pointsCount; i++) {
      const wCoa = i / (pointsCount - 1);
      const wSpot = 1.0 - wCoa;

      const expCost = wSpot * rSpot + wCoa * rCoa;
      const portVariance = Math.pow(wSpot, 2) * varSpot + Math.pow(wCoa, 2) * varCoa + 2 * wSpot * wCoa * covar;
      const portStdDev = Math.sqrt(Math.max(0, portVariance));

      frontier.push({
        coaAllocationPct: Math.round(wCoa * 100),
        spotAllocationPct: Math.round(wSpot * 100),
        expectedPortfolioCostUsdMt: Number(expCost.toFixed(2)),
        portfolioRiskStdDev: Number(portStdDev.toFixed(2)),
        totalCostUsd: Math.round(expCost * volume),
      });
    }

    // Solve for optimal allocation weight minimizing the objective:
    // U(w) = Expected_Cost + lambda * (Risk_Penalty)
    // where Risk_Penalty = portVariance
    // dU/dwCoa = (rCoa - rSpot) + 2*lambda * [wCoa*varCoa - (1-wCoa)*varSpot + (1 - 2*wCoa)*covar] = 0
    let bestCoaWeight = 0.5;
    let minUtility = Infinity;

    // Numerical sweep across continuous weights for exact constraint enforcement [0, 1]
    for (let w = 0; w <= 1.001; w += 0.005) {
      const wCoa = Math.min(1.0, w);
      const wSpot = 1.0 - wCoa;

      const expCost = wSpot * rSpot + wCoa * rCoa;
      const portVariance = Math.pow(wSpot, 2) * varSpot + Math.pow(wCoa, 2) * varCoa + 2 * wSpot * wCoa * covar;
      const portStdDev = Math.sqrt(portVariance);

      // Utility score balancing expected freight cost and volatility penalty
      // Normalize cost and risk terms
      const costTerm = expCost / rSpot;
      const riskTerm = portStdDev / Math.sqrt(varSpot);
      const utility = (1.0 - lambda) * costTerm + lambda * riskTerm;

      if (utility < minUtility) {
        minUtility = utility;
        bestCoaWeight = wCoa;
      }
    }

    // Default to at least 25% spot for operational flexibility and 40% COA for baseload stability
    bestCoaWeight = Math.min(0.85, Math.max(0.15, bestCoaWeight));
    const bestSpotWeight = 1.0 - bestCoaWeight;

    const optCoaPct = Math.round(bestCoaWeight * 100);
    const optSpotPct = 100 - optCoaPct;

    const optRate = (optSpotPct / 100) * rSpot + (optCoaPct / 100) * rCoa;
    const optVar = Math.pow(optSpotPct / 100, 2) * varSpot +
                   Math.pow(optCoaPct / 100, 2) * varCoa +
                   2 * (optSpotPct / 100) * (optCoaPct / 100) * covar;
    const optStdDev = Math.sqrt(optVar);
    const unhedgedStdDev = Math.sqrt(varSpot);
    const riskReductionPct = ((unhedgedStdDev - optStdDev) / unhedgedStdDev) * 100;

    const recStrategy = `Model recommends locking ${optCoaPct}% of quarterly volume under COA at $${rCoa.toFixed(2)}/MT while retaining ${optSpotPct}% spot exposure. Reduces freight rate standard deviation from $${unhedgedStdDev.toFixed(2)}/MT to $${optStdDev.toFixed(2)}/MT (${riskReductionPct.toFixed(1)}% risk reduction) with expected weighted rate of $${optRate.toFixed(2)}/MT.`;

    return {
      optimalSpotPct: optSpotPct,
      optimalCoaPct: optCoaPct,
      optimalSpotVolumeMt: Math.round((optSpotPct / 100) * volume),
      optimalCoaVolumeMt: Math.round((optCoaPct / 100) * volume),
      portfolioExpectedRateUsdMt: Number(optRate.toFixed(2)),
      portfolioRiskStdDev: Number(optStdDev.toFixed(2)),
      unhedgedSpotRiskStdDev: Number(unhedgedStdDev.toFixed(2)),
      riskReductionPct: Number(riskReductionPct.toFixed(1)),
      totalFreightBudgetUsd: Math.round(optRate * volume),
      efficientFrontier: frontier,
      recommendedStrategy: recStrategy,
    };
  }
}
