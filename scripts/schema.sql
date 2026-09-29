-- ============================================================================
-- SAIL MARINEX - COMPLETE ENTERPRISE DDL SCHEMA (POSTGRESQL 16+)
-- Intelligent Freight Forecasting, Vessel Chartering, Bulk Cargo Procurement
-- & Maritime Decision Intelligence
-- Organization: Ministry of Steel / Steel Authority of India Limited (SAIL)
-- Problem Statement: SIH 26006
-- ============================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- 1. REUSABLE TRIGGER FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 2. GEOGRAPHY & UNITS MASTER
-- ============================================================================

CREATE TABLE IF NOT EXISTS continents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iso2 VARCHAR(2) UNIQUE NOT NULL,
    iso3 VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(150) UNIQUE NOT NULL,
    continent_id UUID REFERENCES continents(id) ON DELETE SET NULL,
    un_code VARCHAR(10),
    is_maritime_nation BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_countries_iso3 ON countries(iso3);

CREATE TABLE IF NOT EXISTS states_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    state_code VARCHAR(20) NOT NULL,
    state_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_country_state_code UNIQUE (country_id, state_code)
);

CREATE TABLE IF NOT EXISTS currencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(3) UNIQUE NOT NULL, -- USD, INR, EUR, AUD
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places INT NOT NULL DEFAULT 2,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    to_currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
    rate NUMERIC(18, 6) NOT NULL CHECK (rate > 0),
    rate_date TIMESTAMPTZ NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'RBI_FED_REFERENCE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_curr_rate_pair_date UNIQUE (from_currency_id, to_currency_id, rate_date)
);

CREATE TABLE IF NOT EXISTS unit_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(50) UNIQUE NOT NULL, -- WEIGHT, VOLUME, DISTANCE, TIME, SPEED, MONETARY, RATE
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES unit_categories(id) ON DELETE CASCADE,
    unit_code VARCHAR(30) UNIQUE NOT NULL, -- MT, KG, TON, DWT, CBM, M3, USD, INR, USD/MT, USD/DAY, NM, KM, M, M/DAY, DAYS, HOURS
    unit_name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    is_standard_si BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unit_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    to_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    factor NUMERIC(18, 8) NOT NULL CHECK (factor > 0),
    offset_value NUMERIC(18, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_unit_conversion_pair UNIQUE (from_unit_id, to_unit_id)
);

-- ============================================================================
-- 3. ORGANIZATIONS / MULTI-TENANCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_code VARCHAR(50) UNIQUE NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    organization_type VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE', -- ENTERPRISE, SUBSIDIARY, PLANT, PORT_OFFICE, CHARTERER
    industry VARCHAR(100) NOT NULL DEFAULT 'Steel & Maritime Logistics',
    country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
    default_currency_id UUID REFERENCES currencies(id) ON DELETE SET NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_org_settings_key UNIQUE (organization_id, setting_key)
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_code VARCHAR(50) NOT NULL,
    department_name VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_org_dept_code UNIQUE (organization_id, department_code)
);

-- ============================================================================
-- 4. USERS & ENTERPRISE AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED, LOCKED, PENDING_VERIFICATION
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    locale VARCHAR(20) NOT NULL DEFAULT 'en-IN',
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_org_user_employee_code UNIQUE (organization_id, employee_code)
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);

CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL, -- Argon2id hash
    password_salt VARCHAR(100),
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    is_mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    password_history JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON user_sessions(user_id, is_active);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by_token_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    is_successful BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email, created_at);

-- ============================================================================
-- 5. RBAC (EXACTLY SIX PRIMARY ROLES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_six_system_roles CHECK (
        role_name IN (
            'SUPER_ADMIN',
            'ADMIN',
            'CHARTERING_MANAGER',
            'PROCUREMENT_MANAGER',
            'PORT_MANAGER',
            'ANALYST'
        )
    )
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(100) UNIQUE NOT NULL, -- <domain>.<action>
    domain VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_permissions_domain ON permissions(domain);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_user_role_org UNIQUE (user_id, role_id, organization_id)
);

CREATE TABLE IF NOT EXISTS role_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    child_role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    hierarchy_depth INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_hierarchy UNIQUE (parent_role_id, child_role_id)
);

