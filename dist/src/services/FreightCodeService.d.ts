export interface FreightCodeInput {
    originCode: string;
    destinationCode: string;
    vesselClassCode: string;
    cargoCode: string;
    freightTypeCode?: string;
}
export declare class FreightCodeService {
    /**
     * Generates a structured maritime freight code following standard industry convention:
     * FRT-{ORIGIN}-{DESTINATION}-{VESSEL_CLASS}-{CARGO}
     * Example: FRT-AUS-IND-EAST-PMX-COAL
     */
    static generateCode(input: FreightCodeInput): string;
    /**
     * Validates if a structured freight code adheres strictly to the convention
     */
    static validateCodeFormat(code: string): boolean;
    /**
     * Deconstructs a structured freight code into its constituent parts
     */
    static parseCode(code: string): Record<string, string> | null;
}
