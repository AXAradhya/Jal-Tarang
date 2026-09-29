export interface FreightCodeInput {
    originCode: string;
    destinationCode: string;
    vesselClassCode: string;
    cargoCode: string;
    freightTypeCode?: string;
}
export declare class FreightCodeService {
    static generateCode(input: FreightCodeInput): string;
    static validateCodeFormat(code: string): boolean;
    static parseCode(code: string): Record<string, string> | null;
}
