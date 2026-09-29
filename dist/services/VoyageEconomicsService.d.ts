export interface VoyageEconomicsInput {
    distanceNm: number;
    deadheadDistanceNm?: number;
    speedKnots: number;
    cargoQuantityMt: number;
    freightRateUsdPerMt: number;
    cargoLoadingRateMtDay?: number;
    cargoDischargingRateMtDay?: number;
    bunkerConsumptionMtDay: number;
    portBunkerConsumptionMtDay?: number;
    bunkerPriceUsdMt: number;
    hireRateUsdDay?: number;
    operatingCostUsdDay?: number;
    capitalCostUsdDay?: number;
    portDuesUsd?: number;
    sternageUsd?: number;
    pilotageUsd?: number;
    towageUsd?: number;
    agencyFeeUsd?: number;
    demurrageRateUsdDay?: number;
    despatchRateUsdDay?: number;
    extraLoadingDays?: number;
    extraDischargingDays?: number;
    miscCostUsd?: number;
    commissionPct?: number;
    taxPct?: number;
}
export interface VoyageEconomicsResult {
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
export declare class VoyageEconomicsService {
    static compute(input: VoyageEconomicsInput): VoyageEconomicsResult;
}
