import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { pool } from './db/index.js';
import { FreightCodeService } from './services/FreightCodeService.js';
import { VesselFeasibilityService } from './services/VesselFeasibilityService.js';
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
// Health check
app.get('/health', async (req, res) => {
    try {
        const dbRes = await pool.query('SELECT NOW() as current_time');
        res.json({
            status: 'HEALTHY',
            database: 'CONNECTED',
            timestamp: dbRes.rows[0].current_time,
            service: 'SAIL MARINEX Intelligent Freight Intelligence API'
        });
    }
    catch (err) {
        res.status(500).json({
            status: 'UNHEALTHY',
            database: 'DISCONNECTED',
            error: err.message
        });
    }
});
// 1. Roles endpoint (Validating the 6 seeded roles)
app.get(`${config.apiPrefix}/roles`, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, role_name, display_name, description FROM roles ORDER BY role_name');
        res.json({
            success: true,
            data: result.rows,
            meta: { count: result.rowCount }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
});
// 2. East Coast Ports endpoint
app.get(`${config.apiPrefix}/ports/east-coast`, async (req, res) => {
    try {
        const result = await pool.query(`SELECT id, port_name, un_locode, state, latitude, longitude, status 
       FROM ports 
       WHERE is_east_coast_india = TRUE 
       ORDER BY port_name`);
        res.json({
            success: true,
            data: result.rows,
            meta: { count: result.rowCount }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
});
// 3. Freight Code Generation endpoint
app.post(`${config.apiPrefix}/freight-codes/generate`, (req, res) => {
    try {
        const { originCode, destinationCode, vesselClassCode, cargoCode } = req.body;
        if (!originCode || !destinationCode || !vesselClassCode || !cargoCode) {
            return res.status(400).json({
                success: false,
                error: { message: 'Missing required parameters: originCode, destinationCode, vesselClassCode, cargoCode' }
            });
        }
        const code = FreightCodeService.generateCode({
            originCode,
            destinationCode,
            vesselClassCode,
            cargoCode
        });
        res.json({
            success: true,
            data: {
                freightCode: code,
                parsed: FreightCodeService.parseCode(code)
            }
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
});
// 4. Vessel Feasibility Evaluation endpoint
app.post(`${config.apiPrefix}/vessel-feasibility/check`, (req, res) => {
    try {
        const { vessel, portConstraints } = req.body;
        if (!vessel || !portConstraints) {
            return res.status(400).json({
                success: false,
                error: { message: 'Parameters vessel and portConstraints are required' }
            });
        }
        const evaluation = VesselFeasibilityService.checkCompatibility({ vessel, portConstraints });
        res.json({
            success: true,
            data: evaluation
        });
    }
    catch (err) {
        res.status(500).json({ success: false, error: { message: err.message } });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected error occurred'
        }
    });
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(config.port, () => {
        console.log(`[SAIL MARINEX] Node.js Enterprise Server running on port ${config.port} (${config.env})`);
    });
}
export default app;