-- ============================================================================
-- 6. PORT MASTER, INFRASTRUCTURE & CONSTRAINT ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_name VARCHAR(150) NOT NULL,
    official_name VARCHAR(200) NOT NULL,
    un_locode VARCHAR(5) UNIQUE NOT NULL, -- INPRT, INVTZ, INGAV, etc.
    country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
    state VARCHAR(100),
    city VARCHAR(100),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    location_geog GEOGRAPHY(POINT, 4326),
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    port_type VARCHAR(50) NOT NULL DEFAULT 'MAJOR_SEA_PORT',
    is_east_coast_india BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL',
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    data_source_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ports_locode ON ports(un_locode);
CREATE INDEX IF NOT EXISTS idx_ports_east_coast ON ports(is_east_coast_india);
CREATE INDEX IF NOT EXISTS idx_ports_location_geog ON ports USING GIST(location_geog);

CREATE TABLE IF NOT EXISTS port_terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    terminal_code VARCHAR(50) NOT NULL,
    terminal_name VARCHAR(150) NOT NULL,
    terminal_type VARCHAR(50) NOT NULL, -- DRY_BULK, COAL_TERMINAL, IRON_ORE_BERTH
    operator VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_port_terminal_code UNIQUE (port_id, terminal_code)
);

CREATE TABLE IF NOT EXISTS port_berths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID NOT NULL REFERENCES port_terminals(id) ON DELETE CASCADE,
    berth_code VARCHAR(50) NOT NULL,
    berth_name VARCHAR(150) NOT NULL,
    berth_length_m NUMERIC(8, 2) NOT NULL CHECK (berth_length_m > 0),
    design_draft_m NUMERIC(6, 2) NOT NULL CHECK (design_draft_m > 0),
    max_dwt_mt NUMERIC(12, 2) NOT NULL CHECK (max_dwt_mt > 0),
    location_geog GEOGRAPHY(POINT, 4326),
    status VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uq_terminal_berth_code UNIQUE (terminal_id, berth_code)
);

CREATE TABLE IF NOT EXISTS port_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    channel_name VARCHAR(150) NOT NULL,
    min_depth_m NUMERIC(6, 2) NOT NULL,
    width_m NUMERIC(8, 2) NOT NULL,
    length_nm NUMERIC(8, 2) NOT NULL,
    is_tidal_dependent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS port_constraints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    terminal_id UUID REFERENCES port_terminals(id) ON DELETE CASCADE,
    berth_id UUID REFERENCES port_berths(id) ON DELETE CASCADE,
    constraint_name VARCHAR(150) NOT NULL,
    constraint_type VARCHAR(50) NOT NULL, -- DRAFT, LOA, BEAM, AIR_DRAFT, DWT
    max_loa_m NUMERIC(8, 2) CHECK (max_loa_m IS NULL OR max_loa_m > 0),
    min_loa_m NUMERIC(8, 2) CHECK (min_loa_m IS NULL OR min_loa_m > 0),
    max_beam_m NUMERIC(8, 2) CHECK (max_beam_m IS NULL OR max_beam_m > 0),
    max_draft_m NUMERIC(6, 2) CHECK (max_draft_m IS NULL OR max_draft_m > 0),
    min_draft_m NUMERIC(6, 2) CHECK (min_draft_m IS NULL OR min_draft_m >= 0),
    channel_draft_m NUMERIC(6, 2),
    berth_draft_m NUMERIC(6, 2),
    max_air_draft_m NUMERIC(6, 2),
    max_dwt_mt NUMERIC(12, 2) CHECK (max_dwt_mt IS NULL OR max_dwt_mt > 0),
    max_gt_mt NUMERIC(12, 2) CHECK (max_gt_mt IS NULL OR max_gt_mt > 0),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_port_constraint_validity CHECK (valid_to IS NULL OR valid_to > valid_from)
);
CREATE INDEX IF NOT EXISTS idx_port_constraints_lookup ON port_constraints(port_id, constraint_type, is_active);

-- ============================================================================
-- 7. VESSEL MASTER
-- ============================================================================

