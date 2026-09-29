"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeVoyage = analyzeVoyage;
const VoyageEconomicsService_js_1 = require("../../VoyageEconomicsService.js");
function analyzeVoyage(cargoQuantityMt, distanceNm, freightRateUsd, overrides) {
    return VoyageEconomicsService_js_1.VoyageEconomicsService.compute({
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
//# sourceMappingURL=analyzeVoyage.js.map