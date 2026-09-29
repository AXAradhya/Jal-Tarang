export class FreightCodeService {
    /**
     * Generates a structured maritime freight code following standard industry convention:
     * FRT-{ORIGIN}-{DESTINATION}-{VESSEL_CLASS}-{CARGO}
     * Example: FRT-AUS-IND-EAST-PMX-COAL
     */
    static generateCode(input) {
        const origin = input.originCode.toUpperCase().trim();
        const dest = input.destinationCode.toUpperCase().trim();
        const vessel = input.vesselClassCode.toUpperCase().trim();
        const cargo = input.cargoCode.toUpperCase().trim();
        return `FRT-${origin}-${dest}-${vessel}-${cargo}`;
    }
    /**
     * Validates if a structured freight code adheres strictly to the convention
     */
    static validateCodeFormat(code) {
        const regex = /^FRT-[A-Z0-9]+-[A-Z0-9-]+-[A-Z0-9]+-[A-Z0-9]+$/;
        return regex.test(code);
    }
    /**
     * Deconstructs a structured freight code into its constituent parts
     */
    static parseCode(code) {
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