CREATE TABLE IF NOT EXISTS vessel_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_code VARCHAR(30) UNIQUE NOT NULL, -- HANDYSIZE, SUPRAMAX, ULTRAMAX, PANAMAX, KAMSARMAX, POST_PANAMAX, CAPESIZE, NEWCASTLEMAX, MINI_CAPE
    class_name VARCHAR(100) NOT NULL,
    min_dwt_mt NUMERIC(12, 2) NOT NULL CHECK (min_dwt_mt > 0),
    max_dwt_mt NUMERIC(12, 2) NOT NULL CHECK (max_dwt_mt >= min_dwt_mt),
    typical_beam_m NUMERIC(6, 2),
    typical_loa_m NUMERIC(8, 2),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vessels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imo_number VARCHAR(10) UNIQUE NOT NULL, -- 7 digits
    mmsi VARCHAR(15) UNIQUE,
    call_sign VARCHAR(20),
    vessel_name VARCHAR(150) NOT NULL,
    vessel_class_id UUID NOT NULL REFERENCES vessel_classes(id) ON DELETE RESTRICT,
    vessel_type VARCHAR(50) NOT NULL DEFAULT 'DRY_BULK_CARRIER',
    build_year INT NOT NULL CHECK (build_year BETWEEN 1950 AND 2100),
    flag_country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
    dwt_mt NUMERIC(12, 2) NOT NULL CHECK (dwt_mt > 0),
    gross_tonnage NUMERIC(12, 2) NOT NULL CHECK (gross_tonnage > 0),
    net_tonnage NUMERIC(12, 2) NOT NULL CHECK (net_tonnage > 0),
    loa_m NUMERIC(8, 2) NOT NULL CHECK (loa_m > 0),
    beam_m NUMERIC(6, 2) NOT NULL CHECK (beam_m > 0),
    summer_draft_m NUMERIC(6, 2) NOT NULL CHECK (summer_draft_m > 0),
    grain_capacity_cbm NUMERIC(12, 2),
    bale_capacity_cbm NUMERIC(12, 2),
    design_speed_knots NUMERIC(5, 2) NOT NULL DEFAULT 13.5,
    ballast_speed_knots NUMERIC(5, 2) NOT NULL DEFAULT 14.0,
    laden_speed_knots NUMERIC(5, 2) NOT NULL DEFAULT 12.5,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ON_VOYAGE, IN_BALLAST, DRY_DOCK, DECOMMISSIONED
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    data_source_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_vessels_imo ON vessels(imo_number);
CREATE INDEX IF NOT EXISTS idx_vessels_class ON vessels(vessel_class_id);
CREATE INDEX IF NOT EXISTS idx_vessels_status ON vessels(status);

CREATE TABLE IF NOT EXISTS vessel_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    position_geog GEOGRAPHY(POINT, 4326),
    speed_knots NUMERIC(5, 2),
    heading_deg NUMERIC(5, 2),
    nav_status VARCHAR(50) DEFAULT 'UNDERWAY_USING_ENGINE',
    destination_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,
    eta TIMESTAMPTZ,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vessel_positions_time ON vessel_positions(vessel_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vessel_positions_geog ON vessel_positions USING GIST(position_geog);

-- ============================================================================
-- 8. CARGO MASTER & PARCELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS cargo_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_code VARCHAR(50) UNIQUE NOT NULL, -- DRY_BULK, BREAK_BULK, RAW_MATERIAL
    category_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cargo_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES cargo_categories(id) ON DELETE RESTRICT,
    cargo_code VARCHAR(50) UNIQUE NOT NULL, -- COAL, STEAM_COAL, COKING_COAL, IRON_ORE, IRON_ORE_FINED, IRON_ORE_LUMP, LIMESTONE, PETCOKE, COKE, BAUXITE, etc.
    cargo_name VARCHAR(100) NOT NULL,
    stowage_factor_cbm_mt NUMERIC(6, 3),
    angle_of_repose_deg NUMERIC(5, 2),
    is_hazardous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cargo_types_code ON cargo_types(cargo_code);

CREATE TABLE IF NOT EXISTS cargo_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cargo_type_id UUID NOT NULL REFERENCES cargo_types(id) ON DELETE CASCADE,
    grade_code VARCHAR(50) NOT NULL,
    grade_name VARCHAR(100) NOT NULL,
    ash_content_pct NUMERIC(5, 2),
    moisture_pct NUMERIC(5, 2),
    volatile_matter_pct NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cargo_grade_code UNIQUE (cargo_type_id, grade_code)
);

