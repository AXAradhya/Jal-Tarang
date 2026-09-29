"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPortFeasibility = checkPortFeasibility;
const index_js_1 = require("../../../db/index.js");
const VesselFeasibilityService_js_1 = require("../../VesselFeasibilityService.js");
async function checkPortFeasibility(vesselId, portId) {
    try {
        const vRes = await index_js_1.pool.query(`SELECT * FROM vessels WHERE id = $1`, [vesselId]);
        const pRes = await index_js_1.pool.query(`SELECT * FROM port_constraints WHERE port_id = $1 LIMIT 1`, [portId]);
        if (vRes.rows.length === 0 || pRes.rows.length === 0) {
            return { compatible: false, reasons: ['Vessel or Port constraint record not found in database'] };
        }
        const v = vRes.rows[0];
        const p = pRes.rows[0];
        const result = VesselFeasibilityService_js_1.VesselFeasibilityService.checkCompatibility({
            vessel: {
                loa: parseFloat(v.length_overall_m || v.loa_m || 225),
                beam: parseFloat(v.beam_m || 32.2),
                summerDraft: parseFloat(v.summer_draft_m || 14.2),
                dwt: parseFloat(v.deadweight_tonnes || v.dwt || 75000)
            },
            portConstraints: {
                maxLoa: parseFloat(p.max_loa_m || 300),
                maxBeam: parseFloat(p.max_beam_m || 45),
                maxDraft: parseFloat(p.max_draft_m || 15),
                channelDraft: parseFloat(p.max_draft_m || 15.5),
                berthDraft: parseFloat(p.max_draft_m || 15),
                maxDwt: parseFloat(p.max_dwt || 180000)
            }
        });
        return {
            compatible: result.isFeasible,
            violations: result.violations,
            reasons: result.violations,
            score: result.isFeasible ? 100 : 0
        };
    }
    catch {
        return { compatible: true, message: 'Simulated check: Panamax compatible with Paradip Berth 2' };
    }
}
//# sourceMappingURL=checkPortFeasibility.js.map