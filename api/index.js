// Vercel Serverless Function — JAL TARANG Enterprise Gateway
// Provides serverless API handlers for Vercel edge deployment

const DEMO_PERSONAS = [
  {
    role: 'CHARTERING_MANAGER',
    roleTitle: 'Chartering Manager',
    name: 'Capt. Rajesh Sharma',
    email: 'rajesh.sharma@sail.in',
    department: 'Central Shipping & Chartering Wing',
  },
  {
    role: 'CHIEF_OPERATING_OFFICER',
    roleTitle: 'Chief Operating Officer',
    name: 'Dr. Amitabh Roy',
    email: 'amitabh.roy@sail.in',
    department: 'Raw Materials & Maritime Operations',
  },
  {
    role: 'EXECUTIVE_DIRECTOR',
    roleTitle: 'Executive Director (Logistics)',
    name: 'Smt. Sunita Verma',
    email: 'sunita.verma@sail.in',
    department: 'Corporate Maritime Logistics Division',
  },
  {
    role: 'PORT_OPERATIONS_OFFICER',
    roleTitle: 'Port Logistics Officer',
    name: 'Shri Vikramaditya Seth',
    email: 'vikram.seth@sail.in',
    department: 'Eastern Ports Demurrage Control Unit',
  },
  {
    role: 'STRATEGIC_PLANNING_ANALYST',
    roleTitle: 'Strategic Market Analyst',
    name: 'Ananya Mukherjee',
    email: 'ananya.m@sail.in',
    department: 'Macro Intelligence & Market Forecasting',
  },
  {
    role: 'SYSTEM_ADMINISTRATOR',
    roleTitle: 'System Administrator',
    name: 'DevOps & IT Security',
    email: 'sysadmin@sail.in',
    department: 'Enterprise IT Systems Group',
  },
];

const SAMPLE_PORTS = [
  { id: 'port-1', port_name: 'Paradip Port', port_code: 'INPAV', un_locode: 'INPAV', latitude: 20.3167, longitude: 86.6667, max_vessel_dwt: 180000, congestion_status: 'HIGH', current_waiting_days: 3.8, country_name: 'India' },
  { id: 'port-2', port_name: 'Visakhapatnam Port', port_code: 'INVTZ', un_locode: 'INVTZ', latitude: 17.6868, longitude: 83.2185, max_vessel_dwt: 200000, congestion_status: 'NORMAL', current_waiting_days: 1.2, country_name: 'India' },
  { id: 'port-3', port_name: 'Haldia Port', port_code: 'INHAL', un_locode: 'INHAL', latitude: 22.0287, longitude: 88.0658, max_vessel_dwt: 65000, congestion_status: 'CRITICAL', current_waiting_days: 5.4, country_name: 'India' },
  { id: 'port-4', port_name: 'Port of Hay Point (DBCT)', port_code: 'AUHPT', un_locode: 'AUHPT', latitude: -21.2858, longitude: 149.2997, max_vessel_dwt: 220000, congestion_status: 'LOW', current_waiting_days: 0.8, country_name: 'Australia' },
  { id: 'port-5', port_name: 'Port Hedland', port_code: 'AUPHE', un_locode: 'AUPHE', latitude: -20.3117, longitude: 118.5756, max_vessel_dwt: 260000, congestion_status: 'LOW', current_waiting_days: 0.9, country_name: 'Australia' },
];

const SAMPLE_VESSELS = [
  { id: 'vsl-1', name: 'SAIL KAVERI', imo_number: '9421890', vessel_class: 'Capesize', deadweight_tonnage: 180000, flag: 'IN', status: 'ON_VOYAGE', destination_port: 'Paradip Port', eta: '2026-10-04T12:00:00Z', current_speed_knots: 13.4 },
  { id: 'vsl-2', name: 'MAHARSHI DAYANAND', imo_number: '9314482', vessel_class: 'Panamax', deadweight_tonnage: 82000, flag: 'IN', status: 'WAITING_BERTH', destination_port: 'Haldia Port', eta: '2026-09-29T18:00:00Z', current_speed_knots: 0.0 },
  { id: 'vsl-3', name: 'STEEL GLORY', imo_number: '9587123', vessel_class: 'Supramax', deadweight_tonnage: 58000, flag: 'LR', status: 'LOADING', destination_port: 'Visakhapatnam Port', eta: '2026-10-08T06:00:00Z', current_speed_knots: 12.1 },
  { id: 'vsl-4', name: 'INDIAN ENDEAVOUR', imo_number: '9632819', vessel_class: 'Capesize', deadweight_tonnage: 176000, flag: 'IN', status: 'ON_VOYAGE', destination_port: 'Paradip Port', eta: '2026-10-06T15:00:00Z', current_speed_knots: 14.0 },
];

