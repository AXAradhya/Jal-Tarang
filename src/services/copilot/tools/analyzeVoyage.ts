/**
 * Controlled Tool 6: analyzeVoyage
 * 10-Component Voyage Economics engine via Decimal.js.
 */

import { VoyageEconomicsService, VoyageEconomicsInput, VoyageEconomicsResult } from '../../VoyageEconomicsService.js';

export function analyzeVoyage(
  cargoQuantityMt: number,
  distanceNm: number,
  freightRateUsd: number,
  overrides?: Partial<VoyageEconomicsInput>
): VoyageEconomicsResult {
  return VoyageEconomicsService.compute({
    cargoQuantityMt,
    distanceNm,
    freightRateUsdPerMt: freightRateUsd,
    speedKnots: overrides?.speedKnots ?? 13.0,
    bunkerConsumptionMtDay: overrides?.bunkerConsumptionMtDay ?? 28.0,
    bunkerPriceUsdMt: overrides?.bunkerPriceUsdMt ?? 620.0,
    portDuesUsd: overrides?.portDuesUsd ?? 85000.0,
    operatingCostUsdDay: overrides?.operatingCostUsdDay ?? 8000.0,
    demurrageRateUsdDay: overrides?.demurrageRateUsdDay ?? 16000.0,
    extraDischargingDays: overrides?.extraDischargingDays ?? 2.0,
    ...overrides
  });
}
