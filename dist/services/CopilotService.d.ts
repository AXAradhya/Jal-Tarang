export interface CopilotToolResult {
    toolName: string;
    parameters: any;
    output: any;
    executedAt: string;
}
export interface CopilotResponse {
    query: string;
    answer: string;
    evidence: CopilotToolResult[];
    dataTimestamp: string;
    source: string;
    confidence: number;
    limitations: string;
    roleContext?: string;
    pageContext?: string;
    suggestedFollowups?: string[];
    model?: string;
    fallbackActive?: boolean;
}
export interface CopilotQueryOptions {
    role?: string;
    currentRole?: string;
    activeRole?: string;
    page?: string;
    currentRoute?: string;
    currency?: string;
}
export declare class CopilotService {
    private static readonly USD_TO_INR;
    private static formatMoney;
    private static formatRate;
    private static formatDaily;
    static searchPorts(query: string): Promise<any[]>;
    static searchVessels(vesselClass?: string, minDwt?: number): Promise<any[]>;
    static searchFreight(originCode: string, destinationCode: string): Promise<any[]>;
    static getForecast(freightCode?: string): Promise<any[]>;
    static checkPortFeasibility(vesselId: string, portId: string): Promise<import("./VesselFeasibilityService.js").FeasibilityResult | {
        compatible: boolean;
        reasons: string[];
        message?: undefined;
    } | {
        compatible: boolean;
        message: string;
        reasons?: undefined;
    }>;
    static analyzeVoyage(cargoQuantityMt: number, distanceNm: number, freightRateUsd: number): import("./VoyageEconomicsService.js").VoyageEconomicsResult;
    private static fallbackPorts;
    private static fallbackVessels;
    private static fallbackFreight;
    private static fallbackForecast;
    private static getLiveFleetStats;
    private static getLiveContractsStats;
    private static getLiveStockDays;
    private static queryOpenRouter;
    private static buildOpenRouterSystemPrompt;
    private static generateLocalFallbackAnswer;
    static answerQuery(userPrompt: string, options?: CopilotQueryOptions): Promise<CopilotResponse>;
}
