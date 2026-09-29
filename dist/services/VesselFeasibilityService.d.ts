export interface FeasibilityCheckParams {
    vessel: {
        loa: number;
        beam: number;
        summerDraft: number;
        dwt: number;
    };
    portConstraints: {
        maxLoa?: number;
        maxBeam?: number;
        maxDraft?: number;
        channelDraft?: number;
        berthDraft?: number;
        maxDwt?: number;
    };
}
export interface FeasibilityResult {
    isFeasible: boolean;
    loaCompatible: boolean;
    beamCompatible: boolean;
    draftCompatible: boolean;
    dwtCompatible: boolean;
    violations: string[];
}
export declare class VesselFeasibilityService {
    static checkCompatibility(params: FeasibilityCheckParams): FeasibilityResult;
}
