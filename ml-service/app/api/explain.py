from fastapi import APIRouter, HTTPException
import pandas as pd
from ..schemas.forecast import ExplainRequest, ExplainResponse
from ..models.registry import registry
from ..models.features import FEATURE_COLUMNS
from ..services.feature_store import feature_store

router = APIRouter()

@router.post("/explain", response_model=ExplainResponse)
async def explain_prediction(req: ExplainRequest):
    model = registry.get_model(req.freightCodeId)
    if model is None:
        raise HTTPException(status_code=404, detail=f"No model found for {req.freightCodeId}")

    # Use provided features or fetch from feature store
    if req.features and len(req.features) > 0:
        features = req.features
    else:
        features = await feature_store.get_latest_features(req.freightCodeId)

    df_feat = pd.DataFrame([features])
    for col in FEATURE_COLUMNS:
        if col not in df_feat.columns:
            df_feat[col] = 0.0
    df_feat = df_feat[FEATURE_COLUMNS]

    if not hasattr(model, "explain"):
        raise HTTPException(status_code=400, detail="Model does not support SHAP tree explanations")

    base_val, shap_dict = model.explain(df_feat)
    preds, _, _ = model.predict(df_feat)
    predicted_rate = round(float(preds[0]), 2)

    # Sort drivers
    sorted_drivers = sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)
    positive_drivers = [{k: v} for k, v in sorted_drivers if v > 0][:5]
    negative_drivers = [{k: v} for k, v in sorted_drivers if v < 0][:5]

    return ExplainResponse(
        freightCodeId=req.freightCodeId,
        baseValue=round(base_val, 2),
        predictedRateUsd=predicted_rate,
        shapValues=shap_dict,
        topPositiveDrivers=positive_drivers,
        topNegativeDrivers=negative_drivers,
    )
