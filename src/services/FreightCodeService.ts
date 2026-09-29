export interface FreightCodeInput {
  originCode: string;       // e.g. AUS (Australia)
  destinationCode: string;  // e.g. IND-EAST (East Coast India)
  vesselClassCode: string;  // e.g. PMX (Panamax)
  cargoCode: string;        // e.g. COAL (Coking/Steam Coal)
  freightTypeCode?: string; // default SPOT
}

export class FreightCodeService {
  /**
   * Generates a structured maritime freight code following standard industry convention:
   * FRT-{ORIGIN}-{DESTINATION}-{VESSEL_CLASS}-{CARGO}
   * Example: FRT-AUS-IND-EAST-PMX-COAL
   */
  public static generateCode(input: FreightCodeInput): string {
    const origin = input.originCode.toUpperCase().trim();
    const dest = input.destinationCode.toUpperCase().trim();
    const vessel = input.vesselClassCode.toUpperCase().trim();
    const cargo = input.cargoCode.toUpperCase().trim();

    return `FRT-${origin}-${dest}-${vessel}-${cargo}`;
  }

  /**
   * Validates if a structured freight code adheres strictly to the convention
   */
  public static validateCodeFormat(code: string): boolean {
    const regex = /^FRT-[A-Z0-9]+-[A-Z0-9-]+-[A-Z0-9]+-[A-Z0-9]+$/;
    return regex.test(code);
  }

  /**
   * Deconstructs a structured freight code into its constituent parts
   */
  public static parseCode(code: string): Record<string, string> | null {
    if (!this.validateCodeFormat(code)) {
      return null;
    }
    const parts = code.split('-');
    return {
      prefix: parts[0],
      origin: parts[1],
      destination: parts.slice(2, -2).join('-'),
      vesselClass: parts[parts.length - 2],
      cargo: parts[parts.length - 1],
    };
  }
}