CREATE TABLE IF NOT EXISTS commodities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cargo_type_id UUID REFERENCES cargo_types(id) ON DELETE SET NULL,
    commodity_code VARCHAR(50) UNIQUE NOT NULL,
    commodity_name VARCHAR(150) NOT NULL,
    cargo_category VARCHAR(50) NOT NULL DEFAULT 'Dry Bulk',
    hs_code VARCHAR(20),
    icon VARCHAR(10) DEFAULT '📦',
    description TEXT,
    origin_regions TEXT,
    benchmark_price_usd_mt NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    benchmark_price_inr_mt NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    price_change_24h_pct NUMERIC(5, 2) DEFAULT 0.00,
    price_trend VARCHAR(10) DEFAULT 'STABLE', -- UP, DOWN, STABLE
    index_source VARCHAR(120),
    moisture_limit_percent NUMERIC(5, 2),
    bulk_density_kg_m3 NUMERIC(8, 2),
    stowage_factor NUMERIC(6, 3),
    typical_parcel_mt NUMERIC(12, 2),
    hazmat_un_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_commodities_code ON commodities(commodity_code);
CREATE INDEX IF NOT EXISTS idx_commodities_name ON commodities(commodity_name);

CREATE TABLE IF NOT EXISTS cargo_parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    parcel_code VARCHAR(100) UNIQUE NOT NULL,
    cargo_type_id UUID NOT NULL REFERENCES cargo_types(id) ON DELETE RESTRICT,
    cargo_grade_id UUID REFERENCES cargo_grades(id) ON DELETE SET NULL,
    quantity_mt NUMERIC(14, 2) NOT NULL CHECK (quantity_mt > 0),
    origin_port_id UUID NOT NULL REFERENCES ports(id) ON DELETE RESTRICT,
    destination_port_id UUID NOT NULL REFERENCES ports(id) ON DELETE RESTRICT,
    laycan_start TIMESTAMPTZ NOT NULL,
    laycan_end TIMESTAMPTZ NOT NULL,
    required_arrival_date TIMESTAMPTZ,
    priority VARCHAR(30) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED', -- PLANNED, COMMITTED, NOMINATED, LOADING, IN_TRANSIT, DISCHARGED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_laycan_window CHECK (laycan_end >= laycan_start)
);
CREATE INDEX IF NOT EXISTS idx_parcels_org ON cargo_parcels(organization_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON cargo_parcels(status);

-- ============================================================================
-- 9. FREIGHT MASTER & CONFIGURABLE FREIGHT CODE ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS freight_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_code VARCHAR(50) UNIQUE NOT NULL, -- SPOT_FREIGHT, VOYAGE_CHARTER, TIME_CHARTER, SHORT_TERM_CHARTER, MEDIUM_TERM_CHARTER, LONG_TERM_CHARTER, COA, MULTI_VOYAGE, INDEX_LINKED, FIXED_RATE, FORMULA_BASED
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS freight_rate_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_type_code VARCHAR(50) UNIQUE NOT NULL, -- USD_PER_MT, USD_PER_DAY, LUMP_SUM, WORLD_SCALE, INDEX_DIFFERENTIAL, FIXED_PLUS_INDEX, FORMULA, PERCENTAGE
    rate_type_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS freight_code_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL,
    code_template VARCHAR(255) NOT NULL, -- e.g. FRT-{ORIGIN}-{DEST}-{VESSEL}-{CARGO}
    separator VARCHAR(5) NOT NULL DEFAULT '-',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS freight_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g. FRT-AUS-IND-EAST-PMX-COAL
    origin_country_id UUID REFERENCES countries(id) ON DELETE RESTRICT,
    origin_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,
    destination_country_id UUID REFERENCES countries(id) ON DELETE RESTRICT,
    destination_port_id UUID REFERENCES ports(id) ON DELETE SET NULL,
    vessel_class_id UUID NOT NULL REFERENCES vessel_classes(id) ON DELETE RESTRICT,
    cargo_type_id UUID NOT NULL REFERENCES cargo_types(id) ON DELETE RESTRICT,
    freight_type_id UUID NOT NULL REFERENCES freight_types(id) ON DELETE RESTRICT,
    rate_type_id UUID NOT NULL REFERENCES freight_rate_types(id) ON DELETE RESTRICT,
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_freight_codes_code ON freight_codes(code);

CREATE TABLE IF NOT EXISTS freight_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freight_code_id UUID NOT NULL REFERENCES freight_codes(id) ON DELETE CASCADE,
    rate NUMERIC(16, 4) NOT NULL CHECK (rate >= 0), -- Strict financial precision, never FLOAT
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    observation_date TIMESTAMPTZ NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ,
    source VARCHAR(100) NOT NULL DEFAULT 'BALTIC_EXCHANGE',
    confidence NUMERIC(5, 4) NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
    data_quality_score NUMERIC(5, 2) NOT NULL DEFAULT 95.0,
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    data_source_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_freight_rate_effective_window CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE INDEX IF NOT EXISTS idx_freight_rates_lookup ON freight_rates(freight_code_id, observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_freight_rates_synthetic ON freight_rates(is_synthetic);

-- ============================================================================
-- 10. TRADE LANES & ROUTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS trade_lanes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lane_code VARCHAR(50) UNIQUE NOT NULL, -- AUS-IND-EAST, USA-IND-EAST, MOZ-IND-EAST, RUS-IND-EAST, IDN-IND-EAST
    lane_name VARCHAR(150) NOT NULL,
    origin_region VARCHAR(100) NOT NULL,
    destination_region VARCHAR(100) NOT NULL DEFAULT 'East Coast India',
    typical_cargo_type_id UUID REFERENCES cargo_types(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_lane_id UUID NOT NULL REFERENCES trade_lanes(id) ON DELETE RESTRICT,
    route_code VARCHAR(100) UNIQUE NOT NULL,
    origin_port_id UUID NOT NULL REFERENCES ports(id) ON DELETE RESTRICT,
    destination_port_id UUID NOT NULL REFERENCES ports(id) ON DELETE RESTRICT,
    distance_nm NUMERIC(10, 2) NOT NULL CHECK (distance_nm > 0),
    estimated_sailing_days NUMERIC(6, 2) NOT NULL CHECK (estimated_sailing_days > 0),
    corridor_geom GEOMETRY(LINESTRING, 4326),
    has_canal_transit BOOLEAN NOT NULL DEFAULT FALSE,
    canal_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_routes_ports ON routes(origin_port_id, destination_port_id);

-- ============================================================================
-- 11. CHARTERING & CONTRACTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS charter_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    request_number VARCHAR(100) UNIQUE NOT NULL,
    cargo_parcel_id UUID REFERENCES cargo_parcels(id) ON DELETE SET NULL,
    vessel_class_id UUID NOT NULL REFERENCES vessel_classes(id) ON DELETE RESTRICT,
    charter_type VARCHAR(50) NOT NULL DEFAULT 'VOYAGE_CHARTER',
    laycan_start TIMESTAMPTZ NOT NULL,
    laycan_end TIMESTAMPTZ NOT NULL,
    target_freight_rate NUMERIC(16, 4),
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_NEGOTIATION, FIXTURE_APPROVED, CANCELLED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    contract_number VARCHAR(100) UNIQUE NOT NULL,
    contract_type VARCHAR(50) NOT NULL, -- COA, TIME_CHARTER, VOYAGE_CHARTER, SPOT_FIXTURE
    supplier_charterer_name VARCHAR(200) NOT NULL,
    freight_code_id UUID REFERENCES freight_codes(id) ON DELETE RESTRICT,
    total_committed_volume_mt NUMERIC(14, 2) CHECK (total_committed_volume_mt IS NULL OR total_committed_volume_mt > 0),
    agreed_rate NUMERIC(16, 4) NOT NULL CHECK (agreed_rate >= 0),
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    effective_from TIMESTAMPTZ NOT NULL,
    effective_to TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PENDING_APPROVAL, ACTIVE, COMPLETED, TERMINATED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_contract_effective_window CHECK (effective_to > effective_from)
);
CREATE INDEX IF NOT EXISTS idx_contracts_org_status ON contracts(organization_id, status);

-- ============================================================================
-- 12. VOYAGE MANAGEMENT & PERFORMANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS voyages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    voyage_number VARCHAR(100) UNIQUE NOT NULL,
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE RESTRICT,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    cargo_parcel_id UUID REFERENCES cargo_parcels(id) ON DELETE SET NULL,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    planned_departure TIMESTAMPTZ NOT NULL,
    actual_departure TIMESTAMPTZ,
    planned_arrival TIMESTAMPTZ NOT NULL,
    actual_arrival TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED', -- PLANNED, NOMINATED, FIXED, LOADING, IN_TRANSIT, DISCHARGING, COMPLETED, CANCELLED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_voyages_vessel ON voyages(vessel_id, status);

CREATE TABLE IF NOT EXISTS voyage_economics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voyage_id UUID UNIQUE NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
    freight_revenue_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    bunker_cost_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    port_disbursement_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    canal_dues_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    idle_time_cost_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    demurrage_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    despatch_usd NUMERIC(16, 2) NOT NULL DEFAULT 0,
    total_cost_usd NUMERIC(16, 2) NOT NULL,
    net_profit_or_savings_usd NUMERIC(16, 2) NOT NULL,
    tce_usd_per_day NUMERIC(14, 2) NOT NULL, -- Time Charter Equivalent rate $/day
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 13. PROCUREMENT PIPELINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS procurement_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    requirement_code VARCHAR(100) UNIQUE NOT NULL,
    cargo_type_id UUID NOT NULL REFERENCES cargo_types(id) ON DELETE RESTRICT,
    cargo_grade_id UUID REFERENCES cargo_grades(id) ON DELETE SET NULL,
    required_volume_mt NUMERIC(14, 2) NOT NULL CHECK (required_volume_mt > 0),
    destination_port_id UUID NOT NULL REFERENCES ports(id) ON DELETE RESTRICT,
    delivery_window_start TIMESTAMPTZ NOT NULL,
    delivery_window_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, ANALYZED, VESSEL_RECOMMENDED, STRATEGY_APPROVED, CONTRACTED, FULFILLED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 14. MARKET DATA, COMMODITIES, BUNKER & ECONOMIC
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(100) UNIQUE NOT NULL, -- BALTIC_EXCHANGE, S&P_PLATTS, CLARKSONS, SHIPFIX, RBI, MANUAL
    source_category VARCHAR(50) NOT NULL, -- FREIGHT, BUNKER, COMMODITY, ECONOMIC
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bunker_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    fuel_grade VARCHAR(50) NOT NULL, -- VLSFO_0_5, MGO, IFO_380, LNG
    price_per_mt NUMERIC(14, 2) NOT NULL CHECK (price_per_mt > 0),
    currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE RESTRICT,
    price_date TIMESTAMPTZ NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'BUNKER_INDEX',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bunker_price_port_fuel_date UNIQUE (port_id, fuel_grade, price_date)
);

-- ============================================================================
-- 15. PORT CONGESTION & WEATHER
-- ============================================================================

CREATE TABLE IF NOT EXISTS congestion_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    terminal_id UUID REFERENCES port_terminals(id) ON DELETE SET NULL,
    observation_time TIMESTAMPTZ NOT NULL,
    waiting_vessels_count INT NOT NULL DEFAULT 0,
    anchorage_waiting_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
    berth_waiting_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
    turnaround_time_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
    severity VARCHAR(30) NOT NULL DEFAULT 'LOW', -- LOW, MODERATE, SEVERE, CRITICAL
    is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_congestion_port_time ON congestion_observations(port_id, observation_time DESC);

-- ============================================================================
-- 16. FREIGHT FORECASTING & ML GOVERNANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) UNIQUE NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- XGBOOST, LSTM, PROPHET, HYBRID_ENSEMBLE
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ml_model_id UUID NOT NULL REFERENCES ml_models(id) ON DELETE CASCADE,
    version_tag VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CANDIDATE', -- CANDIDATE, STAGING, PRODUCTION, RETIRED
    training_metrics JSONB,
    artifact_uri VARCHAR(500),
    deployed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_model_version_tag UNIQUE (ml_model_id, version_tag)
);

