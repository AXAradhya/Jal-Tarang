export class VesselFeasibilityService {
    /**
     * Assesses vessel physical dimensions against port and berth constraints
     */
    static checkCompatibility(params) {
        const { vessel, portConstraints } = params;
        const violations = [];
        // 1. Check LOA
        const loaCompatible = !portConstraints.maxLoa || vessel.loa <= portConstraints.maxLoa;
        if (!loaCompatible) {
            violations.push(`LOA violation: Vessel LOA ${vessel.loa}m exceeds maximum allowed ${portConstraints.maxLoa}m`);
        }
        // 2. Check Beam
        const beamCompatible = !portConstraints.maxBeam || vessel.beam <= portConstraints.maxBeam;
        if (!beamCompatible) {
            violations.push(`Beam violation: Vessel Beam ${vessel.beam}m exceeds maximum allowed ${portConstraints.maxBeam}m`);
        }
        // 3. Check Draft (channel and berth)
        const effectiveMaxDraft = Math.min(portConstraints.maxDraft ?? Infinity, portConstraints.channelDraft ?? Infinity, portConstraints.berthDraft ?? Infinity);
        const draftCompatible = effectiveMaxDraft === Infinity || vessel.summerDraft <= effectiveMaxDraft;
        if (!draftCompatible) {
            violations.push(`Draft violation: Vessel draft ${vessel.summerDraft}m exceeds effective limit ${effectiveMaxDraft}m`);
        }
        // 4. Check DWT
        const dwtCompatible = !portConstraints.maxDwt || vessel.dwt <= portConstraints.maxDwt;
        if (!dwtCompatible) {
            violations.push(`DWT violation: Vessel DWT ${vessel.dwt} MT exceeds maximum allowed ${portConstraints.maxDwt} MT`);
        }
        const isFeasible = loaCompatible && beamCompatible && draftCompatible && dwtCompatible;
        return {
            isFeasible,
            loaCompatible,
            beamCompatible,
            draftCompatible,
            dwtCompatible,
            violations,
        };
    }
}
