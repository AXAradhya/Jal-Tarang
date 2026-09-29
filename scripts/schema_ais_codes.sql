-- ============================================================================
-- SAIL MARINEX - AIS VESSEL TYPE CODES & TELEMETRY INDEXING SCHEMA
-- Sources: U.S. Coast Guard, NOAA, BOEM, Marine Cadastre Project (2018)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ais_vessel_type_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_group VARCHAR(50) NOT NULL,            -- Cargo, Tanker, Tug Tow, Fishing, Passenger, Military, etc.
    vessel_type_code VARCHAR(30) NOT NULL,        -- '0', '20', '21', '70', '1001', etc.
    classification_name VARCHAR(150) NOT NULL,    -- Detailed classification or service description
    hazard_category VARCHAR(10),                  -- 'A', 'B', 'C', 'D' or NULL
    is_avis_service BOOLEAN NOT NULL DEFAULT FALSE,
    source VARCHAR(100) NOT NULL DEFAULT 'USCG_NOAA_BOEM_MARINE_CADASTRE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ais_code_class UNIQUE (vessel_type_code, classification_name)
);

CREATE INDEX IF NOT EXISTS idx_ais_codes_group ON ais_vessel_type_codes(vessel_group);
CREATE INDEX IF NOT EXISTS idx_ais_codes_code ON ais_vessel_type_codes(vessel_type_code);

-- Vessel Verification & Raw AIS Overwrite Protection
ALTER TABLE vessels ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Composite Telemetry Performance Indexing for Instant Position Queries
ALTER TABLE live_vessel_telemetry ADD COLUMN IF NOT EXISTS imo_number VARCHAR(10);
ALTER TABLE live_vessel_telemetry ADD COLUMN IF NOT EXISTS mmsi VARCHAR(15);

CREATE INDEX IF NOT EXISTS idx_telemetry_vessel_time ON live_vessel_telemetry(vessel_id, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_imo_time ON live_vessel_telemetry(imo_number, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_mmsi_time ON live_vessel_telemetry(mmsi, timestamp_utc DESC);
