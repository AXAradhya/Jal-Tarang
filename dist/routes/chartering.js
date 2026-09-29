"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const index_js_2 = require("../types/index.js");
const BackhaulMatcherService_js_1 = require("../services/chartering/BackhaulMatcherService.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticate);
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 25, status, charterType, vesselType } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const conditions = ['c.organization_id = $1'];
        const params = [req.user.organizationId];
        let idx = 2;
        if (status) {
            conditions.push(`c.status = $${idx}`);
            params.push(status);
            idx++;
        }
        if (charterType) {
            conditions.push(`c.charter_type = $${idx}`);
            params.push(charterType);
            idx++;
        }
        if (vesselType) {
            conditions.push(`v.vessel_type = $${idx}`);
            params.push(vesselType);
            idx++;
        }
        const where = conditions.join(' AND ');
        const [countRes, charterRes] = await Promise.all([
            index_js_1.pool.query(`SELECT COUNT(DISTINCT c.id) FROM contracts c LEFT JOIN vessels v ON v.id = c.vessel_id WHERE ${where}`, params),
            index_js_1.pool.query(`SELECT c.id, c.contract_reference, c.charter_type, c.contract_type, c.status,
                c.laycan_start, c.laycan_end, c.loading_port_id, c.discharging_port_id,
                c.cargo_quantity_mt, c.freight_rate_usd, c.freight_rate_basis,
                c.total_freight_usd, c.demurrage_rate_usd_day, c.despatch_rate_usd_day,
                c.hire_rate_usd_day, c.contract_date, c.fixture_date, c.created_at,
                v.vessel_name, v.imo_number, v.vessel_type, v.vessel_class, v.deadweight_tonnes,
                lp.port_name AS loading_port, lp.un_locode AS loading_locode,
                dp.port_name AS discharging_port, dp.un_locode AS discharging_locode,
                co.company_name AS charterer_name,
                bo.company_name AS owner_name,
                u.display_name AS created_by_name
         FROM contracts c
         LEFT JOIN vessels v ON v.id = c.vessel_id
         LEFT JOIN ports lp ON lp.id = c.loading_port_id
         LEFT JOIN ports dp ON dp.id = c.discharging_port_id
         LEFT JOIN counterparties co ON co.id = c.charterer_id
         LEFT JOIN counterparties bo ON bo.id = c.owner_id
         LEFT JOIN users u ON u.id = c.created_by
         WHERE ${where}
         ORDER BY c.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`, [...params, Number(limit), offset]),
        ]);
        return res.json({
            success: true,
            data: charterRes.rows,
            meta: { total: parseInt(countRes.rows[0].count), page: Number(page), limit: Number(limit), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / Number(limit)) },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const [contractRes, voyagesRes, costRes] = await Promise.all([
            index_js_1.pool.query(`SELECT c.*,
                v.vessel_name, v.imo_number, v.vessel_type, v.vessel_class, v.deadweight_tonnes,
                v.length_overall_m, v.beam_m, v.summer_draft_m,
                lp.port_name AS loading_port, lp.un_locode AS loading_locode,
                dp.port_name AS discharging_port, dp.un_locode AS discharging_locode,
                co.company_name AS charterer_name, co.country_id AS charterer_country,
                bo.company_name AS owner_name,
                u.display_name AS created_by_name,
                cp.cargo_reference_no, cp.quantity_mt AS cargo_quantity,
                ct.cargo_type_name
         FROM contracts c
         LEFT JOIN vessels v ON v.id = c.vessel_id
         LEFT JOIN ports lp ON lp.id = c.loading_port_id
         LEFT JOIN ports dp ON dp.id = c.discharging_port_id
         LEFT JOIN counterparties co ON co.id = c.charterer_id
         LEFT JOIN counterparties bo ON bo.id = c.owner_id
         LEFT JOIN users u ON u.id = c.created_by
         LEFT JOIN cargo_parcels cp ON cp.id = c.cargo_parcel_id
         LEFT JOIN cargo_types ct ON ct.id = cp.cargo_type_id
         WHERE c.id = $1 AND c.organization_id = $2`, [req.params.id, req.user.organizationId]),
            index_js_1.pool.query(`SELECT id, voyage_number, status, etd, eta, atd, ata, cargo_quantity_mt, freight_rate_usd_per_mt, total_freight_usd
         FROM voyages WHERE contract_id = $1 ORDER BY created_at DESC`, [req.params.id]),
            index_js_1.pool.query(`SELECT cost_category, SUM(amount_usd) AS total_usd
         FROM voyage_costs WHERE contract_id = $1 GROUP BY cost_category ORDER BY total_usd DESC`, [req.params.id]).catch(() => ({ rows: [] })),
        ]);
        if (contractRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Charter contract not found' } });
        }
        return res.json({
            success: true,
            data: {
                ...contractRes.rows[0],
                voyages: voyagesRes.rows,
                costBreakdown: costRes.rows,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.post('/', (0, auth_js_1.authorize)(index_js_2.SystemRole.SUPER_ADMIN, index_js_2.SystemRole.ADMIN, index_js_2.SystemRole.CHARTERING_MANAGER), async (req, res) => {
    try {
        const { vesselId, cargoParcelId, charterType, contractType, chartererId, ownerId, laycanStart, laycanEnd, loadingPortId, dischargingPortId, cargoQuantityMt, freightRateUsd, freightRateBasis, totalFreightUsd, demurrageRateUsdDay, despatchRateUsdDay, hireRateUsdDay, contractDate, fixtureDate, termsConditions } = req.body;
        if (!charterType || !loadingPortId || !dischargingPortId) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'charterType, loadingPortId, dischargingPortId are required' } });
        }
        const uniqueSuffix = `${Date.now().toString().slice(-6)}${crypto_1.default.randomBytes(4).toString('hex').toUpperCase()}`;
        const contractRef = `SAIL-CHT-${new Date().getFullYear()}-${uniqueSuffix}`;
        const result = await index_js_1.pool.query(`INSERT INTO contracts (organization_id, contract_reference, vessel_id, cargo_parcel_id,
       charter_type, contract_type, charterer_id, owner_id, laycan_start, laycan_end,
       loading_port_id, discharging_port_id, cargo_quantity_mt, freight_rate_usd, freight_rate_basis,
       total_freight_usd, demurrage_rate_usd_day, despatch_rate_usd_day, hire_rate_usd_day,
       contract_date, fixture_date, terms_conditions, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,'DRAFT')
       RETURNING id, contract_reference, charter_type, status, created_at`, [req.user.organizationId, contractRef, vesselId, cargoParcelId,
            charterType, contractType || 'VOYAGE_CHARTER', chartererId, ownerId,
            laycanStart, laycanEnd, loadingPortId, dischargingPortId,
            cargoQuantityMt, freightRateUsd, freightRateBasis || 'USD/MT',
            totalFreightUsd, demurrageRateUsdDay, despatchRateUsdDay, hireRateUsdDay,
            contractDate, fixtureDate, JSON.stringify(termsConditions || {}), req.user.userId]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.patch('/:id/status', (0, auth_js_1.authorize)(index_js_2.SystemRole.SUPER_ADMIN, index_js_2.SystemRole.ADMIN, index_js_2.SystemRole.CHARTERING_MANAGER), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'FIXTURE', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${validStatuses.join(', ')}` } });
        }
        const result = await index_js_1.pool.query(`UPDATE contracts SET status = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3
       RETURNING id, contract_reference, status, updated_at`, [status, id, req.user.organizationId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contract not found' } });
        }
        return res.json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.post('/:id/voyages', (0, auth_js_1.authorize)(index_js_2.SystemRole.SUPER_ADMIN, index_js_2.SystemRole.ADMIN, index_js_2.SystemRole.CHARTERING_MANAGER), async (req, res) => {
    try {
        const { id } = req.params;
        const contractRes = await index_js_1.pool.query('SELECT * FROM contracts WHERE id = $1 AND organization_id = $2', [id, req.user.organizationId]);
        if (contractRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contract not found' } });
        }
        const contract = contractRes.rows[0];
        const { etd, eta, cargoQuantityMt, freightRateUsdPerMt, totalDistanceNm } = req.body;
        if (!etd || !eta) {
            return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'etd and eta are required' } });
        }
        const voyCount = await index_js_1.pool.query('SELECT COUNT(*) FROM voyages WHERE contract_id = $1', [id]);
        const voyNum = `VOY-${contract.contract_reference}-${String(parseInt(voyCount.rows[0].count) + 1).padStart(3, '0')}`;
        const qty = cargoQuantityMt || contract.cargo_quantity_mt;
        const rate = freightRateUsdPerMt || contract.freight_rate_usd;
        const totalFreight = qty && rate ? qty * rate : contract.total_freight_usd;
        const result = await index_js_1.pool.query(`INSERT INTO voyages (organization_id, contract_id, vessel_id, voyage_number, voyage_type,
       departure_port_id, arrival_port_id, etd, eta, cargo_quantity_mt, freight_rate_usd_per_mt,
       total_freight_usd, total_distance_nm, created_by, status)
       VALUES ($1,$2,$3,$4,'LADEN',$5,$6,$7,$8,$9,$10,$11,$12,$13,'PLANNED')
       RETURNING id, voyage_number, status, etd, eta`, [req.user.organizationId, id, contract.vessel_id, voyNum,
            contract.loading_port_id, contract.discharging_port_id,
            etd, eta, qty, rate, totalFreight, totalDistanceNm, req.user.userId]);
        return res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
router.post('/backhaul-match', async (req, res) => {
    try {
        const { dischargePort, vesselClass, ballastAvailableDate, intendedOriginRegion } = req.body;
        const result = BackhaulMatcherService_js_1.BackhaulMatcherService.match({
            dischargePort: dischargePort || 'Paradip',
            vesselClass: (vesselClass || 'CAPESIZE').toUpperCase(),
            ballastAvailableDate: ballastAvailableDate || new Date().toISOString().split('T')[0],
            intendedOriginRegion: (intendedOriginRegion || 'AUSTRALIA').toUpperCase(),
        });
        return res.json({ success: true, data: result });
    }
    catch (err) {
        return res.status(400).json({ success: false, error: { code: 'BACKHAUL_MATCHING_ERROR', message: err.message } });
    }
});
router.get('/export-pools', async (_req, res) => {
    try {
        const dummyInput = {
            dischargePort: 'Vizag',
            vesselClass: 'CAPESIZE',
            ballastAvailableDate: new Date().toISOString().split('T')[0],
            intendedOriginRegion: 'AUSTRALIA',
        };
        const result = BackhaulMatcherService_js_1.BackhaulMatcherService.match(dummyInput);
        return res.json({ success: true, data: result.matchedOpportunities });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
});
exports.default = router;
//# sourceMappingURL=chartering.js.map