-- ============================================================================
-- SAIL MARINEX - REAL-TIME & HIGH-DENSITY MARITIME DATA SCHEMA EXTENSIONS
-- Problem Statement: SIH 26006
-- Normalized Pipeline: Cargo -> Commodity -> Quality Specs -> Procurement ->
--                      Vessel -> Charter -> Voyage -> Port -> Terminal -> 
--                      Detailed Cost Components -> Live Feeds
-- ============================================================================

-- 1. EXTENDED COMMODITY SPECIFICATIONS (10-20 technical attributes per commodity)
CREATE TABLE IF NOT EXISTS commodity_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cargo_type_id UUID NOT NULL REFERENCES cargo_types(id) ON DELETE CASCADE,
    commodity_code VARCHAR(50) NOT NULL, -- e.g. COAL_COKING_HARD, COAL_THERMAL_6000, IRON_ORE_62PCT
    commodity_name VARCHAR(150) NOT NULL,
    category_type VARCHAR(50) NOT NULL, -- DRY_BULK, LIQUID_BULK, BREAKBULK, PROJECT_CARGO, HAZARDOUS
    -- Technical & Chemical Specs (Normalized)
    gcv_kcal_kg NUMERIC(8, 2),            -- Gross Calorific Value (kcal/kg)
    fe_content_pct NUMERIC(5, 2),         -- Iron % for ore
    moisture_pct NUMERIC(5, 2),           -- Moisture percentage
    ash_content_pct NUMERIC(5, 2),        -- Ash percentage
    sulfur_pct NUMERIC(5, 2),             -- Sulfur percentage
    volatile_matter_pct NUMERIC(5, 2),    -- Volatile matter percentage
    phosphorus_pct NUMERIC(5, 3),         -- Phosphorus percentage
    silica_pct NUMERIC(5, 2),             -- Silica percentage
    alumina_pct NUMERIC(5, 2),            -- Alumina percentage
    density_t_m3 NUMERIC(6, 3),           -- Bulk Density (t/m3)
    viscosity_cst NUMERIC(8, 2),          -- Viscosity for liquid bulk (cSt at 50C)
    flash_point_deg_c NUMERIC(6, 2),      -- Flash point (deg C)
    grain_size_mm VARCHAR(50),            -- e.g. 0-10mm, 10-30mm
    stowage_factor_cbm_mt NUMERIC(6, 3),  -- Stowage factor
    angle_of_repose_deg NUMERIC(5, 2),    -- Angle of repose
    hazard_class VARCHAR(50),             -- IMO Class or IMSBC Group (A, B, C)
    un_number VARCHAR(20),                -- UN Hazard code if applicable
    origin_country_id UUID REFERENCES countries(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_commodity_spec_code UNIQUE (cargo_type_id, commodity_code)
);
CREATE INDEX IF NOT EXISTS idx_comm_spec_cat ON commodity_specifications(category_type);