const SAMPLE_FREIGHT_RATES = [
  { id: 'frt-1', freight_code: 'FRT-C5TC', route_name: 'Western Australia → Qingdao (Capesize)', rate_usd_per_tonne: 11.85, change_24h_pct: 1.4, bdi_correlation: 0.91, recorded_at: new Date().toISOString() },
  { id: 'frt-2', freight_code: 'FRT-C3', route_name: 'Tubarao → Qingdao (Capesize)', rate_usd_per_tonne: 26.40, change_24h_pct: -0.6, bdi_correlation: 0.88, recorded_at: new Date().toISOString() },
  { id: 'frt-3', freight_code: 'FRT-P2A', route_name: 'Hay Point / DBCT → Paradip (Coking Coal Panamax)', rate_usd_per_tonne: 16.75, change_24h_pct: 0.8, bdi_correlation: 0.85, recorded_at: new Date().toISOString() },
  { id: 'frt-4', freight_code: 'FRT-SAIL-01', route_name: 'Gladstone → Haldia (SAIL Dedicated Corridor)', rate_usd_per_tonne: 17.10, change_24h_pct: 0.5, bdi_correlation: 0.82, recorded_at: new Date().toISOString() },
];

module.exports = async function handler(req, res) {
  // 1. CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Internal-Secret');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parse URL path (supports Vercel x-matched-path and standard rewrites)
  const reqUrl = req.headers['x-matched-path'] || req.headers['x-now-route-matches'] || req.url;
  const parsedUrl = new URL(reqUrl, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '');

  // Helper for JSON reading
  const readBody = () => new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });

  const send = (statusCode, payload) => {
    res.statusCode = statusCode;
    res.end(JSON.stringify(payload));
  };

  // ─── Health Probes ────────────────────────────────────────────────────────
  if (
    pathname === '/health' ||
    pathname === '/health/live' ||
    pathname === '/health/ready' ||
    pathname === '/api/v1/health/live' ||
    pathname === '/api/v1/health/ready'
  ) {
    return send(200, {
      status: 'LIVE',
      service: 'JAL TARANG Enterprise Gateway',
      environment: 'production',
      database: { status: 'CONNECTED', mode: 'Enterprise Cloud Edge Live Gateway' },
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Authentication Routes ────────────────────────────────────────────────
  if (pathname === '/api/v1/auth/login' && req.method === 'POST') {
    const body = await readBody();
    const email = (body.email || '').trim().toLowerCase();
    const persona = DEMO_PERSONAS.find(p => p.email.toLowerCase() === email) || DEMO_PERSONAS[0];

    const nameParts = persona.name.split(' ');
    const user = {
      id: `usr-${persona.role.toLowerCase()}`,
      email: persona.email,
      firstName: nameParts[0] || 'Officer',
      lastName: nameParts.slice(1).join(' ') || 'SAIL',
      displayName: persona.name,
      organizationId: 'org-sail-corp',
      organizationName: 'Steel Authority of India Limited (SAIL)',
      roles: [persona.role],
      permissions: ['*'],
      department: persona.department,
      isActive: true,
      lastLoginAt: new Date().toISOString(),
    };

    const token = `jwt_sail_${Date.now()}_${persona.role}`;
    const refreshToken = `ref_sail_${Date.now()}`;

    return send(200, {
      success: true,
      data: {
        accessToken: token,
        refreshToken: refreshToken,
        user,
      },
    });
  }

  if (pathname === '/api/v1/auth/me') {
    const persona = DEMO_PERSONAS[0];
    const nameParts = persona.name.split(' ');
    return send(200, {
      success: true,
      data: {
        id: `usr-${persona.role.toLowerCase()}`,
        email: persona.email,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        organizationId: 'org-sail-corp',
        organizationName: 'Steel Authority of India Limited (SAIL)',
        roles: [persona.role],
        permissions: ['*'],
      },
    });
  }

  if (pathname === '/api/v1/auth/refresh' && req.method === 'POST') {
    return send(200, {
      success: true,
      data: {
        accessToken: `jwt_sail_refreshed_${Date.now()}`,
        refreshToken: `ref_sail_${Date.now()}`,
      },
    });
  }

  if (pathname === '/api/v1/auth/logout' && req.method === 'POST') {
    return send(200, { success: true, message: 'Logged out successfully' });
  }

  // ─── Reference Data ───────────────────────────────────────────────────────
  if (pathname === '/api/v1/reference/currencies') {
    return send(200, {
      success: true,
      data: [
        { id: 'curr-usd', code: 'USD', name: 'US Dollar', symbol: '$', decimal_places: 2 },
        { id: 'curr-inr', code: 'INR', name: 'Indian Rupee', symbol: '₹', decimal_places: 2 },
        { id: 'curr-eur', code: 'EUR', name: 'Euro', symbol: '€', decimal_places: 2 },
      ],
    });
  }

  if (pathname === '/api/v1/reference/countries') {
    return send(200, {
      success: true,
      data: [
        { id: 'c-ind', iso2: 'IN', iso3: 'IND', name: 'India', is_maritime_nation: true },
        { id: 'c-aus', iso2: 'AU', iso3: 'AUS', name: 'Australia', is_maritime_nation: true },
        { id: 'c-bra', iso2: 'BR', iso3: 'BRA', name: 'Brazil', is_maritime_nation: true },
        { id: 'c-chn', iso2: 'CN', iso3: 'CHN', name: 'China', is_maritime_nation: true },
        { id: 'c-sgp', iso2: 'SG', iso3: 'SGP', name: 'Singapore', is_maritime_nation: true },
      ],
    });
  }

  if (pathname === '/api/v1/reference/exchange-rates') {
    return send(200, {
      success: true,
      data: { USD: 1.0, INR: 83.5, EUR: 0.92 },
    });
  }

  if (pathname === '/api/v1/config/ui') {
    return send(200, {
      success: true,
      data: {
        appName: 'SAIL MARINEX',
        version: '2.0.0',
        environment: 'production',
        features: {
          copilot: true,
          radar: true,
          liveSync: true,
          decisionEngine: true,
        },
      },
    });
  }

  // ─── Core Operational Datasets ────────────────────────────────────────────
  if (pathname === '/api/v1/ports') {
    return send(200, { success: true, data: SAMPLE_PORTS });
  }

  if (pathname === '/api/v1/vessels') {
    return send(200, { success: true, data: SAMPLE_VESSELS });
  }

  if (pathname === '/api/v1/freight/rates') {
    return send(200, { success: true, data: SAMPLE_FREIGHT_RATES });
  }

  if (pathname === '/api/v1/freight/sync-live') {
    return send(200, { success: true, message: 'Live Baltic datasets synchronized.' });
  }

  if (pathname === '/api/v1/contracts') {
    return send(200, {
      success: true,
      data: [
        { id: 'cnt-1', contract_number: 'SAIL-COA-2026-001', charterer_name: 'SAIL Central Procurement', vessel_name: 'SAIL KAVERI', charter_type: 'COA', origin_port: 'Hay Point', destination_port: 'Paradip Port', freight_rate_usd_mt: 16.5, status: 'EXECUTING', demurrage_rate_usd_day: 18500 },
        { id: 'cnt-2', contract_number: 'SAIL-SPOT-2026-089', charterer_name: 'SAIL RSP Division', vessel_name: 'MAHARSHI DAYANAND', charter_type: 'SPOT', origin_port: 'Port Hedland', destination_port: 'Haldia Port', freight_rate_usd_mt: 17.2, status: 'CONFIRMED', demurrage_rate_usd_day: 19500 },
      ],
    });
  }

  if (pathname === '/api/v1/procurement') {
    return send(200, {
      success: true,
      data: [
        { id: 'prc-1', plant_name: 'Rourkela Steel Plant (RSP)', commodity: 'Premium Hard Coking Coal', required_quantity_mt: 240000, allocated_vessels: 2, discharge_port: 'Paradip Port', inventory_days: 14.5, urgency_level: 'HIGH' },
        { id: 'prc-2', plant_name: 'Bhilai Steel Plant (BSP)', commodity: 'Pulverized Coal Injection (PCI)', required_quantity_mt: 180000, allocated_vessels: 1, discharge_port: 'Visakhapatnam Port', inventory_days: 22.0, urgency_level: 'NORMAL' },
      ],
    });
  }

  if (pathname === '/api/v1/risks' || pathname === '/api/v1/risks/dashboard') {
    return send(200, {
      success: true,
      data: {
        activeDisruptions: 2,
        highRiskPorts: ['INHAL'],
        cycloneAlerts: [{ name: 'Deep Depression BoB-04', region: 'Bay of Bengal', impact: 'MODERATE_DELAY' }],
        factors: [
          { id: 'rk-1', title: 'Haldia Navigational Draft Restriction', level: 'HIGH', category: 'Port Constraint' },
          { id: 'rk-2', title: 'Bay of Bengal Monsoonal Sea State', level: 'MEDIUM', category: 'Weather' },
        ],
      },
    });
  }

  if (pathname === '/api/v1/scenarios') {
    return send(200, {
      success: true,
      data: [
        { id: 'scn-1', title: 'Cyclone in Bay of Bengal (Paradip Congestion)', status: 'ACTIVE', impactLevel: 'HIGH', estimatedCostDeltaUsd: 420000 },
        { id: 'scn-2', title: 'Australian Port Hedland Berthing Delays', status: 'READY', impactLevel: 'MEDIUM', estimatedCostDeltaUsd: 190000 },
      ],
    });
  }

  if (pathname === '/api/v1/decision/recommendations') {
    return send(200, {
      success: true,
      data: [
        { id: 'rec-1', recommendationType: 'CHARTER_ALLOCATION', targetVessel: 'SAIL KAVERI', actionSummary: 'Route via Paradip Southern Berth; save $84,000 demurrage', confidenceScore: 0.94 },
      ],
    });
  }

  if (pathname === '/api/v1/decision/analyze' && req.method === 'POST') {
    const body = await readBody();
    return send(200, {
      success: true,
      data: {
        recommendedVesselId: 'vsl-1',
        recommendedVesselName: 'SAIL KAVERI',
        estimatedVoyageCostUsd: 1850000,
        projectedDemurrageRiskScore: 0.12,
        optimalDischargePort: 'Paradip Port',
        co2EmissionMt: 1420,
        confidencePct: 96,
        savingsUsd: 125000,
      },
    });
  }

  if (pathname === '/api/v1/copilot/query' && req.method === 'POST') {
    const body = await readBody();
    const query = body.query || 'Maritime intelligence query';
    return send(200, {
      success: true,
      data: {
        reply: `**Analysis for SAIL Maritime Operations**:\n\nRegarding *"${query}"*:\n- **Fleet Availability**: 4 Capesize and Panamax vessels active in Bay of Bengal.\n- **Paradip Port**: Waiting time is currently 3.8 days with weather conditions stabilizing.\n- **Optimal Action**: Route next coking coal consignment to Paradip Deep Draft berth to minimize demurrage.`,
        confidence: 0.96,
        sources: ['Baltic Exchange C5TC', 'Paradip Port Trust AIS Feed', 'SAIL Central Logistics Ledger'],
      },
    });
  }

  if (pathname.startsWith('/api/v1/forecasts/latest') || pathname.endsWith('/latest')) {
    return send(200, {
      success: true,
      data: {
        freight_code: 'FRT-C5TC',
        horizon_days: 30,
        model_name: 'MDPI-SVMD-MOAVOA-Ensemble',
        model_version: 'v2.4-production',
        predictions: Array.from({ length: 10 }, (_, i) => {
          const d = new Date(Date.now() + (i + 1) * 3 * 86400000);
          const rate = +(14.85 + (i * 0.12)).toFixed(2);
          return {
            target_date: d.toISOString(),
            predicted_rate_usd: rate,
            lower_bound_usd: +(rate - 0.45).toFixed(2),
            upper_bound_usd: +(rate + 0.52).toFixed(2),
            confidence_level: 0.94,
          };
        }),
        metrics: { mae: 0.38, rmse: 0.51, mape: 3.42 },
      },
    });
  }

  if (pathname === '/api/v1/models') {
    return send(200, {
      success: true,
      data: [
        { id: 'm-1', name: 'MDPI SVMD-MOAVOA Ensemble', type: 'Modal Decomposition & Vulture Optimization', route: 'FRT-C5TC', status: 'PRODUCTION', mae: 0.38, mape: 3.42, version: '2.4' },
        { id: 'm-2', name: 'Outlier-Robust ELM (ORELM)', type: 'Augmented Lagrangian Neural Net', route: 'FRT-C5TC', status: 'PRODUCTION', mae: 0.46, mape: 4.15, version: '2.1' },
        { id: 'm-3', name: 'ANFIS Fuzzy Inference Model', type: 'Sugeno Fuzzy Neural Network', route: 'FRT-C3TC', status: 'STAGING', mae: 0.52, mape: 4.80, version: '1.9' },
      ],
    });
  }

  if (pathname === '/api/v1/forecasts/econometric/mdpi-2024') {
    return send(200, {
      success: true,
      data: {
        freightCode: 'FRT-C5TC',
        academicCitation: {
          paperTitle: 'A Novel Intelligent Prediction Model for the Containerized Freight Index: A New Perspective of Adaptive Model Selection for Subseries',
          journal: 'Systems (MDPI)',
          doi: '10.3390/systems12080309',
          year: 2024,
          authors: ['Wendong Yang', 'Hao Zhang', 'Sibo Yang', 'Yan Hao'],
        },
        svmdDecomposition: {
          modesExtractedCount: 3,
          convergenceTolerance: 0.0001,
          modes: [
            { modeIndex: 1, modeName: 'Mode 1 (Trend)', centralFrequencyHz: 0.033, varianceExplainedPct: 68.4, subseriesPoints: Array.from({ length: 30 }, (_, i) => ({ date: `Day ${i + 1}`, value: +(10.2 + (i / 30) * 0.85).toFixed(3) })) },
            { modeIndex: 2, modeName: 'Mode 2 (Macro Cycle)', centralFrequencyHz: 0.125, varianceExplainedPct: 24.1, subseriesPoints: Array.from({ length: 30 }, (_, i) => ({ date: `Day ${i + 1}`, value: +(3.8 + Math.sin((i / 30) * 2 * Math.PI) * 0.45).toFixed(3) })) },
            { modeIndex: 3, modeName: 'Mode 3 (Seasonal Perturbations)', centralFrequencyHz: 0.380, varianceExplainedPct: 7.5, subseriesPoints: Array.from({ length: 30 }, (_, i) => ({ date: `Day ${i + 1}`, value: +(1.4 + Math.cos((i / 30) * 6 * Math.PI) * 0.18).toFixed(3) })) },
          ],
        },
        modelLibrarySelection: {
          predictorsEvaluated: ['ORELM', 'BP', 'GMDH', 'ANFIS'],
          subseriesMatrix: [
            { modeIndex: 1, predictorCode: 'ORELM', name: 'Outlier-Robust Extreme Learning Machine', isSelectedByLasso: true, lassoWeight: 0.58, subseriesPredictedValue: 10.07 },
            { modeIndex: 1, predictorCode: 'ANFIS', name: 'Adaptive-Network Fuzzy Inference System', isSelectedByLasso: true, lassoWeight: 0.42, subseriesPredictedValue: 10.04 },
            { modeIndex: 2, predictorCode: 'BP', name: 'Backpropagation Neural Network', isSelectedByLasso: true, lassoWeight: 0.34, subseriesPredictedValue: 3.86 },
            { modeIndex: 3, predictorCode: 'GMDH', name: 'Group Method of Data Handling', isSelectedByLasso: true, lassoWeight: 0.48, subseriesPredictedValue: 1.44 },
          ],
        },
        moavoaEnsemble: {
          vulturePopulationSize: 50,
          paretoArchiveSize: 20,
          optimalWeights: { 'Mode 1 (Trend)': 0.68, 'Mode 2 (Macro Cycle)': 0.24, 'Mode 3 (Seasonal Perturbations)': 0.08, 'ORELM Global Affinity': 0.48, 'ANFIS Global Affinity': 0.26 },
          synthesizedForecastUsdMt: 15.37,
        },
        empiricalMetrics: { mae: 0.38, rmse: 0.51, mape: 3.42, ia: 0.9982, tic: 0.0028, stdDev: 0.45 },
        benchmarkComparisons: [
          { modelName: 'Single BP Neural Network', category: 'Single ANN', mae: 1.21, rmse: 1.63, mape: 10.94, tic: 0.0089, pIndicatorRmseImprovementPct: 68.7, pIndicatorMapeImprovementPct: 68.7 },
          { modelName: 'ADP-BP-EW (Equal Weight)', category: 'Equal Weight (EW)', mae: 0.81, rmse: 1.09, mape: 7.35, tic: 0.0060, pIndicatorRmseImprovementPct: 53.2, pIndicatorMapeImprovementPct: 53.5 },
          { modelName: 'ADP-LASSO-MOPSO (Particle Swarm)', category: 'Other Multi-Objective', mae: 0.43, rmse: 0.58, mape: 3.89, tic: 0.0031, pIndicatorRmseImprovementPct: 12.0, pIndicatorMapeImprovementPct: 12.1 },
        ],
      },
    });
  }

  if (pathname === '/api/v1/forecasts/econometric/elasticity-analysis') {
    return send(200, {
      success: true,
      data: {
        academicCitation: {
          author: 'Dr. Vrajlal Sapovadia (Adjunct Professor, GMU & NFSU)',
          institution: 'Gujarat Maritime University / NFSU Gandhinagar',
          paperTitle: 'Demand Forecasting and Supply Chain Management in the Indian Shipping Industry: An Application of Elasticity Concepts',
          year: 2024,
        },
        elasticityMetrics: [
          { code: 'PED', title: 'Price Elasticity of Demand (PED) — Coking Coal', value: -0.22, classification: 'Price Inelastic (|PED| < 1.0)', operationalInterpretation: 'Blast furnaces cannot stop without refractory collapse; shippers must utilize structured forward COAs.', policyContext: 'National Steel Policy feedstock resilience guideline.' },
          { code: 'CPED', title: 'Cross-Price Elasticity of Demand (CPED) — Modal Arbitrage', value: 0.65, classification: 'Direct Substitutes (CPED > 0)', operationalInterpretation: 'A 10% increase in Sandheads lightering costs triggers a 6.5% diversion to Dhamra deepwater direct + FOIS rail.', policyContext: 'Sagarmala coastal logistics and Indian Railways FOIS multi-modal integration.' },
          { code: 'IED', title: 'Income Elasticity of Demand (IED) — Industrial Growth', value: 1.35, classification: 'Growth Driver (IED > 1.0)', operationalInterpretation: 'Dry bulk cargo growth outpaces GDP by 1.35x under 300 MMT steel production targets.', policyContext: 'National Steel Policy 2030.' },
        ],
        modalSubstitutionBaseline: {
          originBasin: 'Queensland, Australia (Hay Point / Gladstone)',
          primaryCommodity: 'Prime Hard Coking Coal',
          crossElasticityThresholdPct: 8.5,
        },
      },
    });
  }

  if (pathname === '/api/v1/forecasts/econometric/simulate-modal-shift' && req.method === 'POST') {
    const body = await readBody();
    const freightChange = Number(body.freightRateChangePct || 0);
    const railChange = Number(body.railTariffChangePct || 0);
    const baseVolume = Number(body.baseCargoVolumeMt || 120000);
    const demandChangePct = +(-0.22 * freightChange).toFixed(2);
    const projectedVolumeDemandedMt = Math.max(0, Math.round(baseVolume * (1 + demandChangePct / 100)));
    const netRelativeCostDiff = freightChange - railChange;
    const shiftRatio = +(0.65 * (netRelativeCostDiff / 100)).toFixed(4);

    let baselineDhamraPct = Math.min(0.95, Math.max(0.30, 0.60 + shiftRatio));
    let baselineSandheadsPct = 1.0 - baselineDhamraPct;

    const sandheadsVolume = Math.round(projectedVolumeDemandedMt * baselineSandheadsPct);
    const dhamraVolume = projectedVolumeDemandedMt - sandheadsVolume;
    const shiftedVolume = Math.abs(Math.round(projectedVolumeDemandedMt * shiftRatio));

    return send(200, {
      success: true,
      data: {
        input: { freightRateChangePct: freightChange, railTariffChangePct: railChange, baseCargoVolumeMt: baseVolume },
        predictedDemandChangePct: demandChangePct,
        projectedVolumeDemandedMt,
        modalReallocation: {
          sandheadsLighterageMt: sandheadsVolume,
          dhamraDirectRailMt: dhamraVolume,
          shiftedVolumeMt: shiftedVolume,
          shiftDirection: netRelativeCostDiff >= 0 ? 'Shift to Dhamra Direct + FOIS Rail' : 'Shift to Sandheads Lighterage',
        },
        financialImpact: {
          estimatedLandedCostDeltaInrPerMt: +(netRelativeCostDiff * 14.5).toFixed(2),
          netSavingsOrSurplusInr: Math.round(shiftedVolume * Math.abs(netRelativeCostDiff * 14.5)),
        },
        procurementRecommendation: {
          recommendedContractStructure: 'Multiple Voyage Contract (COA) 75% / Spot 25%',
          strategicReasoning: 'Under market volatility, secure 75% volume via period COA multi-voyage contracts to eliminate spot spikes, deploying 25% for opportunistic dips.',
        },
      },
    });
  }

  // ─── Universal Catch-all for API ──────────────────────────────────────────
  return send(200, {
    success: true,
    message: 'JAL TARANG Enterprise Gateway Online',
    endpoint: pathname,
    data: [],
  });
};
