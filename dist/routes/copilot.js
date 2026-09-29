"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
const CopilotService_js_1 = require("../services/CopilotService.js");
const router = (0, express_1.Router)();
function extractRoleFromHeader(req) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = jsonwebtoken_1.default.verify(token, index_js_1.config.jwt.secret);
            if (payload?.roles && Array.isArray(payload.roles) && payload.roles.length > 0) {
                return payload.roles[0];
            }
        }
    }
    catch {
    }
    return null;
}
async function handleCopilotQuery(req, res) {
    const prompt = req.body.query || req.body.prompt;
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_FAILED', message: 'query or prompt string is required in request body' }
        });
    }
    const tokenRole = extractRoleFromHeader(req);
    const requestedRole = req.body.role || req.body.currentRole || req.body.activeRole;
    let role = tokenRole || 'ANALYST';
    if (tokenRole) {
        if (requestedRole && requestedRole !== tokenRole) {
            return res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: `Unauthorized role elevation: token role '${tokenRole}' cannot execute queries as '${requestedRole}'` }
            });
        }
    }
    else if (requestedRole) {
        const unprivilegedAllowed = ['ANALYST'];
        if (!unprivilegedAllowed.includes(requestedRole)) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: `Authentication required to execute copilot queries as '${requestedRole}'` }
            });
        }
        role = requestedRole;
    }
    const page = req.body.page || req.body.currentRoute || '';
    const currency = req.body.currency || 'INR';
    try {
        const copilotResponse = await CopilotService_js_1.CopilotService.answerQuery(prompt, {
            role,
            page,
            currency
        });
        return res.json({
            success: true,
            data: copilotResponse
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            error: { code: 'COPILOT_EXECUTION_FAILED', message: err.message }
        });
    }
}
router.post('/query', handleCopilotQuery);
router.post('/chat', handleCopilotQuery);
router.get('/roles', (req, res) => {
    const roles = [
        {
            role: 'CHARTERING_MANAGER',
            title: 'Chartering & Fleet Manager',
            primaryPages: ['/chartering', '/contracts', '/decision', '/freight', '/dashboard'],
            scope: 'Vessel nomination, Time Charter Equivalent (TCE) optimization, spot vs COA fixtures, and demurrage avoidance.'
        },
        {
            role: 'PROCUREMENT_MANAGER',
            title: 'Raw Material Procurement Manager',
            primaryPages: ['/procurement', '/contracts', '/decision', '/dashboard'],
            scope: 'Steel plant raw material cushions (21-day threshold), tender awards, landed CFR cost minimization, and supplier volume fulfillment.'
        },
        {
            role: 'PORT_MANAGER',
            title: 'Port Logistics & Operations Manager',
            primaryPages: ['/ports', '/control-tower', '/decision', '/dashboard'],
            scope: 'Port draft/LOA restrictions, anchorage waiting times, berth re-allocation, and vessel diversion to minimize demurrage.'
        },
        {
            role: 'ANALYST',
            title: 'Quantitative Freight Analyst',
            primaryPages: ['/forecasting', '/freight', '/scenarios', '/dashboard'],
            scope: 'Econometric forward curves (7D to 90D), ML model benchmarking (Ensemble Pro, LSTM, XGBoost), and risk scenario simulations.'
        },
        {
            role: 'SUPER_ADMIN',
            title: 'Super Administrator & Executive Director',
            primaryPages: ['/audit', '/contracts', '/admin', '/reports', '/dashboard'],
            scope: 'Board-level contract countersignatures (> ₹8.35 Cr / $1M), CVC governance compliance, and enterprise oversight across all roles.'
        },
        {
            role: 'ADMIN',
            title: 'Platform System Administrator',
            primaryPages: ['/admin', '/audit', '/dashboard'],
            scope: 'Platform health, database connection pool telemetry, API worker latency, and background job queue management.'
        }
    ];
    return res.json({ success: true, data: roles });
});
router.get('/pages', (req, res) => {
    const pages = [
        { path: '/dashboard', title: 'Executive Dashboard', description: 'Command overview with role-tailored KPI views for all 6 personas.' },
        { path: '/control-tower', title: 'Operations Control Tower', description: 'Global satellite AIS vessel tracking map with weather overlays.' },
        { path: '/decision', title: 'Decision Center', description: 'AI strategy recommendation, voyage financial waterfall, tender allocation, and port diversion.' },
        { path: '/forecasting', title: 'Freight Forecasting', description: 'Multi-horizon econometric projections with 95% confidence intervals and ML model metrics.' },
        { path: '/chartering', title: 'Chartering & Vessels', description: 'Fleet directory, fixture ledger, and interactive BIMCO voyage economics calculator.' },
        { path: '/procurement', title: 'Procurement Dashboard', description: 'Plant raw material stock cushions (21-day safety threshold) and tender award workflow.' },
        { path: '/contracts', title: 'Contracts Module', description: 'COA and Spot charter parties, laycans, demurrage/despatch clauses, and digital clearance.' },
        { path: '/ports', title: 'Port Intelligence', description: 'East Coast Indian terminal constraints (draft, LOA, beam, DWT), congestion, and berth allocation.' },
        { path: '/risk', title: 'Risk Engine', description: 'Composite risk matrix (demurrage, bunker volatility, cyclones) and financial exposure scoring.' },
        { path: '/scenarios', title: 'Scenario Center', description: 'What-if disruption sandbox (bunker spikes, port closures) comparing baseline vs scenario cost.' },
        { path: '/freight', title: 'Freight Market Analytics', description: 'Baltic Exchange spot benchmarks (C5TC, C3TC, P1A), 7-day momentum, and forward curves.' },
        { path: '/audit', title: 'Audit Logs & Governance', description: 'Immutable SHA-256 cryptographic compliance audit trail for CVC governance.' },
        { path: '/reports', title: 'Reports & Exports', description: 'Compliance reporting with exportable analytics (Fleet Utilization, Demurrage Risk, COA).' },
        { path: '/admin', title: 'System Administration', description: 'Platform health cockpit, PostgreSQL connection pools, API latency, and background jobs.' },
        { path: '/copilot', title: 'MARINEX Copilot', description: 'Role-aware AI assistant grounded in live database data and deterministic maritime tools.' }
    ];
    return res.json({ success: true, data: pages });
});
router.get('/tools', (req, res) => {
    const tools = [
        { name: 'searchPorts', description: 'Query port restrictions (draft, LOA, beam, DWT) on East Coast India' },
        { name: 'searchVessels', description: 'Filter fleet by class, DWT, summer draft, and operational status' },
        { name: 'searchFreight', description: 'Retrieve latest verified spot rates and Baltic indices for trade lanes' },
        { name: 'getForecast', description: 'Access ML forward freight rate predictions across 7D to 180D horizons' },
        { name: 'checkPortFeasibility', description: 'Deterministic check of vessel dimensions against port berth & channel constraints' },
        { name: 'analyzeVoyage', description: 'Calculate 10-component voyage economics, TCE, landed cost, and break-even rates' }
    ];
    return res.json({ success: true, data: tools });
});
let COPILOT_CHAT_SESSIONS = [
    {
        id: 'session-seed-paradip-demurrage',
        title: 'Paradip Berth 3 Demurrage & Weather Advisory',
        role: 'CHARTERING_MANAGER',
        isPinned: true,
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        messages: [
            {
                id: 'msg-seed-1',
                role: 'user',
                content: 'Are there any active cyclone alerts or high swells for Paradip port, and what is the demurrage risk for Berth 3?',
                timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            },
            {
                id: 'msg-seed-2',
                role: 'assistant',
                content: `**Operational Intelligence for Paradip Port & Berth 3:**

1. **Weather & Swell Advisory**: IMD reports sea swell at Paradip outer anchorage is currently **2.8 meters** with gusting winds up to 24 knots. Pilotage is operating on restricted daylight windows.
2. **Berth 3 Lineup**: 3 Capesize bulkers are currently waiting at anchorage with an average pre-berthing waiting time of **48.6 hours**.
3. **Demurrage Exposure**: With current daily charter demurrage rates at **$18,500/day**, each additional 24h delay incurs approximately **₹15.4 Lakh ($18,500)** in demurrage risk.
4. **Recommended Strategy**: Divert the upcoming inbound vessel *MV Durgapur Pioneer* to **Dhamra Port (DWT 180,000, 18.5m draft)** where waiting time is currently under 12 hours, saving an estimated **₹28.5 Lakh** in net dispatch costs.`,
                confidence: 0.94,
                source: 'Real-time IMD & Paradip Port Trust AIS Feed',
                roleContext: 'Chartering Manager',
                pageContext: '/ports',
                suggestedFollowups: [
                    'Calculate landed cost comparison Paradip vs Dhamra',
                    'What is the current rake availability for rake evacuation to Rourkela Steel Plant?',
                ],
                model: 'SAIL Maritime Neural Intelligence v2.0',
                timestamp: new Date(Date.now() - 3 * 3600 * 1000 + 4000).toISOString(),
            }
        ],
    },
    {
        id: 'session-seed-coking-coal-economics',
        title: '100,000 MT Gladstone to Vizag Voyage Economics',
        role: 'PROCUREMENT_MANAGER',
        isPinned: true,
        createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 13 * 3600 * 1000).toISOString(),
        messages: [
            {
                id: 'msg-seed-3',
                role: 'user',
                content: 'Run a voyage economics analysis for 100,000 MT Australian Coking Coal from Gladstone to Vizag.',
                timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
            },
            {
                id: 'msg-seed-4',
                role: 'assistant',
                content: `**Voyage Economics Waterfall (Gladstone to Visakhapatnam):**

- **Cargo Quantity**: 100,000 MT Prime Hard Coking Coal
- **Benchmark Spot Freight (C5TC)**: **$14.85 / MT** (₹1,240 / MT)
- **Sea Transit Duration**: 14.8 days at 12.5 knots eco-speed
- **Bunker Consumption (VLSFO @ $620/t)**: 414 MT = **$256,680** (₹2.14 Cr)
- **Port Tariffs & Pilotage (Vizag)**: **$68,400** (₹57.1 Lakh)
- **Net Landed Freight Cost**: **$16.92 / MT** (₹1,412 / MT)
- **BIMCO Time Charter Equivalent (TCE)**: **$23,450 / day**

*Recommendation*: Current freight rate is 4.2% below 30-day trailing average. Excellent window to lock in COA fixture before expected Q4 Baltic index firming.`,
                confidence: 0.98,
                source: 'BIMCO Voyage Economics Engine & Platts Coal Benchmark',
                roleContext: 'Procurement Manager',
                pageContext: '/chartering',
                suggestedFollowups: [
                    'Show sensitivity table for bunker price +/- 15%',
                    'Check coal buffer cushion at Vizag steel plant',
                ],
                model: 'SAIL Maritime Neural Intelligence v2.0',
                timestamp: new Date(Date.now() - 14 * 3600 * 1000 + 3500).toISOString(),
            }
        ],
    },
    {
        id: 'session-seed-ffa-curves',
        title: 'Q4 Baltic FFA Forward Curve & Bunker Hedging',
        role: 'ANALYST',
        isPinned: false,
        createdAt: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
        messages: [
            {
                id: 'msg-seed-5',
                role: 'user',
                content: 'What is the ML forecast for Baltic Capesize rates across the next 30 to 90 days?',
                timestamp: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
            },
            {
                id: 'msg-seed-6',
                role: 'assistant',
                content: `**Econometric & Ensemble ML Forward Curve Analysis:**

- **7-Day Horizon**: $15.10 / MT (+1.7% bullish momentum)
- **30-Day Horizon**: $16.25 / MT (95% CI: $15.40 – $17.10)
- **90-Day Horizon (Q4 peak)**: $17.80 / MT driven by seasonal Atlantic iron ore and Pacific grain demand.
- **Model Confidence**: 92.4% (Ensemble Pro combining Bi-LSTM, XGBoost, and Baltic FFA derivative pricing).

*Strategic Takeaway*: Fixing 65% of Q4 coking coal import volume on medium-term COA contracts now hedges against an estimated ₹18.2 Cr in spot freight escalation.`,
                confidence: 0.92,
                source: 'SAIL Ensemble Pro v3 ML Forecast Engine',
                roleContext: 'Quantitative Analyst',
                pageContext: '/forecasting',
                suggestedFollowups: [
                    'View model error metrics (MAPE, RMSE)',
                    'Simulate bunker shock scenario at $750/t',
                ],
                model: 'SAIL Maritime Neural Intelligence v2.0',
                timestamp: new Date(Date.now() - 32 * 3600 * 1000 + 4200).toISOString(),
            }
        ],
    }
];
router.get('/sessions', (req, res) => {
    const role = req.query.role;
    let filtered = COPILOT_CHAT_SESSIONS;
    if (role && role !== 'ALL') {
        filtered = COPILOT_CHAT_SESSIONS.filter((s) => s.role === role || s.role === 'ALL');
    }
    return res.json({
        success: true,
        data: filtered,
        meta: {
            total: filtered.length,
            serverTime: new Date().toISOString(),
        },
    });
});
router.post('/sessions', (req, res) => {
    const { id, title, role, messages, isPinned } = req.body;
    if (!id || !title) {
        return res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_FAILED', message: 'id and title are required' }
        });
    }
    const existingIdx = COPILOT_CHAT_SESSIONS.findIndex((s) => s.id === id);
    const now = new Date().toISOString();
    if (existingIdx >= 0) {
        COPILOT_CHAT_SESSIONS[existingIdx] = {
            ...COPILOT_CHAT_SESSIONS[existingIdx],
            title: title || COPILOT_CHAT_SESSIONS[existingIdx].title,
            role: role || COPILOT_CHAT_SESSIONS[existingIdx].role,
            messages: messages || COPILOT_CHAT_SESSIONS[existingIdx].messages,
            isPinned: isPinned !== undefined ? isPinned : COPILOT_CHAT_SESSIONS[existingIdx].isPinned,
            updatedAt: now,
        };
        return res.json({ success: true, data: COPILOT_CHAT_SESSIONS[existingIdx] });
    }
    else {
        const newSession = {
            id,
            title: title.trim(),
            role: role || 'CHARTERING_MANAGER',
            isPinned: Boolean(isPinned),
            messages: Array.isArray(messages) ? messages : [],
            createdAt: now,
            updatedAt: now,
        };
        COPILOT_CHAT_SESSIONS.unshift(newSession);
        return res.json({ success: true, data: newSession });
    }
});
router.patch('/sessions/:id', (req, res) => {
    const { id } = req.params;
    const { title, isPinned } = req.body;
    const session = COPILOT_CHAT_SESSIONS.find((s) => s.id === id);
    if (!session) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Chat session not found' } });
    }
    if (title !== undefined && typeof title === 'string') {
        session.title = title.trim();
    }
    if (isPinned !== undefined) {
        session.isPinned = Boolean(isPinned);
    }
    session.updatedAt = new Date().toISOString();
    return res.json({ success: true, data: session });
});
router.delete('/sessions/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = COPILOT_CHAT_SESSIONS.length;
    COPILOT_CHAT_SESSIONS = COPILOT_CHAT_SESSIONS.filter((s) => s.id !== id);
    if (COPILOT_CHAT_SESSIONS.length === initialLen) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Chat session not found' } });
    }
    return res.json({ success: true, data: { message: 'Chat session deleted successfully', deletedId: id } });
});
router.delete('/sessions', (req, res) => {
    COPILOT_CHAT_SESSIONS = [];
    return res.json({ success: true, data: { message: 'All chat sessions have been cleared' } });
});
exports.default = router;
//# sourceMappingURL=copilot.js.map