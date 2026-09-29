"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIFTY_MARITIME_NOTIFICATIONS = void 0;
exports.FIFTY_MARITIME_NOTIFICATIONS = [
    {
        id: 'notif-live-01',
        title: 'MV Ocean Ambition AIS Speed Drop in Bay of Bengal',
        message: 'Capesize vessel speed decreased from 12.4 kts to 8.1 kts due to swell resistance 85nm SE of Paradip. ETA revised to 24-Sep 16:30 IST (+2.5h).',
        role: 'CHARTERING_MANAGER',
        severity: 'WARNING',
        category: 'VESSEL_TELEMETRY',
        link: '/chartering',
        metadata: { vessel: 'MV Ocean Ambition', imo: '9845124', speedKnots: 8.1, delayHours: 2.5 }
    },
    {
        id: 'notif-live-02',
        title: 'IMD Cyclone Alert: Local Cautionary Signal 3 at Paradip',
        message: 'Deep depression in West Central Bay of Bengal generating 2.3m swell waves. Paradip Port Outer Anchorage vessels advised on 1-hour engine notice.',
        role: 'PORT_MANAGER',
        severity: 'CRITICAL',
        category: 'CYCLONE_ALERT',
        link: '/ports',
        metadata: { port: 'Paradip Port', signal: 'LC-3', swellM: 2.3, windKts: 28 }
    },
    {
        id: 'notif-live-03',
        title: 'Visakhapatnam Outer Anchorage Wait Reaches 3.8 Days',
        message: 'Pre-berthing queue increased with 4 Capesize vessels waiting for mechanized berths. Recommending queue diverting for inbound met coal shipments.',
        role: 'PORT_MANAGER',
        severity: 'WARNING',
        category: 'PORT_CONGESTION',
        link: '/ports',
        metadata: { port: 'Visakhapatnam', waitDays: 3.8, waitingVessels: 4 }
    },
    {
        id: 'notif-live-04',
        title: 'USD/INR Volatility Jump +₹0.42 (Frankfurter Live Rate)',
        message: 'Exchange rate rose to ₹95.88/$; landed freight calculation for Gladstone-Paradip increases by +₹5.25/MT on active voyage charters.',
        role: 'ANALYST',
        severity: 'INFO',
        category: 'FX_VOLATILITY',
        link: '/data',
        metadata: { fxRate: 95.88, impactPerMtInr: 5.25, currency: 'USD/INR' }
    },
    {
        id: 'notif-live-05',
        title: 'Singapore VLSFO Bunker Fuel Drops to $592/MT',
        message: '0.5% Low Sulphur Marine Fuel index dropped $14/MT today. Favorable window opened for round-voyage bunker stems for Queensland return legs.',
        role: 'CHARTERING_MANAGER',
        severity: 'SUCCESS',
        category: 'BUNKER_PRICES',
        link: '/freight',
        metadata: { hub: 'Singapore', priceUsd: 592, deltaUsd: -14 }
    },
    {
        id: 'notif-live-06',
        title: 'Bhilai Steel Plant Coking Coal Buffer at 17.8 Days',
        message: 'Stock cushion dropped below 21-day emergency threshold. Immediate Australian spot allocation required to prevent blast furnace feed throttling.',
        role: 'PROCUREMENT_MANAGER',
        severity: 'CRITICAL',
        category: 'STOCK_BUFFER',
        link: '/procurement',
        metadata: { plant: 'Bhilai', daysStock: 17.8, targetDays: 21 }
    },
    {
        id: 'notif-live-07',
        title: 'Capesize Fixture Confirmed: Gladstone → Paradip ($11.85/MT)',
        message: 'Fixture SAIL/CHTR/COA/2026/089 signed with Oldendorff Carriers. 160,000 MT Hard Coking Coal loaded under benchmark budget ($12.50/MT).',
        role: 'CHARTERING_MANAGER',
        severity: 'SUCCESS',
        category: 'CHARTERING_FIXTURE',
        link: '/contracts',
        metadata: { fixtureId: 'SAIL/CHTR/COA/2026/089', rateUsd: 11.85, savingsUsd: 104000 }
    },
    {
        id: 'notif-live-08',
        title: 'Malacca Strait Traffic Density Exceeds Normal by 22%',
        message: 'Chokepoint transit delays averaging +8 hours near Phillips Channel. Inbound vessels MV Kalingan Pride and MV Steel Glory adjusting transit headings.',
        role: 'ALL',
        severity: 'INFO',
        category: 'CANAL_TRANSIT',
        link: '/control-tower',
        metadata: { location: 'Malacca Strait', congestionIndex: 1.22, delayHours: 8 }
    },
    {
        id: 'notif-live-09',
        title: 'MV Bharat Gaurav RightShip GHG Rating Upgraded to 4.5★',
        message: 'Drydock propeller boss cap fins installation approved. Vessel qualifies for lowest carbon tier and passes all SAIL ESG chartering vetting gates.',
        role: 'ADMIN',
        severity: 'SUCCESS',
        category: 'RIGHTSHIP_VETTING',
        link: '/decision',
        metadata: { vessel: 'MV Bharat Gaurav', rating: 4.5, esgTier: 'A' }
    },
    {
        id: 'notif-live-10',
        title: 'Laytime Expiry Alert: MV Bengal Star at Haldia Berth 4',
        message: 'Allowed laytime expires in 14 hours. Demurrage rate of $16,500/day will trigger unless discharge rate increases to 1,200 MT/hr.',
        role: 'CHARTERING_MANAGER',
        severity: 'WARNING',
        category: 'DEMURRAGE_RISK',
        link: '/chartering',
        metadata: { vessel: 'MV Bengal Star', hoursLeft: 14, demurrageRateUsd: 16500 }
    },
    {
        id: 'notif-live-11',
        title: 'Coking Coal Tender Awarded: 120k MT Queensland Hard Coking',
        message: 'Optimal multi-supplier award approved: BHP Mitsubishi Alliance (70k MT) + Anglo American (50k MT) yielding ₹28.5L net landed cost savings.',
        role: 'PROCUREMENT_MANAGER',
        severity: 'SUCCESS',
        category: 'TENDER_AWARD',
        link: '/procurement',
        metadata: { tenderId: 'SAIL/CC/2026/Q3-04', volumeMt: 120000, savingsInr: 2850000 }
    },
    {
        id: 'notif-live-12',
        title: 'Baltic Capesize Index (BCI) Advances +142 Points to 2,840',
        message: 'Western Australia to China ore demand rally spilling over into Pacific coal voyages. Forward freight curves suggest contracting ahead of October peak.',
        role: 'ANALYST',
        severity: 'WARNING',
        category: 'BALTIC_DRY_INDEX',
        link: '/freight',
        metadata: { bci: 2840, delta: 142, market: 'Pacific Capesize' }
    },
    {
        id: 'notif-live-13',
        title: 'Indian Railways Allocates 28 Rakes for Paradip → Rourkela',
        message: 'East Coast Railway confirmed rake rake availability for 24-hour cycle. Expected evacuation of 105,000 MT stockpiled coal from Paradip Terminal.',
        role: 'PORT_MANAGER',
        severity: 'SUCCESS',
        category: 'RAIL_EVACUATION',
        link: '/ports',
        metadata: { rakesAllocated: 28, capacityMt: 105000, corridor: 'Paradip to Rourkela' }
    },
    {
        id: 'notif-live-14',
        title: 'Red Sea Security Advisory: Cape of Good Hope Transit Baseline',
        message: 'All European/Atlantic equipment and spares voyages rerouted via Cape of Good Hope (+11 to 14 days transit). No maritime threat to Indian Ocean coal corridors.',
        role: 'ALL',
        severity: 'INFO',
        category: 'GEOPOLITICAL_RISK',
        link: '/risk',
        metadata: { route: 'Cape of Good Hope', securityLevel: 2, delayDays: 12 }
    },
    {
        id: 'notif-live-15',
        title: 'Haldia Dock Complex Imposes 9.2m Estuary Draught Gate',
        message: 'SMP Kolkata hydrographic survey indicates siltation near Balari bar. Fully laden Panamax vessels require lightering at Sandheads before entry.',
        role: 'PORT_MANAGER',
        severity: 'WARNING',
        category: 'DRAUGHT_RESTRICTION',
        link: '/ports',
        metadata: { port: 'Haldia', maxDraughtM: 9.2, status: 'LIGHTERING_MANDATORY' }
    },
    {
        id: 'notif-live-16',
        title: 'World Bank Pink Sheet: Australian Premium Coking Coal at $248/t',
        message: 'Official monthly benchmark published today. International metallurgical coal prices stable (+0.4% m-o-m) providing steady procurement baseline.',
        role: 'ANALYST',
        severity: 'INFO',
        category: 'COMMODITY_BENCHMARK',
        link: '/data',
        metadata: { commodity: 'Hard Coking Coal', priceUsd: 248.00, source: 'World Bank' }
    },
    {
        id: 'notif-live-17',
        title: 'Neural Ensemble Forecasts Capesize C5TC Drop of -4.2% Next Week',
        message: 'LSTM + XGBoost multi-horizon freight model predicts rate easing to $11.35/MT across Pacific routes over the next 10-14 days. Suggest holding spot tender.',
        role: 'ANALYST',
        severity: 'INFO',
        category: 'AI_FORECAST_SIGNAL',
        link: '/forecasting',
        metadata: { model: 'Neural Ensemble v2.4', predictedChangePct: -4.2, confidence: 0.91 }
    },
    {
        id: 'notif-live-18',
        title: 'EU ETS Maritime Carbon Cost: SAIL Fleet Score Confirmed A-Tier',
        message: 'Annual MRV audit confirms chartered vessel efficiency meets Carbon Intensity Indicator (CII) rating A, exempting voyages from secondary carbon surcharges.',
        role: 'ADMIN',
        severity: 'SUCCESS',
        category: 'CARBON_EMISSIONS',
        link: '/decision',
        metadata: { ciiRating: 'A', surchargeSavedUsd: 42000 }
    },
    {
        id: 'notif-live-19',
        title: 'MLC 2006 Port State Control Clearance Completed at Vizag',
        message: 'Mercantile Marine Department (MMD) completed inspection of MV Odisha Pioneer. Zero deficiencies reported; vessel cleared for immediate discharge.',
        role: 'PORT_MANAGER',
        severity: 'SUCCESS',
        category: 'CREW_WELFARE',
        link: '/ports',
        metadata: { vessel: 'MV Odisha Pioneer', port: 'Visakhapatnam', deficiencies: 0 }
    },
    {
        id: 'notif-live-20',
        title: 'International Group P&I Club Certificate Validated: MV Steel Glory',
        message: 'NorthStandard Club blue card verification confirmed valid through February 2027. Full maritime pollution and cargo liability coverage verified.',
        role: 'ADMIN',
        severity: 'INFO',
        category: 'P_AND_I_CLUB',
        link: '/decision',
        metadata: { vessel: 'MV Steel Glory', club: 'NorthStandard P&I', validity: '2027-02-20' }
    },
    {
        id: 'notif-live-21',
        title: 'Bokaro Blast Furnace #2 Restarts: Monthly Met Coal Need +45k MT',
        message: 'Planned relining completed ahead of schedule. Plant daily coking coal draw increased to 12,400 MT/day. Logistics plan adjusted with Haldia rail despatches.',
        role: 'PROCUREMENT_MANAGER',
        severity: 'WARNING',
        category: 'BLAST_FURNACE_DEMAND',
        link: '/procurement',
        metadata: { plant: 'Bokaro', incrementalMt: 45000, newDailyDrawMt: 12400 }
    },
    {
        id: 'notif-live-22',
        title: 'Counterparty Due Diligence Passed: Oldendorff Carriers GmbH',
        message: 'Quarterly financial liquidity check, OFAC/EU sanctions screening, and Indian Ministry of Shipping registry check cleared with 98.4/100 risk score.',
        role: 'ADMIN',
        severity: 'SUCCESS',
        category: 'COUNTERPARTY_KYC',
        link: '/decision',
        metadata: { counterparty: 'Oldendorff Carriers', kycScore: 98.4, status: 'APPROVED' }
    },
    {
        id: 'notif-live-23',
        title: 'Dhamra Port Suspends Night Pilotage Due to 2.8m Swell Waves',
        message: 'Port Harbour Master notice: Boarding grounds experiencing heavy swell and cross currents. Berthing of Capesize vessels restricted to daylight tide windows.',
        role: 'PORT_MANAGER',
        severity: 'WARNING',
        category: 'PILOTAGE_SUSPENSION',
        link: '/ports',
        metadata: { port: 'Dhamra', swellM: 2.8, restriction: 'DAYLIGHT_ONLY' }
    },
    {
        id: 'notif-live-24',
        title: 'FOB vs CFR Arbitrage: FOB Queensland Delivers ₹34.5/MT Benefit',
        message: 'Combining competitive SAIL-chartered Capesize with FOB port pricing beats trading house CFR spot quotes by ₹34.50/MT net landed cost at Paradip.',
        role: 'PROCUREMENT_MANAGER',
        severity: 'SUCCESS',
        category: 'ARBITRAGE_WINDOW',
        link: '/procurement',
        metadata: { arbitrageGainInr: 34.50, recommendedMode: 'FOB_CHARTER' }
    },
    {
        id: 'notif-live-25',
        title: 'Sandheads Deepwater Lightering Cleared for MV Kalingan Pride',
        message: 'Transshipment permission granted for 45,000 MT lightering off Sandheads onto daughter barge MV Coastal Carrier. Haldia entry draft safe.',
        role: 'PORT_MANAGER',
        severity: 'SUCCESS',
        category: 'LIGHTERING_OPERATION',
        link: '/ports',
        metadata: { motherVessel: 'MV Kalingan Pride', lighteredMt: 45000, location: 'Sandheads' }
    },
    {
        id: 'notif-live-26',
        title: 'ICEGATE Bill of Entry Processed for 160k MT Hard Coking Coal',
        message: 'Customs clearance completed under Customs Notification 25/2026. Electronic gate pass generated for rake loading from Paradip Wharf #2.',
        role: 'ALL',
        severity: 'INFO',
        category: 'CUSTOMS_CLEARANCE',
        link: '/procurement',
        metadata: { beNumber: 'BE-2026-098812', port: 'Paradip', dutyPaidInr: 0 }
    },
    {
        id: 'notif-live-27',
        title: 'Southwest Monsoon Surge: Bay of Bengal Gale Warning Force 7',
        message: 'IMD synoptic charts indicate 30-35 knot squally winds across South-East coast. All master mariners advised to maintain minimum 2.5m under-keel clearance.',
        role: 'ALL',
        severity: 'WARNING',
        category: 'MONSOON_ADVISORY',
        link: '/data',
        metadata: { windForce: 'Force 7', gustKnots: 38, advisory: 'HIGH_SWELL_WATCH' }
    },
    {
        id: 'notif-live-28',
        title: 'Weather Routing Update: Great Circle Route Saves 18 MT VLSFO',
        message: 'Decision Engine recalculated passage from Abbot Point to Visakhapatnam via Lombok Strait, bypassing equatorial counter-currents ($10,650 bunker saving).',
        role: 'CHARTERING_MANAGER',
        severity: 'SUCCESS',
        category: 'VOYAGE_OPTIMIZATION',
        link: '/chartering',
        metadata: { vessel: 'MV Steel Glory', fuelSavedMt: 18, savingsUsd: 10650 }
    },
    {
        id: 'notif-live-29',
        title: 'COA Milestone: 70% Annual Minimum Volume Reached with SCI',
        message: 'Contract of Affreightment with Shipping Corporation of India reached 2.8 MT of 4.0 MT commitment. Rebate clause triggers at 3.5 MT.',
        role: 'ADMIN',
        severity: 'INFO',
        category: 'CONTRACT_MILESTONE',
        link: '/contracts',
        metadata: { counterparty: 'SCI', progressPct: 70, volumeMovedMt: 2800000 }
    },
    {
        id: 'notif-live-30',
        title: 'Paradip Spring High Tide Window Confirms 17.5m Draft Inbound',
        message: 'Tidal gauge telemetry confirms 2.4m tide surge at 14:15 IST tomorrow. Deep-draft Capesize MV Bharat Gaurav cleared for direct approach.',
        role: 'PORT_MANAGER',
        severity: 'SUCCESS',
        category: 'TIDAL_WINDOW',
        link: '/ports',
        metadata: { port: 'Paradip', maxDraftM: 17.5, tidalSurgeM: 2.4 }
    },
    {
        id: 'notif-live-31',
        title: 'Singapore Strait Piracy Advisory: Level 1 Vigilance Advised',
        message: 'ReCAAP ISC report: Two attempted boardings in eastbound lane of Singapore Strait. Inbound SAIL chartered vessels advised enhanced anti-piracy watch.',
        role: 'ALL',
        severity: 'WARNING',
        category: 'SECURITY_THREAT',
        link: '/risk',
        metadata: { threatLevel: 'LEVEL_1', region: 'Singapore Strait', agency: 'ReCAAP ISC' }
    },
    {
        id: 'notif-live-32',
        title: 'Paradip Coal Terminal Gantry Unloader #3 Scheduled Overhaul',
        message: 'Major maintenance scheduled 28-30 September. Berth handling rate temporarily reduced by 15% to 46,000 MT/day. Rake evacuation prioritized.',
        role: 'PORT_MANAGER',
        severity: 'INFO',
        category: 'EQUIPMENT_MAINTENANCE',
        link: '/ports',
        metadata: { terminal: 'Paradip Mechanized', impact: '-15% Handling', durationDays: 2 }
    },
    {
        id: 'notif-live-33',
        title: 'FFA Advisory: Q4 Paper Hedge Recommended on C5TC at $12.20/t',
        message: 'Freight Derivatives desk advises locking in 3 Capesize equivalents for November shipping to protect against anticipated Q4 Atlantic surge.',
        role: 'ANALYST',
        severity: 'INFO',
        category: 'HEDGE_RECOMMENDATION',
        link: '/decision',
        metadata: { instrument: 'FFA Q4-C5TC', targetPriceUsd: 12.20, recommendation: 'BUY_HEDGE' }
    },
    {
        id: 'notif-live-34',
        title: 'All Major Indian Ports Operative: Dockworkers Accord Extended',
        message: 'National Industrial Tribunal tripartite agreement extended for 12 months. Zero strike or disruption risk across Paradip, Vizag, and Haldia.',
        role: 'ALL',
        severity: 'SUCCESS',
        category: 'LABOR_UNION_NOTICE',
        link: '/ports',
        metadata: { accord: 'Bilateral Port Wage Accord', status: 'RATIFIED', durationMonths: 12 }
    },
    {
        id: 'notif-live-35',
        title: 'JWC Listed Areas Unaltered: Indian Ocean Transit Baseline Normal',
        message: 'Joint War Committee maintains baseline status for Eastern Indian Ocean. Additional War Risk Premiums (AWRP) remain zero for Australia-India trade.',
        role: 'ALL',
        severity: 'SUCCESS',
        category: 'INSURANCE_WAR_RISK',
        link: '/risk',
        metadata: { jwcStatus: 'NORMAL', awrpSurcharge: 0 }
    },
    {
        id: 'notif-live-36',
        title: 'Lab Assay Passed: Dalrymple Bay Coal Ash 9.4% (In Spec)',
        message: 'Pre-shipment sampling by Bureau Veritas at Dalrymple Bay confirms volatile matter 21.2%, CSR 71, and moisture 8.5%. Cargo approved for loading.',
        role: 'PROCUREMENT_MANAGER',
        severity: 'SUCCESS',
        category: 'QUALITY_ASSURANCE',
        link: '/procurement',
        metadata: { cargoId: 'DBCT-2026-08', ashPct: 9.4, csr: 71, inspectionAgency: 'Bureau Veritas' }
    },
    {
        id: 'notif-live-37',
        title: 'IMO D-2 Ballast Water Management System Passed at Gangavaram',
        message: 'Port health officers sampled UV treatment unit on MV Deccan Exporter. Discharged water within strict ecological norms; de-ballasting underway.',
        role: 'PORT_MANAGER',
        severity: 'SUCCESS',
        category: 'BALLAST_WATER',
        link: '/ports',
        metadata: { vessel: 'MV Deccan Exporter', port: 'Gangavaram', standard: 'IMO D-2' }
    },
    {
        id: 'notif-live-38',
        title: 'Visakhapatnam EQ-1 Achieves 52,000 MT/Day Discharging Rate',
        message: 'Record turnaround: 75,000 MT met coal discharged in 34.6 hours, saving 1.2 days laytime and earning $9,900 despatch credit for SAIL.',
        role: 'CHARTERING_MANAGER',
        severity: 'SUCCESS',
        category: 'BERTH_PRODUCTIVITY',
        link: '/chartering',
        metadata: { port: 'Visakhapatnam', berth: 'EQ-1', rateMtDay: 52000, despatchUsd: 9900 }
    },
    {
        id: 'notif-live-39',
        title: 'Dhamra Port Stockyard Utilisation at 68% (Healthy Capacity)',
        message: 'Total bulk coal stockpile stands at 420,000 MT. Sufficient capacity to accept 2 incoming Capesize vessels without stacker-reclaimer bottlenecks.',
        role: 'PORT_MANAGER',
        severity: 'INFO',
        category: 'STORAGE_YARD_CAPACITY',
        link: '/ports',
        metadata: { port: 'Dhamra', utilisationPct: 68, availableCapacityMt: 180000 }
    },
    {
        id: 'notif-live-40',
        title: 'Dugda Coal Washery Yield Stabilized at 54.2% Prime Clean Coal',
        message: 'Domestic coking coal beneficiation unit reported optimal yield. Blending ratio for Bokaro Steel Plant adjusted to 30% domestic / 70% imported.',
        role: 'PROCUREMENT_MANAGER',
        severity: 'INFO',
        category: 'COAL_WASHING',
        link: '/procurement',
        metadata: { washery: 'Dugda', yieldPct: 54.2, blendRatio: '30D / 70I' }
    },
    {
        id: 'notif-live-41',
        title: 'East India Coastal Current (EICC) Northward Drift +0.8 kts Advantage',
        message: 'Oceanographic forecast: Inbound Capesize vessels navigating up Bay of Bengal receiving favourable surface currents, trimming 3 hours voyage duration.',
        role: 'CHARTERING_MANAGER',
        severity: 'INFO',
        category: 'OCEAN_CURRENT',
        link: '/data',
        metadata: { currentName: 'EICC', driftSpeedKnots: 0.8, timeSavedHours: 3 }
    },
    {
        id: 'notif-live-42',
        title: 'Speed & Consumption Claim Settled Amicably (-$8,200 Bunker Off-Hire)',
        message: 'Dispute regarding voyage 14 heavy weather speed reduction reconciled with vessel owners. $8,200 deducted from final charter party hire invoice.',
        role: 'CHARTERING_MANAGER',
        severity: 'SUCCESS',
        category: 'DISPUTE_RESOLUTION',
        link: '/contracts',
        metadata: { claimId: 'CLM-2026-014', settlementAmountUsd: 8200, status: 'SETTLED' }
    },
    {
        id: 'notif-live-43',
        title: 'State Bank of India Releases $14.2M LC for Gladstone Cargo #4',
        message: 'Documentary letter of credit clean bill of lading verified against SAIL purchase order #PO-SAIL-2026-081. Funds released to BHP Billiton.',
        role: 'ADMIN',
        severity: 'SUCCESS',
        category: 'ESCROW_RELEASE',
        link: '/procurement',
        metadata: { lcNumber: 'LC-SBI-2026-049', amountUsd: 14200000, bank: 'State Bank of India' }
    },
    {
        id: 'notif-live-44',
        title: 'Sentinel-1 SAR Radar Detects Clear Waters Along Odisha Fairway',
        message: 'European Space Agency satellite synthetic aperture radar pass confirms zero oil slicks, debris, or unmonitored fishing flotillas along Paradip fairway.',
        role: 'ALL',
        severity: 'INFO',
        category: 'SATELLITE_RADAR',
        link: '/data',
        metadata: { satellite: 'Sentinel-1 SAR', fairway: 'Paradip Approaches', status: 'CLEAR' }
    },
    {
        id: 'notif-live-45',
        title: 'Annual Paradip Harbour Tug & Emergency Towing Exercise Completed',
        message: 'Tugboats MT Ocean Pride and MT Utkal successfully tested emergency towing arrangement with ballast Capesize tanker in outer harbour.',
        role: 'ALL',
        severity: 'INFO',
        category: 'EMERGENCY_DRILL',
        link: '/ports',
        metadata: { port: 'Paradip', drillType: 'EMERGENCY_TOWING', result: 'SATISFACTORY' }
    },
    {
        id: 'notif-live-46',
        title: 'Ministry of Finance Confirms 0% Basic Customs Duty on Coking Coal',
        message: 'Department of Revenue circular confirms continuation of duty-free import status for metallurgical coking coal through fiscal year 2026-27.',
        role: 'ADMIN',
        severity: 'SUCCESS',
        category: 'IMPORT_DUTY',
        link: '/data',
        metadata: { hsCode: '27011200', bcdRatePct: 0, ministry: 'Ministry of Finance' }
    },
    {
        id: 'notif-live-47',
        title: 'Coastal Shipping: 8,500 MT SAIL Finished Steel Dispatched to Ennore',
        message: 'Multi-modal logistics initiative: Coils loaded at Haldia on coastal feeder vessel MV Chennai Express, saving 38% carbon emissions vs rail.',
        role: 'ALL',
        severity: 'SUCCESS',
        category: 'CONTAINER_FEEDER',
        link: '/control-tower',
        metadata: { cargoMt: 8500, origin: 'Haldia', destination: 'Ennore', emissionReductionPct: 38 }
    },
    {
        id: 'notif-live-48',
        title: 'Tropical Depression 04B Diverted: Vessels Advised 50nm East of Track',
        message: 'JTWC and IMD cyclone trajectory models project landfall south of Visakhapatnam. Northbound bulk carriers routed along eastern fairway boundary.',
        role: 'CHARTERING_MANAGER',
        severity: 'WARNING',
        category: 'WEATHER_ROUTING',
        link: '/data',
        metadata: { depressionId: 'BOB-04B', deviationNm: 50, safetyMarginHours: 12 }
    },
    {
        id: 'notif-live-49',
        title: 'Internal Vigilance & CVC Compliance Audit Clearance Granted',
        message: 'Chief Vigilance Officer (CVO) completed statutory inspection of all charter fixtures above ₹50 Lakh for Q2. 100% compliant with e-tendering rules.',
        role: 'ADMIN',
        severity: 'SUCCESS',
        category: 'AUDIT_COMPLIANCE',
        link: '/decision',
        metadata: { auditBody: 'Central Vigilance Commission (CVC)', compliancePct: 100 }
    },
    {
        id: 'notif-live-50',
        title: 'Maritime Cybersecurity ISO 27001 Annual Token Rotation Done',
        message: 'Automated cryptographic secret rotation and RBAC access token renewal executed. Zero unauthorized penetration attempts recorded across past 180 days.',
        role: 'ADMIN',
        severity: 'SUCCESS',
        category: 'CYBER_DEFENSE',
        link: '/decision',
        metadata: { standard: 'ISO/IEC 27001:2022', status: 'TOKEN_ROTATION_SUCCESS', failedAttempts: 0 }
    },
];
//# sourceMappingURL=notificationsDataset.js.map