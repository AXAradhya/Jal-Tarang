"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const MlServiceClient_js_1 = require("../services/MlServiceClient.js");
const index_js_1 = require("../db/index.js");
const index_js_2 = require("../config/index.js");
const router = (0, express_1.Router)();
const verifyInternalAccess = (req, res, next) => {
    const internalSecret = req.headers['x-internal-secret'];
    const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || index_js_2.config.jwt.secret;
    const clientIp = req.ip || req.socket.remoteAddress || '';
    const isLoopback = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.includes('127.0.0.1');
    if (internalSecret === expectedSecret || isLoopback) {
        next();
        return;
    }
    res.status(403).json({ success: false, error: 'Access denied: unauthorized internal service call' });
};
router.use(verifyInternalAccess);
router.get('/api/v1/features/:freightCodeId', async (req, res) => {
    try {
        const { freightCodeId } = req.params;
        const days = parseInt(req.query.days || '90', 10);
        const dbFeatures = await (0, index_js_1.query)(`SELECT feature_name, feature_value 
       FROM ml_features 
       WHERE freight_code_id = $1::uuid OR freight_code_id = $1
       ORDER BY feature_date DESC LIMIT 50`, [freightCodeId]);
        const features = {};
        if (dbFeatures.rows && dbFeatures.rows.length > 0) {
            for (const row of dbFeatures.rows) {
                features[row.feature_name] = parseFloat(row.feature_value);
            }
        }
        else {
            features['bunker_vlsfo_singapore'] = 618.5;
            features['bunker_vlsfo_paradip'] = 642.0;
            features['bunker_price_change_7d'] = 8.5;
            features['ballast_vessel_count'] = 14.0;
            features['fleet_dwt_utilization'] = 0.89;
            features['port_wait_hours_paradip'] = 18.5;
            features['port_wait_hours_vizag'] = 12.0;
            features['berth_occupancy_ratio'] = 0.82;
            features['wave_height_bay_of_bengal'] = 2.4;
            features['cyclone_alert_index'] = 1.0;
            features['bdi_index'] = 1945.0;
            features['coking_coal_fob_australia'] = 252.0;
            features['china_steel_pmi'] = 50.8;
        }
        return res.json({
            success: true,
            freightCodeId,
            days,
            features,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/ml/health', async (req, res) => {
    const health = await MlServiceClient_js_1.mlServiceClient.checkHealth();
    return res.json(health);
});
router.post('/ml/forecast', async (req, res) => {
    try {
        const { freightCodeId, horizonDays, modelVersion, includeExplanation } = req.body;
        if (!freightCodeId) {
            return res.status(400).json({ success: false, error: 'freightCodeId is required' });
        }
        const forecast = await MlServiceClient_js_1.mlServiceClient.getForecast({
            freightCodeId,
            horizonDays: horizonDays || 30,
            modelVersion,
            includeExplanation: Boolean(includeExplanation),
        });
        return res.json(forecast);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/ml/explain', async (req, res) => {
    try {
        const { freightCodeId, features } = req.body;
        if (!freightCodeId) {
            return res.status(400).json({ success: false, error: 'freightCodeId is required' });
        }
        const explanation = await MlServiceClient_js_1.mlServiceClient.getExplanation(freightCodeId, features);
        return res.json(explanation);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/ml/train', async (req, res) => {
    try {
        const { freightCodeId, modelType, useOptuna, optunaTrials, testSplitDays } = req.body;
        if (!freightCodeId) {
            return res.status(400).json({ success: false, error: 'freightCodeId is required' });
        }
        const trainResult = await MlServiceClient_js_1.mlServiceClient.trainModel({
            freightCodeId,
            modelType: modelType || 'ensemble',
            useOptuna: useOptuna !== false,
            optunaTrials: optunaTrials || 10,
            testSplitDays: testSplitDays || 60,
        });
        return res.json(trainResult);
    }
    catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=internalMl.js.map