CREATE TABLE IF NOT EXISTS forecast_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id UUID NOT NULL REFERENCES ml_model_versions(id) ON DELETE RESTRICT,
    freight_code_id UUID NOT NULL REFERENCES freight_codes(id) ON DELETE CASCADE,
    run_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    horizon_days INT NOT NULL CHECK (horizon_days IN (7, 14, 30, 60, 90, 180)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forecast_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_run_id UUID NOT NULL REFERENCES forecast_runs(id) ON DELETE CASCADE,
    forecast_date TIMESTAMPTZ NOT NULL,
    predicted_rate NUMERIC(16, 4) NOT NULL CHECK (predicted_rate >= 0),
    lower_bound NUMERIC(16, 4) NOT NULL CHECK (lower_bound >= 0),
    upper_bound NUMERIC(16, 4) NOT NULL CHECK (upper_bound >= lower_bound),
    confidence NUMERIC(5, 4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    trend VARCHAR(30) NOT NULL DEFAULT 'STABLE', -- RISING, FALLING, VOLATILE, STABLE
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_forecast_bounds CHECK (upper_bound >= lower_bound)
);
CREATE INDEX IF NOT EXISTS idx_forecast_predictions_date ON forecast_predictions(forecast_date);

-- ============================================================================
-- 17. DECISION INTELLIGENCE: FEASIBILITY, OPTIMIZATION & RECOMMENDATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS vessel_feasibility_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID NOT NULL REFERENCES vessels(id) ON DELETE CASCADE,
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    berth_id UUID REFERENCES port_berths(id) ON DELETE SET NULL,
    cargo_parcel_id UUID REFERENCES cargo_parcels(id) ON DELETE SET NULL,
    is_feasible BOOLEAN NOT NULL,
    draft_compatible BOOLEAN NOT NULL,
    loa_compatible BOOLEAN NOT NULL,
    beam_compatible BOOLEAN NOT NULL,
    dwt_compatible BOOLEAN NOT NULL,
    rejection_reason TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_feasibility_vessel_port ON vessel_feasibility_checks(vessel_id, port_id);

CREATE TABLE IF NOT EXISTS market_entry_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freight_code_id UUID NOT NULL REFERENCES freight_codes(id) ON DELETE CASCADE,
    recommendation VARCHAR(30) NOT NULL, -- ENTER_NOW, ENTER_PARTIALLY, WAIT, MONITOR
    current_rate NUMERIC(16, 4) NOT NULL,
    expected_future_rate NUMERIC(16, 4) NOT NULL,
    expected_savings_pct NUMERIC(6, 2) NOT NULL,
    risk_score NUMERIC(5, 2) NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    confidence NUMERIC(5, 4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    validity_start TIMESTAMPTZ NOT NULL,
    validity_end TIMESTAMPTZ NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    recommendation_type VARCHAR(50) NOT NULL, -- CHARTER_STRATEGY, PROCUREMENT_ENTRY, VESSEL_SELECTION, ROUTE_CHOICE
    subject_entity_type VARCHAR(50) NOT NULL, -- PROCUREMENT_REQUIREMENT, CARGO_PARCEL, CHARTER_REQUEST
    subject_entity_id UUID NOT NULL,
    decision VARCHAR(100) NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    risk_level VARCHAR(30) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, EXTREME
    expected_financial_impact_usd NUMERIC(16, 2),
    model_version_id UUID REFERENCES ml_model_versions(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    valid_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_recommendations_org ON recommendations(organization_id, is_active);

-- ============================================================================
-- 18. SCENARIOS & RISKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    scenario_code VARCHAR(50) NOT NULL,
    scenario_name VARCHAR(150) NOT NULL,
    scenario_type VARCHAR(50) NOT NULL, -- BASE_CASE, BULL_FREIGHT, BEAR_FREIGHT, HIGH_CONGESTION, PORT_CLOSURE, FUEL_SPIKE, DEMAND_SURGE, CUSTOM
    assumptions JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    risk_category VARCHAR(50) NOT NULL, -- FREIGHT, PORT, VESSEL, WEATHER, COMMODITY, GEOPOLITICAL, OPERATIONAL
    risk_title VARCHAR(200) NOT NULL,
    probability NUMERIC(5, 4) NOT NULL CHECK (probability BETWEEN 0 AND 1),
    impact NUMERIC(5, 4) NOT NULL CHECK (impact BETWEEN 0 AND 1),
    severity VARCHAR(30) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    financial_exposure_usd NUMERIC(16, 2),
    mitigation_strategy TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 19. ALERTS & NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    rule_name VARCHAR(150) NOT NULL,
    alert_category VARCHAR(50) NOT NULL, -- FREIGHT_SPIKE, CONGESTION, WEATHER, RISK
    condition_expression JSONB NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(organization_id, status);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    channel VARCHAR(30) NOT NULL DEFAULT 'IN_APP', -- IN_APP, EMAIL, SMS, WEBHOOK
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, is_read);

-- ============================================================================
-- 20. AUDIT LOGGING & APPROVAL WORKFLOWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, APPROVE, DEPLOY
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workflow_type VARCHAR(50) NOT NULL, -- CHARTER_APPROVAL, CONTRACT_APPROVAL, PROCUREMENT_APPROVAL, MODEL_DEPLOY_APPROVAL
    subject_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    comments TEXT,
    action_taken_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 21. DATABASE VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_active_freight_rates AS
SELECT 
    fr.id AS freight_rate_id,
    fc.code AS freight_code,
    c_orig.name AS origin_country,
    p_orig.port_name AS origin_port,
    c_dest.name AS destination_country,
    p_dest.port_name AS destination_port,
    vc.class_name AS vessel_class,
    ct.cargo_name AS cargo_type,
    ft.type_name AS freight_type,
    fr.rate,
    curr.code AS currency,
    u.unit_code AS unit,
    fr.observation_date,
    fr.source,
    fr.is_synthetic
FROM freight_rates fr
JOIN freight_codes fc ON fr.freight_code_id = fc.id
LEFT JOIN countries c_orig ON fc.origin_country_id = c_orig.id
LEFT JOIN ports p_orig ON fc.origin_port_id = p_orig.id
LEFT JOIN countries c_dest ON fc.destination_country_id = c_dest.id
LEFT JOIN ports p_dest ON fc.destination_port_id = p_dest.id
JOIN vessel_classes vc ON fc.vessel_class_id = vc.id
JOIN cargo_types ct ON fc.cargo_type_id = ct.id
JOIN freight_types ft ON fc.freight_type_id = ft.id
JOIN currencies curr ON fr.currency_id = curr.id
JOIN units u ON fr.unit_id = u.id
WHERE fr.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_east_coast_port_constraints AS
SELECT 
    p.port_name,
    p.un_locode,
    pt.terminal_name,
    pb.berth_name,
    pb.berth_length_m,
    pb.design_draft_m,
    pb.max_dwt_mt,
    pc.max_loa_m,
    pc.max_beam_m,
    pc.valid_from,
    pc.valid_to
FROM ports p
JOIN port_terminals pt ON p.id = pt.port_id
JOIN port_berths pb ON pt.id = pb.terminal_id
LEFT JOIN port_constraints pc ON p.id = pc.port_id
WHERE p.is_east_coast_india = TRUE AND p.deleted_at IS NULL;

-- ============================================================================
-- 22. POSTGRESQL COMMENTS FOR MAINTAINABILITY & DATA GOVERNANCE
-- ============================================================================

COMMENT ON TABLE ports IS 'Maritime port master including PostGIS coordinates, UN/LOCODE, and East Coast India hub classification for SAIL imports';
COMMENT ON COLUMN ports.is_east_coast_india IS 'Identifies strategic SAIL import ports: Paradip, Vizag, Gangavaram, Dhamra, Haldia, Gopalpur, Sagar';
COMMENT ON TABLE freight_codes IS 'Configurable structured maritime freight code resolving origin, destination, vessel class, cargo type, and contract terms';
COMMENT ON TABLE freight_rates IS 'Financial historical freight observations using strict NUMERIC precision';
COMMENT ON TABLE roles IS 'Strictly enforced 6 system roles for SAIL MARINEX enterprise platform';
COMMENT ON TABLE vessel_feasibility_checks IS 'Engine results evaluating vessel draft, LOA, beam, and DWT limits against port constraints';

-- ============================================================================
-- 23. ML FEATURE STORE, BACKTESTING & MODEL GOVERNANCE
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ml_model_versions') THEN
        ALTER TABLE ml_model_versions ADD COLUMN IF NOT EXISTS model_artifact_path VARCHAR(500);
        ALTER TABLE ml_model_versions ADD COLUMN IF NOT EXISTS training_data_hash VARCHAR(64);
        ALTER TABLE ml_model_versions ADD COLUMN IF NOT EXISTS feature_names JSONB;
        ALTER TABLE ml_model_versions ADD COLUMN IF NOT EXISTS shap_values_sample JSONB;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS ml_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freight_code_id UUID REFERENCES freight_codes(id) ON DELETE CASCADE,
    feature_date DATE NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_value DOUBLE PRECISION NOT NULL,
    source VARCHAR(50) DEFAULT 'synthetic',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(freight_code_id, feature_date, feature_name)
);
CREATE INDEX IF NOT EXISTS idx_ml_features_lookup ON ml_features(freight_code_id, feature_date);
CREATE INDEX IF NOT EXISTS idx_ml_features_name ON ml_features(feature_name, feature_date);

CREATE TABLE IF NOT EXISTS ml_backtests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version_id UUID REFERENCES ml_model_versions(id) ON DELETE SET NULL,
    freight_code_id UUID REFERENCES freight_codes(id) ON DELETE CASCADE,
    backtest_start DATE NOT NULL,
    backtest_end DATE NOT NULL,
    mae DOUBLE PRECISION,
    rmse DOUBLE PRECISION,
    mape DOUBLE PRECISION,
    directional_accuracy DOUBLE PRECISION,
    predictions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ml_backtests_freight ON ml_backtests(freight_code_id, created_at DESC);

COMMENT ON TABLE ml_features IS 'Historical multi-source feature store for maritime freight rate forecasting';
COMMENT ON TABLE ml_backtests IS 'Walk-forward backtest evaluation results for ML models across freight codes';

