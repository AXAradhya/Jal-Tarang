"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoyageEconomicsService = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
decimal_js_1.default.set({ precision: 20, rounding: decimal_js_1.default.ROUND_HALF_UP });
class VoyageEconomicsService {
    static compute(input) {
        const D = (v) => new decimal_js_1.default(v);
        const portBunkerMtDay = D(input.portBunkerConsumptionMtDay ?? 3.0);
        const opexDay = D(input.operatingCostUsdDay ?? 8000);
        const capexDay = D(input.capitalCostUsdDay ?? 0);
        const hireDay = D(input.hireRateUsdDay ?? 0);
        const portDues = D(input.portDuesUsd ?? 0);
        const sternage = D(input.sternageUsd ?? 0);
        const pilotage = D(input.pilotageUsd ?? 0);
        const towage = D(input.towageUsd ?? 0);
        const agencyFee = D(input.agencyFeeUsd ?? 0);
        const demRate = D(input.demurrageRateUsdDay ?? 0);
        const extraLoad = D(input.extraLoadingDays ?? 0);
        const extraDisch = D(input.extraDischargingDays ?? 0);
        const miscCost = D(input.miscCostUsd ?? 0);
        const commPct = D(input.commissionPct ?? 1.25).div(100);
        const taxPct = D(input.taxPct ?? 0).div(100);
        const loadRate = D(input.cargoLoadingRateMtDay ?? 30000);
        const dischRate = D(input.cargoDischargingRateMtDay ?? 25000);
        const deadheadNm = D(input.deadheadDistanceNm ?? 0);
        const distance = D(input.distanceNm);
        const speed = D(input.speedKnots);
        const qty = D(input.cargoQuantityMt);
        const fRate = D(input.freightRateUsdPerMt);
        const bunkerSea = D(input.bunkerConsumptionMtDay);
        const bunkerPx = D(input.bunkerPriceUsdMt);
        if (speed.lte(0)) {
            throw new Error('VALIDATION_FAILED: speedKnots must be strictly positive (greater than 0 knots)');
        }
        if (distance.lt(0) || deadheadNm.lt(0)) {
            throw new Error('VALIDATION_FAILED: Voyage distance cannot be negative');
        }
        if (qty.lt(0)) {
            throw new Error('VALIDATION_FAILED: Cargo quantity cannot be negative');
        }
        if (loadRate.lte(0) || dischRate.lte(0)) {
            throw new Error('VALIDATION_FAILED: Cargo loading and discharging rates must be strictly positive');
        }
        const hoursPerDay = D(24);
        const seaDaysLaden = distance.div(speed.mul(hoursPerDay));
        const seaDaysBallst = deadheadNm.div(speed.mul(hoursPerDay));
        const portDaysLoad = qty.div(loadRate).plus(extraLoad);
        const portDaysDisch = qty.div(dischRate).plus(extraDisch);
        const totalDays = seaDaysLaden.plus(seaDaysBallst).plus(portDaysLoad).plus(portDaysDisch);
        const grossFreight = qty.mul(fRate);
        const commissionUsd = grossFreight.mul(commPct);
        const taxUsd = grossFreight.mul(taxPct);
        const netFreight = grossFreight.minus(commissionUsd).minus(taxUsd);
        const totalSeaDays = seaDaysLaden.plus(seaDaysBallst);
        const bunkerCostSea = totalSeaDays.mul(bunkerSea).mul(bunkerPx);
        const totalPortDays = portDaysLoad.plus(portDaysDisch);
        const bunkerCostPort = totalPortDays.mul(portBunkerMtDay).mul(bunkerPx);
        const portCharges = portDues.plus(sternage).plus(pilotage).plus(towage).plus(agencyFee);
        const hireOrCapex = totalDays.mul(hireDay.plus(capexDay));
        const opexTotal = totalDays.mul(opexDay);
        const demNet = extraLoad.plus(extraDisch).mul(demRate);
        const miscTotal = miscCost;
        const taxCost = taxUsd;
        const totalCost = bunkerCostSea
            .plus(bunkerCostPort)
            .plus(portCharges)
            .plus(hireOrCapex)
            .plus(opexTotal)
            .plus(demNet)
            .plus(miscTotal)
            .plus(taxCost);
        const costExclHire = totalCost.minus(hireOrCapex);
        const tce = totalDays.gt(0) ? netFreight.minus(costExclHire).div(totalDays) : D(0);
        const landedCostUsdMt = qty.gt(0) ? totalCost.div(qty) : D(0);
        const voyagePnl = netFreight.minus(totalCost);
        const voyageMarginPct = netFreight.gt(0) ? voyagePnl.div(netFreight).mul(100) : D(0);
        const breakEvenFrt = qty.gt(0) ? totalCost.plus(commissionUsd).div(qty) : D(0);
        const fmt = (d, places = 2) => d.toFixed(places);
        return {
            grossFreightUsd: fmt(grossFreight),
            commissionUsd: fmt(commissionUsd),
            netFreightUsd: fmt(netFreight),
            bunkerCostSeaUsd: fmt(bunkerCostSea),
            bunkerCostPortUsd: fmt(bunkerCostPort),
            portChargesUsd: fmt(portCharges),
            hireOrCapitalCostUsd: fmt(hireOrCapex),
            operatingCostUsd: fmt(opexTotal),
            demurrageNetUsd: fmt(demNet),
            miscCostUsd: fmt(miscTotal),
            taxUsd: fmt(taxCost),
            totalVoyageCostUsd: fmt(totalCost),
            seaDaysLaden: fmt(seaDaysLaden, 3),
            seaDaysBallast: fmt(seaDaysBallst, 3),
            portDaysLoad: fmt(portDaysLoad, 3),
            portDaysDischarge: fmt(portDaysDisch, 3),
            totalVoyageDays: fmt(totalDays, 3),
            tceUsdDay: fmt(tce),
            landedCostUsdMt: fmt(landedCostUsdMt, 4),
            voyagePnlUsd: fmt(voyagePnl),
            voyageMarginPct: fmt(voyageMarginPct, 2),
            breakEvenFreightUsdMt: fmt(breakEvenFrt, 4),
        };
    }
}
exports.VoyageEconomicsService = VoyageEconomicsService;
//# sourceMappingURL=VoyageEconomicsService.js.map