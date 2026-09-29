import time
import uuid
import logging
from typing import Dict, Any, Tuple
import optuna
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from ..core.config import settings
from ..core.database import get_db_pool
from ..models.features import FEATURE_COLUMNS
from ..models.xgboost_model import XGBoostFreightModel
from ..models.lightgbm_model import LightGBMFreightModel
from ..models.ensemble import WeightedEnsembleModel
from ..models.registry import registry
from .feature_store import feature_store
from .backtest import backtest_service

logger = logging.getLogger(__name__)
optuna.logging.set_verbosity(optuna.logging.WARNING)

class ModelTrainerService:
    async def train_model(
        self,
        freight_code_id: str,
        model_type: str = "ensemble",
        use_optuna: bool = True,
        optuna_trials: int = 15,
        test_split_days: int = 60,
    ) -> Dict[str, Any]:
        start_time = time.time()
        version_tag = f"v{int(time.time())}"
        model_version_id = str(uuid.uuid4())

        logger.info(f"[Trainer] Fetching historical features for {freight_code_id}...")
        df = await feature_store.get_historical_features(freight_code_id, days=240)
        X = df[FEATURE_COLUMNS]
        y = df["rate"].shift(-1).ffill()

        best_params: Dict[str, Any] = {}

        if use_optuna and model_type in ["xgboost", "ensemble"]:
            logger.info(f"[Trainer] Running Optuna hyperparameter optimization ({optuna_trials} trials)...")
            def objective(trial):
                n_estimators = trial.suggest_int("n_estimators", 50, 150)
                max_depth = trial.suggest_int("max_depth", 3, 7)
                lr = trial.suggest_float("learning_rate", 0.01, 0.1, log=True)
                subsample = trial.suggest_float("subsample", 0.7, 0.95)

                tscv = TimeSeriesSplit(n_splits=3)
                scores = []
                for train_idx, val_idx in tscv.split(X):
                    X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
                    y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]

                    m = XGBoostFreightModel()
                    m.fit(X_tr, y_tr, {"n_estimators": n_estimators, "max_depth": max_depth, "learning_rate": lr, "subsample": subsample})
                    preds, _, _ = m.predict(X_val)
                    mape = float(abs((y_val.values - preds) / y_val.values).mean() * 100)
                    scores.append(mape)
                return sum(scores) / len(scores)

            study = optuna.create_study(direction="minimize")
            study.optimize(objective, n_trials=min(optuna_trials, 20))
            best_params = study.best_params
            logger.info(f"[Trainer] Best Optuna params: {best_params}")

        # Train model based on selected type
        if model_type == "xgboost":
            model = XGBoostFreightModel(model_id=f"xgb-{freight_code_id}-{version_tag}")
            model.fit(X, y, params=best_params)
        elif model_type == "lightgbm":
            model = LightGBMFreightModel(model_id=f"lgb-{freight_code_id}-{version_tag}")
            model.fit(X, y, params=best_params)
        else: # ensemble
            model = WeightedEnsembleModel(ensemble_id=f"ens-{freight_code_id}-{version_tag}")
            model.fit(X, y, xgb_params=best_params)

        # Backtest walk-forward evaluation
        bt_results = backtest_service.evaluate_walk_forward(model, df, horizon_days=test_split_days)

        # Save artifact
        artifact_path = settings.MODELS_DIR / f"{freight_code_id}_{version_tag}.pkl"
        if hasattr(model, "save"):
            model.save(artifact_path)

        # Register in warm registry
        registry.register_model(freight_code_id, model)
        registry.register_model(f"{freight_code_id}-{version_tag}", model)

        # Record to Database
        await self._record_model_version(freight_code_id, model_version_id, version_tag, bt_results, str(artifact_path))
        await backtest_service.record_backtest_result(freight_code_id, model_version_id, bt_results)

        duration = time.time() - start_time
        return {
            "modelVersionId": model_version_id,
            "versionTag": version_tag,
            "modelType": model_type,
            "freightCodeId": freight_code_id,
            "status": "PRODUCTION",
            "metrics": {
                "mae": bt_results["mae"],
                "rmse": bt_results["rmse"],
                "mape": bt_results["mape"],
            },
            "bestParams": {k: float(v) for k, v in best_params.items()},
            "featureCount": len(FEATURE_COLUMNS),
            "trainingDurationSec": round(duration, 2),
        }

    async def _record_model_version(self, freight_code_id: str, version_id: str, tag: str, metrics: Dict, artifact_path: str):
        pool = await get_db_pool()
        if not pool:
            return
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO ml_model_versions (
                        id, ml_model_id, version_tag, status, training_metrics, artifact_uri, model_artifact_path, deployed_at
                    ) VALUES (
                        $1::uuid,
                        (SELECT id FROM ml_models LIMIT 1),
                        $2,
                        'PRODUCTION',
                        $3::jsonb,
                        $4,
                        $5,
                        NOW()
                    ) ON CONFLICT DO NOTHING
                    """,
                    version_id,
                    tag,
                    pd.Series(metrics).to_json(),
                    artifact_path,
                    artifact_path,
                )
        except Exception as e:
            logger.warning(f"[Trainer] Could not save model version to DB: {e}")

model_trainer = ModelTrainerService()
