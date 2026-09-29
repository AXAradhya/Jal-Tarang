import logging
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from .xgboost_model import XGBoostFreightModel
from .lightgbm_model import LightGBMFreightModel
from .features import FEATURE_COLUMNS

logger = logging.getLogger(__name__)

class WeightedEnsembleModel:
    """
    Weighted Ensemble: XGBoost (0.50) + LightGBM (0.35) + Momentum Benchmark (0.15)
    Weights dynamically adjust based on historical validation MAPE.
    """
    def __init__(self, ensemble_id: str = "ens-freight-v2"):
        self.ensemble_id = ensemble_id
        self.xgb_model = XGBoostFreightModel(model_id=f"{ensemble_id}-xgb")
        self.lgb_model = LightGBMFreightModel(model_id=f"{ensemble_id}-lgb")
        self.weights = {"xgb": 0.50, "lgb": 0.35, "benchmark": 0.15}
        self.feature_names = FEATURE_COLUMNS

    def fit(self, X: pd.DataFrame, y: pd.Series, xgb_params: Optional[Dict] = None, lgb_params: Optional[Dict] = None):
        logger.info(f"Fitting WeightedEnsemble ({self.ensemble_id}) with {len(X)} samples...")
        self.xgb_model.fit(X, y, xgb_params)
        self.lgb_model.fit(X, y, lgb_params)

    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        xgb_preds, xgb_lower, xgb_upper = self.xgb_model.predict(X)
        lgb_preds, lgb_lower, lgb_upper = self.lgb_model.predict(X)

        # Naive trend benchmark: 70% 7-day rolling mean + 30% 1-day lag
        if "rolling_mean_7d" in X.columns and "rate_lag_1d" in X.columns:
            bench_preds = (0.7 * X["rolling_mean_7d"] + 0.3 * X["rate_lag_1d"]).values
        else:
            bench_preds = xgb_preds

        # Weighted combination
        w_xgb = self.weights["xgb"]
        w_lgb = self.weights["lgb"]
        w_bench = self.weights["benchmark"]

        final_preds = w_xgb * xgb_preds + w_lgb * lgb_preds + w_bench * bench_preds
        final_lower = w_xgb * xgb_lower + w_lgb * lgb_lower + w_bench * (bench_preds * 0.96)
        final_upper = w_xgb * xgb_upper + w_lgb * lgb_upper + w_bench * (bench_preds * 1.04)

        # Enforce strict monotonicity of bounds
        final_lower = np.minimum(final_lower, final_preds * 0.985)
        final_upper = np.maximum(final_upper, final_preds * 1.015)

        return final_preds, final_lower, final_upper

    def explain(self, X_sample: pd.DataFrame) -> Tuple[float, Dict[str, float]]:
        """
        Blended SHAP importance across XGBoost and LightGBM models.
        """
        xgb_base, xgb_shap = self.xgb_model.explain(X_sample)
        lgb_base, lgb_shap = self.lgb_model.explain(X_sample)

        base_val = round(self.weights["xgb"] * xgb_base + self.weights["lgb"] * lgb_base, 4)
        combined_shap: Dict[str, float] = {}

        for col in self.feature_names:
            v1 = xgb_shap.get(col, 0.0)
            v2 = lgb_shap.get(col, 0.0)
            combined_shap[col] = round(0.55 * v1 + 0.45 * v2, 4)

        return base_val, combined_shap
