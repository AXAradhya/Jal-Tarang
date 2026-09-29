import logging
import pickle
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
import lightgbm as lgb
import shap
from .features import FEATURE_COLUMNS

logger = logging.getLogger(__name__)

class LightGBMFreightModel:
    def __init__(self, model_id: str = "lgb-c3tc-prod"):
        self.model_id = model_id
        self.feature_names = FEATURE_COLUMNS
        self.model: Optional[lgb.LGBMRegressor] = None
        self.model_lower: Optional[lgb.LGBMRegressor] = None
        self.model_upper: Optional[lgb.LGBMRegressor] = None
        self.explainer: Optional[shap.TreeExplainer] = None
        self.best_params: Dict[str, Any] = {}

    def fit(self, X: pd.DataFrame, y: pd.Series, params: Optional[Dict[str, Any]] = None):
        default_params = {
            "n_estimators": 100,
            "num_leaves": 31,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "verbose": -1,
        }
        if params:
            default_params.update(params)
        self.best_params = default_params

        X_aligned = X[self.feature_names].copy()

        # 1. Main model
        self.model = lgb.LGBMRegressor(objective="regression", **default_params)
        self.model.fit(X_aligned, y)

        # 2. Lower bound
        lower_params = {k: v for k, v in default_params.items() if k != "random_state"}
        self.model_lower = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.10,
            **lower_params,
            random_state=43
        )
        self.model_lower.fit(X_aligned, y)

        # 3. Upper bound
        self.model_upper = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.90,
            **lower_params,
            random_state=44
        )
        self.model_upper.fit(X_aligned, y)

        # 4. SHAP Explainer
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            logger.warning(f"Failed to initialize LightGBM TreeExplainer: {e}")
            self.explainer = None

    def predict(self, X: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if self.model is None:
            raise ValueError("LightGBM model has not been fitted or loaded.")
        X_aligned = X[self.feature_names]
        preds = self.model.predict(X_aligned)
        lower = self.model_lower.predict(X_aligned) if self.model_lower else preds * 0.95
        upper = self.model_upper.predict(X_aligned) if self.model_upper else preds * 1.05
        lower = np.minimum(lower, preds * 0.98)
        upper = np.maximum(upper, preds * 1.02)
        return preds, lower, upper

    def explain(self, X_sample: pd.DataFrame) -> Tuple[float, Dict[str, float]]:
        if self.model is None:
            raise ValueError("Model is not initialized.")
        X_aligned = X_sample[self.feature_names]

        try:
            # Native C++ Tree SHAP in LightGBM: columns 0..N-1 are feature contributions, last column is bias
            contribs = self.model.booster_.predict(X_aligned, pred_contrib=True)[0]
            base_val = float(contribs[-1])
            feat_contribs = contribs[:-1]
            importance_dict = {
                col: round(float(val), 4) for col, val in zip(self.feature_names, feat_contribs)
            }
            return base_val, importance_dict
        except Exception as e:
            logger.warning(f"LightGBM native pred_contrib fallback: {e}")
            if self.explainer is None:
                self.explainer = shap.TreeExplainer(self.model)
            shap_vals = self.explainer(X_aligned)
            if hasattr(shap_vals, "values"):
                values = shap_vals.values[0]
                base_val = float(shap_vals.base_values[0])
            else:
                values = shap_vals[0]
                base_val = float(self.explainer.expected_value)

            importance_dict = {
                col: round(float(val), 4) for col, val in zip(self.feature_names, values)
            }
            return base_val, importance_dict


    def save(self, file_path: Path):
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "wb") as f:
            pickle.dump(
                {
                    "model_id": self.model_id,
                    "model": self.model,
                    "model_lower": self.model_lower,
                    "model_upper": self.model_upper,
                    "best_params": self.best_params,
                    "feature_names": self.feature_names,
                },
                f,
            )

    @classmethod
    def load(cls, file_path: Path) -> "LightGBMFreightModel":
        with open(file_path, "rb") as f:
            data = pickle.load(f)
        inst = cls(model_id=data["model_id"])
        inst.model = data["model"]
        inst.model_lower = data.get("model_lower")
        inst.model_upper = data.get("model_upper")
        inst.best_params = data.get("best_params", {})
        inst.feature_names = data.get("feature_names", FEATURE_COLUMNS)
        if inst.model:
            try:
                inst.explainer = shap.TreeExplainer(inst.model)
            except Exception:
                inst.explainer = None
        return inst