-- 2. SUPPLIERS & OVERSEAS MINING / BULK PRODUCERS
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(50) UNIQUE NOT NULL, -- BHP, GLENCORE, VALE, ANGLO_AMERICAN, ADARO, PEABODY
    supplier_name VARCHAR(200) NOT NULL,
    country_id UUID NOT NULL REFERENCES countries(id),
    headquarters_city VARCHAR(100),
    commodity_specialization VARCHAR(100), -- MET_COAL, IRON_ORE, LIMESTONE
    credit_rating VARCHAR(20) DEFAULT 'AAA',
    reliability_score NUMERIC(4, 2) DEFAULT 95.0, -- 0-100%
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. DETAILED PROCUREMENT & CONTRACT ATTRIBUTES (15-25 fields)
CREATE TABLE IF NOT EXISTS procurement_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    commodity_spec_id UUID NOT NULL REFERENCES commodity_specifications(id),
    contract_type VARCHAR(50) NOT NULL, -- LONG_TERM_SUPPLY, ANNUAL_CONTRACT, SPOT_PURCHASE
    incoterm VARCHAR(20) NOT NULL DEFAULT 'FOB', -- FOB (Free on Board), CIF, CFR
    quantity_total_mt NUMERIC(14, 2) NOT NULL CHECK (quantity_total_mt > 0),
    quantity_tolerance_pct NUMERIC(4, 2) DEFAULT 10.0, -- +/- 10%
    base_purchase_price NUMERIC(14, 2) NOT NULL, -- Price per MT
    currency_id UUID NOT NULL REFERENCES currencies(id),
    pricing_basis VARCHAR(100) DEFAULT 'INDEX_LINKED', -- PLATTS_INDEX_LINKED, FIXED
    payment_terms VARCHAR(100) DEFAULT 'LC_AT_SIGHT', -- LC, DP, 30_DAYS
    origin_port_id UUID NOT NULL REFERENCES ports(id),
    destination_port_id UUID NOT NULL REFERENCES ports(id),
    delivery_window_start TIMESTAMPTZ NOT NULL,
    delivery_window_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. DETAILED CHARTER FIXTURES (Voyage, Time, Bareboat, COA with 15-25 fields)
CREATE TABLE IF NOT EXISTS charter_fixtures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixture_number VARCHAR(100) UNIQUE NOT NULL,
    charter_type VARCHAR(50) NOT NULL, -- VOYAGE_CHARTER, TIME_CHARTER, BAREBOAT_CHARTER, COA
    vessel_id UUID NOT NULL REFERENCES vessels(id),
    charterer_organization_id UUID NOT NULL REFERENCES organizations(id),
    shipowner_name VARCHAR(150) NOT NULL,
    loading_port_id UUID NOT NULL REFERENCES ports(id),
    discharge_port_id UUID NOT NULL REFERENCES ports(id),
    cargo_commodity_id UUID NOT NULL REFERENCES commodity_specifications(id),
    cargo_quantity_mt NUMERIC(12, 2) NOT NULL,
    laycan_start TIMESTAMPTZ NOT NULL,
    laycan_end TIMESTAMPTZ NOT NULL,
    freight_rate_per_mt NUMERIC(14, 4), -- for Voyage Charter
    daily_hire_rate_usd NUMERIC(14, 2),  -- for Time Charter
    demurrage_usd_per_day NUMERIC(12, 2) NOT NULL DEFAULT 25000,
    despatch_usd_per_day NUMERIC(12, 2) NOT NULL DEFAULT 12500,
    laytime_allowed_days NUMERIC(5, 2) NOT NULL DEFAULT 5.0,
    notice_of_readiness_hours INT NOT NULL DEFAULT 12,
    address_commission_pct NUMERIC(4, 2) DEFAULT 2.50,
    bunker_responsibility VARCHAR(50) DEFAULT 'CHARTERER', -- OWNER vs CHARTERER
    port_charges_responsibility VARCHAR(50) DEFAULT 'CHARTERER',
    status VARCHAR(30) NOT NULL DEFAULT 'FIXED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. COMPLETE 10-COMPONENT VOYAGE COST ENGINE
CREATE TABLE IF NOT EXISTS voyage_cost_breakdowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voyage_id UUID NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
    -- 10 Distinct Cost Components
    cargo_cost_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    ocean_freight_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    charter_cost_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    bunker_cost_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    port_charges_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    canal_charges_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    handling_discharge_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    demurrage_incurred_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    marine_insurance_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    inland_transport_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    inventory_carrying_cost_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    total_landed_cost_usd NUMERIC(16, 2) NOT NULL,
    landed_cost_per_mt NUMERIC(12, 2) NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. LIVE / REALTIME EXTERNAL MARITIME FEEDS
