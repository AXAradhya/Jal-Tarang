"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_js_1 = require("../db/index.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    const { entityType, riskLevel } = req.query;
    try {
        let query = `SELECT * FROM risk_assessments WHERE 1=1`;
        const params = [];
        if (entityType) {
            params.push(entityType);
            query += ` AND entity_type = $${params.length}`;
        }
        if (riskLevel) {
            params.push(riskLevel);
            query += ` AND risk_level = $${params.length}`;
        }
        query += ` ORDER BY assessed_at DESC LIMIT 100`;
        const result = await index_js_1.pool.query(query, params);
        return res.json({ success: true, data: result.rows });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { code: 'DATABASE_ERROR', message: err.message } });
    }
});
router.post('/assess', auth_js_1.authenticateToken, async (req, res) => {
    const { portId, vesselId, routeDistanceNm = 5200, season = 'MONSOON' } = req.body;
    const weatherScore = season === 'MONSOON' ? 6.8 : 2.4;
    const freightVolatilityScore = 4.5;
    const portCongestionScore = 5.2;
    const vesselAgeRiskScore = 3.0;
    const geopoliticalScore = 1.8;
    const compositeScore = Math.round(((weatherScore * 0.3) + (freightVolatilityScore * 0.25) + (portCongestionScore * 0.25) + (vesselAgeRiskScore * 0.1) + (geopoliticalScore * 0.1)) * 10) / 10;
    const riskLevel = compositeScore > 7 ? 'CRITICAL' : compositeScore > 5 ? 'HIGH' : compositeScore > 3 ? 'MEDIUM' : 'LOW';
    const factors = [
        { category: 'WEATHER', score: weatherScore, level: weatherScore > 5 ? 'HIGH' : 'LOW', description: 'Bay of Bengal tropical low pressure alert active' },
        { category: 'PORT_CONGESTION', score: portCongestionScore, level: 'MEDIUM', description: 'Paradip anchorage waiting times at 2.8 days' },
        { category: 'FREIGHT_VOLATILITY', score: freightVolatilityScore, level: 'MEDIUM', description: 'Capesize forward freight agreements fluctuating ±8% over 30 days' },
        { category: 'VESSEL_COMPATIBILITY', score: vesselAgeRiskScore, level: 'LOW', description: 'Vessel is modern (<10 years build) and vetted' }
    ];
    const mitigations = [
        'Insert weather delay exception laytime clause in Charter Party',
        'Pre-book mechanized unloading berth 72 hours prior to arrival',
        'Hedge bunker fuel requirements via fixed-price swap'
    ];
    if (portId) {
        await index_js_1.pool.query(`INSERT INTO risk_assessments (entity_type, entity_id, risk_category, risk_score, risk_level, factors, mitigations)
       VALUES ('PORT', $1, 'COMPOSITE', $2, $3, $4, $5)`, [portId, compositeScore, riskLevel, JSON.stringify(factors), JSON.stringify(mitigations)]).catch(() => { });
    }
    return res.json({
        success: true,
        data: {
            compositeRiskScore: compositeScore,
            compositeRiskLevel: riskLevel,
            financialExposureEstimateUsd: Math.round(compositeScore * 18500),
            evaluatedCategories: factors,
            actionableMitigations: mitigations,
            assessedAt: new Date().toISOString()
        }
    });
});
router.get('/summary', auth_js_1.authenticateToken, async (req, res) => {
    return res.json({
        success: true,
        data: {
            activeFleetRisk: 'LOW-MEDIUM',
            portCongestionRiskEastCoast: 'MODERATE',
            weatherDisruptionRisk: 'HIGH (Bay of Bengal)',
            openRiskAssessmentsCount: 14,
            criticalAlertsCount: 2,
            hedgedFreightPercentage: 68.5,
            timestamp: new Date().toISOString()
        }
    });
});
router.post('/nlp/score', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { headline, bodyText } = req.body;
        if (!headline) {
            return res.status(400).json({ success: false, error: { message: 'headline is required' } });
        }
        const text = `${headline} ${bodyText || ''}`.toLowerCase();
        let score = 45;
        let category = 'GENERAL_LOGISTICS';
        let elasticity = 2.0;
        let action = 'Monitor maritime developments routinely.';
        if (text.includes('red sea') || text.includes('houthi') || text.includes('drone')) {
            score = 78;
            category = 'PIRACY_SECURITY';
            elasticity = 12.0;
            action = 'AVOID BAB-EL-MANDEB; reroute Mozambique/Atlantic parcels via Cape Town; secure war risk insurance.';
        }
        else if (text.includes('cyclone') || text.includes('depression') || text.includes('bay of bengal')) {
            score = 82;
            category = 'WEATHER_DISRUPTIONS';
            elasticity = 9.5;
            action = 'DIVERT TO SHELTERED ANCHORAGE; delay arrival by 48-72h to avoid high demurrage.';
        }
        else if (text.includes('strike') || text.includes('tugboat')) {
            score = 65;
            category = 'PORT_STRIKES';
            elasticity = 8.0;
            action = 'ADVANCE LAYCAN DATES; secure prompt tonnage before berthing delays accumulate.';
        }
        return res.json({
            success: true,
            data: {
                category,
                severity: score >= 80 ? 'CRITICAL' : score >= 65 ? 'HIGH' : 'MODERATE',
                disruptionScore: score,
                freightRateElasticityPct: elasticity,
                affectedRoutes: ['AU_ECI', 'MZ_ECI'],
                affectedPorts: ['Paradip', 'Haldia', 'Vizag', 'Dhamra'],
                recommendedAction: action,
                confidenceScorePct: 88,
            },
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: { message: err.message } });
    }
});
router.get('/nlp/active', auth_js_1.authenticateToken, async (_req, res) => {
    const activeAlerts = [
        {
            id: 'DISRUPT-001',
            category: 'PIRACY_SECURITY',
            severity: 'CRITICAL',
            disruptionScore: 78,
            freightRateElasticityPct: 12.0,
            headline: 'Red Sea drone incursions intensify near Bab-el-Mandeb; bulk carriers divert via Cape of Good Hope',
            affectedRoutes: ['MZ_ECI', 'USG_ECI'],
            affectedPorts: ['Vizag', 'Paradip'],
            recommendedAction: 'AVOID BAB-EL-MANDEB; reroute Mozambique and Atlantic parcels via Cape Town; secure war risk insurance.',
            publishedDate: '2026-09-26T18:00:00Z',
        },
        {
            id: 'DISRUPT-002',
            category: 'WEATHER_DISRUPTIONS',
            severity: 'HIGH',
            disruptionScore: 82,
            freightRateElasticityPct: 9.5,
            headline: 'Severe tropical depression forms in Bay of Bengal; Paradip and Dhamra outer anchorage pilotage suspended',
            affectedRoutes: ['AU_ECI', 'ID_ECI'],
            affectedPorts: ['Paradip', 'Dhamra'],
            recommendedAction: 'DIVERT TO SHELTERED ANCHORAGE; delay arrival by 48-72h to avoid high demurrage.',
            publishedDate: '2026-09-27T04:30:00Z',
        },
        {
            id: 'DISRUPT-003',
            category: 'PORT_STRIKES',
            severity: 'HIGH',
            disruptionScore: 65,
            freightRateElasticityPct: 8.0,
            headline: 'Australian CFMEU & Maritime Union announce 48-hour rolling tugboat strike at Hay Point and Dalrymple Bay',
            affectedRoutes: ['AU_ECI'],
            affectedPorts: ['Hay Point', 'Gladstone'],
            recommendedAction: 'ADVANCE LAYCAN DATES; secure prompt tonnage before berthing delays accumulate.',
            publishedDate: '2026-09-26T12:00:00Z',
        },
        {
            id: 'DISRUPT-004',
            category: 'CANAL_BLOCKAGES',
            severity: 'MODERATE',
            disruptionScore: 52,
            freightRateElasticityPct: 5.5,
            headline: 'Syama Prasad Mookerjee Port Kolkata hydrographic survey reports Balari bar siltation post-monsoon',
            affectedRoutes: ['AU_ECI'],
            affectedPorts: ['Haldia', 'Kolkata'],
            recommendedAction: 'Utilize Dhamra + Rail arbitrage or Sandheads lightering for vessels exceeding 7.8m arrival draft.',
            publishedDate: '2026-09-25T09:00:00Z',
        },
    ];
    return res.json({ success: true, data: activeAlerts });
});
exports.default = router;
//# sourceMappingURL=risks.js.map