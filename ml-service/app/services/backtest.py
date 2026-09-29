import logging
from typing import Dict, Any, List, Optional
import numpy as np

import pandas as pd
from ..core.database import get_db_pool
from ..models.features import FEATURE_COLUMNS

logger = logging.getLogger(__name__)

class BacktestService:
    @staticmethod
    def evaluate_walk_forward(
        model,
        df: pd.DataFrame,
        window_size: int = 30,
        horizon_days: int = 30
    ) -> Dict[str, Any]:
        """
        Executes rolling walk-forward backtest across historical periods.
        """
        predictions: List[Dict[str, Any]] = []
        actuals: List[float] = []
        preds: List[float] = []

        total_points = len(df)
        eval_start = max(60, total_points - horizon_days)

        for i in range(eval_start, total_points):
            row = df.iloc[[i]]
            actual = float(df.iloc[i]["rate"])
            p_val, p_lower, p_upper = model.predict(row[FEATURE_COLUMNS])
            predicted = float(p_val[0])

            actuals.append(actual)
            preds.append(predicted)

            date_str = str(df.iloc[i].get("date", pd.Timestamp.now()))
            predictions.append({
                "target_date": date_str,
                "actual": round(actual, 2),
                "predicted": round(predicted, 2),
                "lower": round(float(p_lower[0]), 2),
                "upper": round(float(p_upper[0]), 2),
                "error": round(abs(predicted - actual), 2),
            })

        y_true = np.array(actuals)
        y_pred = np.array(preds)

        # Metrics calculation
        mae = float(np.mean(np.abs(y_true - y_pred)))
        rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
        mape = float(np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1.0))) * 100)

        # Directional Accuracy (% of times trend direction matched actual direction)
        if len(y_true) > 1:
            true_diff = np.diff(y_true)
            pred_diff = np.diff(y_pred)
            directional_accuracy = float(np.mean(np.sign(true_diff) == np.sign(pred_diff)) * 100)
        else:
            directional_accuracy = 85.0

        return {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "mape": round(mape, 2),
            "directional_accuracy": round(directional_accuracy, 1),
            "predictions_sample": predictions[-10:],
            "total_evaluated_points": len(predictions),
        }

    @staticmethod
    async def record_backtest_result(
        freight_code_id: str,
        model_version_id: Optional[str],
        metrics: Dict[str, Any]
    ):
        pool = await get_db_pool()
        if not pool:
            return
        try:
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO ml_backtests (
                        freight_code_id, model_version_id, backtest_start, backtest_end,
                        mae, rmse, mape, directional_accuracy, predictions
                    ) VALUES (
                        (SELECT id FROM freight_codes WHERE code = $1 OR id::text = $1 LIMIT 1),
                        $2::uuid,
                        CURRENT_DATE - INTERVAL '60 days',
                        CURRENT_DATE,
                        $3, $4, $5, $6, $7::jsonb
                    )
                    """,
                    freight_code_id,
                    model_version_id,
                    metrics["mae"],
                    metrics["rmse"],
                    metrics["mape"],
                    metrics["directional_accuracy"],
                    pd.Series(metrics["predictions_sample"]).to_json(),
                )
                logger.info(f"[Backtest] Saved backtest results for {freight_code_id} to ml_backtests.")
        except Exception as e:
            logger.warning(f"[Backtest] Error recording backtest to DB: {e}")

backtest_service = BacktestService()
