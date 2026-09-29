import logging
from typing import Dict, List, Optional
import httpx
import pandas as pd
from ..core.config import settings
from ..core.database import get_db_pool
from ..models.features import FEATURE_COLUMNS, generate_default_feature_vector

logger = logging.getLogger(__name__)

class FeatureStoreService:
    async def get_latest_features(self, freight_code_id: str) -> Dict[str, float]:
        """
        Retrieves the latest engineered feature vector for a freight code.
        Tries PostgreSQL -> Node.js Backend -> Synthetic maritime domain features.
        """
        # 1. Try PostgreSQL ml_features
        pool = await get_db_pool()
        if pool:
            try:
                async with pool.acquire() as conn:
                    rows = await conn.fetch(
                        """
                        SELECT feature_name, feature_value
                        FROM ml_features
                        WHERE freight_code_id = $1::uuid OR freight_code_id IN (
                            SELECT id FROM freight_codes WHERE code = $1
                        )
                        ORDER BY feature_date DESC
                        LIMIT 50
                        """,
                        freight_code_id,
                    )
                    if rows:
                        features = {r["feature_name"]: float(r["feature_value"]) for r in rows}
                        # If we have at least 5 features, fill remaining with defaults
                        if len(features) >= 5:
                            default_vec = generate_default_feature_vector(freight_code_id)
                            default_vec.update(features)
                            return default_vec
            except Exception as e:
                logger.warning(f"[FeatureStore] DB feature lookup failed: {e}")

        # 2. Try Node.js Backend internal features route
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(
                    f"{settings.NODE_BACKEND_URL}/internal/api/v1/features/{freight_code_id}?days=90"
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, dict) and "features" in data and isinstance(data["features"], dict):
                        raw_feat = data["features"]
                        # Validate that it has real numeric features
                        valid_keys = [k for k, v in raw_feat.items() if k in FEATURE_COLUMNS and isinstance(v, (int, float))]
                        if len(valid_keys) >= 5:
                            vec = generate_default_feature_vector(freight_code_id)
                            vec.update({k: float(raw_feat[k]) for k in valid_keys})
                            return vec
        except Exception:
            pass

        # 3. Use domain-authentic feature generator
        return generate_default_feature_vector(freight_code_id)

    async def get_historical_features(self, freight_code_id: str, days: int = 180) -> pd.DataFrame:
        """
        Returns a time series DataFrame of features for training/backtesting.
        """
        pool = await get_db_pool()
        if pool:
            try:
                async with pool.acquire() as conn:
                    rates = await conn.fetch(
                        """
                        SELECT observation_date AS date, rate
                        FROM freight_rates fr
                        JOIN freight_codes fc ON fr.freight_code_id = fc.id
                        WHERE fc.code = $1 OR fc.id = $1::uuid
                        ORDER BY observation_date ASC
                        LIMIT $2
                        """,
                        freight_code_id,
                        days,
                    )
                    if rates and len(rates) > 20:
                        df_raw = pd.DataFrame([{"date": r["date"], "rate": float(r["rate"])} for r in rates])
                        from ..models.features import engineer_features_from_history
                        return engineer_features_from_history(df_raw)
            except Exception as e:
                logger.warning(f"[FeatureStore] Historical DB rates fetch failed: {e}")

        # 2. Check real-market dataset: data/ml_historical_market.csv
        from pathlib import Path
        market_csv_path = Path("data") / "ml_historical_market.csv"
        if not market_csv_path.exists():
            market_csv_path = Path("..") / "data" / "ml_historical_market.csv"

        if market_csv_path.exists():
            try:
                df_market = pd.read_csv(market_csv_path)
                df_market["date"] = pd.to_datetime(df_market["date"])
                df_market = df_market.sort_values("date").tail(days)
                is_capesize = "c5" in freight_code_id.lower() or "c3" in freight_code_id.lower()
                rate_col = "c5tc_freight_rate_usd" if is_capesize else "baltic_dry_index"
                if rate_col in df_market.columns:
                    df_raw = pd.DataFrame({"date": df_market["date"], "rate": df_market[rate_col].astype(float)})
                    from ..models.features import engineer_features_from_history
                    return engineer_features_from_history(df_raw)
            except Exception as e:
                logger.warning(f"[FeatureStore] Market CSV fetch failed: {e}")

        # 3. Rich time-series fallback
        dates = pd.date_range(end=pd.Timestamp.now(), periods=days, freq="D")
        is_capesize = "c5" in freight_code_id.lower() or "c3" in freight_code_id.lower()
        base_rate = 11.85 if is_capesize else 14.20
        import numpy as np
        walk = base_rate + np.cumsum(np.random.normal(0.01, 0.12, days))
        df_raw = pd.DataFrame({"date": dates, "rate": np.clip(walk, 8.0, 35.0)})
        from ..models.features import engineer_features_from_history
        return engineer_features_from_history(df_raw)

feature_store = FeatureStoreService()
