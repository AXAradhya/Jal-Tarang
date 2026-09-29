-- ML Feature Store and Model Governance Tables Migration
-- Adds ml_features, ml_backtests, and updates ml_model_versions

-- 1. Extend ml_model_versions with artifact paths, data hashes, and explainability schemas
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ml_model_versions') THEN
        ALTER TABLE ml_model_versions ADD COLUMN IF NOT EXISTS model_artifact_path VARCHAR(500);
        ALTER TABLE ml_model_versions ADD COLUMN IF NOT EXISTS training_data_hash VARCHAR(64);
        ALTER TABLE ml_model_versions ADD COLUMN IF NOT EXISTS feature_names JSONB;
        ALTER TABLE ml_model_versions ADD COLUMN IF NOT EXISTS shap_values_sample JSONB;
    END IF;
END $$;

-- 2. Create ml_features table
CREATE TABLE IF NOT EXISTS ml_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freight_code_id UUID REFERENCES freight_codes(id) ON DELETE CASCADE,
    feature_date DATE NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    feature_value DOUBLE PRECISION NOT NULL,
    source VARCHAR(50) DEFAULT 'synthetic',  -- 'freight_rates', 'vessels', 'bunker', 'macro', 'weather'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(freight_code_id, feature_date, feature_name)
);

CREATE INDEX IF NOT EXISTS idx_ml_features_lookup ON ml_features(freight_code_id, feature_date);
CREATE INDEX IF NOT EXISTS idx_ml_features_name ON ml_features(feature_name, feature_date);

-- 3. Create ml_backtests table
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
    predictions JSONB,  -- array of {target_date, predicted, actual, error}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_backtests_freight ON ml_backtests(freight_code_id, created_at DESC);
