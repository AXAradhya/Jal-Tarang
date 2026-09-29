"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchVessels = searchVessels;
const index_js_1 = require("../../../db/index.js");
async function searchVessels(vesselClass, minDwt) {
    try {
        let q = `SELECT id, imo_number, vessel_name as name, vessel_class, deadweight_tonnes as dwt,
                    summer_draft_m, length_overall_m as loa_m, beam_m, year_built as build_year,
                    status
             FROM vessels WHERE 1=1`;
        const params = [];
        if (vesselClass) {
            params.push(vesselClass.toUpperCase());
            q += ` AND UPPER(vessel_class) = $${params.length}`;
        }
        if (minDwt) {
            params.push(minDwt);
            q += ` AND deadweight_tonnes >= $${params.length}`;
        }
        q += ` ORDER BY deadweight_tonnes DESC LIMIT 6`;
        const res = await index_js_1.pool.query(q, params);
        return res.rows.length > 0 ? res.rows : fallbackVessels();
    }
    catch {
        return fallbackVessels();
    }
}
function fallbackVessels() {
    return [
        { id: 'v-1', imo_number: '9876543', name: 'MV SAIL EXCELLENCE', vessel_class: 'PANAMAX', dwt: 75000, summer_draft_m: 14.2, loa_m: 225.0, beam_m: 32.2, build_year: 2021, flag: 'India', status: 'AVAILABLE' },
        { id: 'v-2', imo_number: '9876544', name: 'MV BHARAT PRIDE', vessel_class: 'CAPESIZE', dwt: 180000, summer_draft_m: 18.2, loa_m: 292.0, beam_m: 45.0, build_year: 2020, flag: 'India', status: 'IN_TRANSIT' },
        { id: 'v-3', imo_number: '9876545', name: 'MV OCEAN FORTUNE', vessel_class: 'SUPRAMAX', dwt: 58000, summer_draft_m: 12.8, loa_m: 190.0, beam_m: 32.2, build_year: 2019, flag: 'Panama', status: 'AVAILABLE' }
    ];
}
//# sourceMappingURL=searchVessels.js.map