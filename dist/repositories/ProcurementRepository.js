"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementRepository = void 0;
const index_js_1 = require("../db/index.js");
class ProcurementRepository {
    static async list(limit = 50) {
        const res = await index_js_1.pool.query(`SELECT pr.id, pr.requirement_reference, pr.quantity_required_mt, pr.quantity_procured_mt,
              pr.destination_plant, pr.required_delivery_date, pr.status, pr.priority, pr.created_at,
              c.commodity_name
       FROM procurement_requirements pr
       LEFT JOIN commodities c ON c.id = pr.commodity_id
       WHERE pr.deleted_at IS NULL
       ORDER BY pr.created_at DESC
       LIMIT $1`, [limit]);
        return res.rows;
    }
    static async findById(id) {
        const res = await index_js_1.pool.query(`SELECT pr.*, c.commodity_name
       FROM procurement_requirements pr
       LEFT JOIN commodities c ON c.id = pr.commodity_id
       WHERE pr.id = $1 AND pr.deleted_at IS NULL
       LIMIT 1`, [id]);
        return res.rows[0] || null;
    }
    static async findByOrg(orgId, limit = 20) {
        const res = await index_js_1.pool.query(`SELECT pr.*, ct.cargo_type_name
       FROM procurement_requirements pr
       LEFT JOIN cargo_types ct ON ct.id = pr.cargo_type_id
       WHERE pr.organization_id = $1
       ORDER BY pr.created_at DESC LIMIT $2`, [orgId, limit]);
        return res.rows;
    }
    static async getPlantStock() {
        const plants = [
            { id: 'BSP', plant: 'Bhilai Steel Plant (BSP)', currentDays: 14.5, safeBuffer: 21, material: 'Coking Coal', monthlyConsumptionMt: 420000 },
            { id: 'BSL', plant: 'Bokaro Steel Plant (BSL)', currentDays: 23.0, safeBuffer: 21, material: 'Coking Coal', monthlyConsumptionMt: 360000 },
            { id: 'RSP', plant: 'Rourkela Steel Plant (RSP)', currentDays: 28.2, safeBuffer: 21, material: 'Iron Ore Fines', monthlyConsumptionMt: 290000 },
            { id: 'DSP', plant: 'Durgapur Steel Plant (DSP)', currentDays: 13.8, safeBuffer: 21, material: 'Coking Coal', monthlyConsumptionMt: 210000 },
            { id: 'ISP', plant: 'IISCO Steel Plant (ISP)', currentDays: 19.4, safeBuffer: 21, material: 'Coking Coal & Limestone', monthlyConsumptionMt: 180000 },
        ].map((p) => ({
            ...p,
            status: p.currentDays < 15 ? 'CRITICAL' : p.currentDays < 21 ? 'WATCH' : 'NORMAL',
            cushionDeltaDays: +(p.currentDays - p.safeBuffer).toFixed(1),
        }));
        return plants;
    }
}
exports.ProcurementRepository = ProcurementRepository;
//# sourceMappingURL=ProcurementRepository.js.map