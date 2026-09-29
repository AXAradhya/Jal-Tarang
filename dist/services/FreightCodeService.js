"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreightCodeService = void 0;
class FreightCodeService {
    static generateCode(input) {
        const origin = input.originCode.toUpperCase().trim();
        const dest = input.destinationCode.toUpperCase().trim();
        const vessel = input.vesselClassCode.toUpperCase().trim();
        const cargo = input.cargoCode.toUpperCase().trim();
        return `FRT-${origin}-${dest}-${vessel}-${cargo}`;
    }
    static validateCodeFormat(code) {
        const regex = /^FRT-[A-Z0-9]+-[A-Z0-9-]+-[A-Z0-9]+-[A-Z0-9]+$/;
        return regex.test(code);
    }
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
exports.FreightCodeService = FreightCodeService;
//# sourceMappingURL=FreightCodeService.js.map