CREATE TABLE IF NOT EXISTS live_vessel_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    position_geog GEOGRAPHY(POINT, 4326),
    sog_knots NUMERIC(5, 2) NOT NULL, -- Speed over ground
    cog_deg NUMERIC(5, 2) NOT NULL,   -- Course over ground
    heading_deg NUMERIC(5, 2),
    nav_status VARCHAR(50) DEFAULT 'Underway using Engine',
    draught_m NUMERIC(5, 2),
    destination_raw VARCHAR(150),
    destination_port_id UUID REFERENCES ports(id),
    eta_reported TIMESTAMPTZ,
    distance_to_go_nm NUMERIC(8, 2),
    timestamp_utc TIMESTAMPTZ NOT NULL,
    data_source VARCHAR(50) NOT NULL DEFAULT 'AIS_FEED'
);
CREATE INDEX IF NOT EXISTS idx_telemetry_vessel_time ON live_vessel_telemetry(vessel_id, timestamp_utc DESC);

CREATE TABLE IF NOT EXISTS live_port_weather_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    temperature_c NUMERIC(5, 2),
    wind_speed_knots NUMERIC(6, 2) NOT NULL,
    wind_gust_knots NUMERIC(6, 2),
    wind_direction_deg NUMERIC(5, 2),
    wave_height_m NUMERIC(5, 2) NOT NULL,
    wave_period_sec NUMERIC(5, 2),
    visibility_km NUMERIC(5, 2),
    precipitation_mm NUMERIC(5, 2),
    cyclone_alert_level VARCHAR(20) DEFAULT 'NONE', -- NONE, DISTANT_WARNING, CAUTION, DANGER, SEVERE
    operational_impact VARCHAR(50) DEFAULT 'NORMAL', -- NORMAL, PILOT_SUSPENDED, SWELL_RESTRICTIONS, FULL_SHUTDOWN
    recorded_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_weather_port_time ON live_port_weather_feed(port_id, recorded_at DESC);

-- ============================================================================
-- DECISION ENGINE TABLES
-- ============================================================================

-- Idle Vessel Analysis: tracks idle periods, costs, and alternative employment
CREATE TABLE IF NOT EXISTS idle_vessel_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    idle_start TIMESTAMPTZ NOT NULL,
    idle_end TIMESTAMPTZ,
    idle_days NUMERIC(8, 2) NOT NULL DEFAULT 0,
    idle_cost_usd NUMERIC(20, 2),              -- Daily OPEX × idle days
    idle_reason VARCHAR(100),                   -- AWAITING_CARGO, PORT_CONGESTION, MECHANICAL, WEATHER
    alternative_employment TEXT,                -- Suggested alternative (spot fixture, layup, etc.)
    deadhead_nm NUMERIC(10, 2),                 -- Ballast (empty) miles
    deadhead_cost_usd NUMERIC(20, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_idle_vessel ON idle_vessel_analysis(vessel_id, idle_start DESC);

-- Decision Recommendations: persisted outputs of POST /decision/analyze
CREATE TABLE IF NOT EXISTS decision_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    loading_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,
    discharging_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,
    vessel_id UUID REFERENCES vessels(id) ON DELETE SET NULL,
    cargo_type_id UUID REFERENCES cargo_types(id) ON DELETE SET NULL,
    cargo_quantity_mt NUMERIC(15, 3) NOT NULL,
    recommended_strategy VARCHAR(30) NOT NULL, -- SPOT, COA, TIME_CHARTER
    confidence_score NUMERIC(4, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    tce_usd_day NUMERIC(18, 2),
    landed_cost_usd_mt NUMERIC(18, 4),
    voyage_pnl_usd NUMERIC(20, 2),
    total_voyage_days NUMERIC(8, 3),
    risk_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    decision_payload JSONB,                     -- Full engine output (economics, scenarios, risks)
    feedback_rating INT CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_decision_org_time ON decision_recommendations(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_strategy ON decision_recommendations(recommended_strategy);
COMMENT ON TABLE decision_recommendations IS 'Persisted outputs of the 16-step SAIL MARINEX decision engine (POST /api/v1/decision/analyze)';
