from fastapi import APIRouter, HTTPException
from ..schemas.forecast import TrainRequest, TrainResponse
from ..services.model_trainer import model_trainer
from ..models.registry import registry

router = APIRouter()

@router.post("/train", response_model=TrainResponse)
async def trigger_model_training(req: TrainRequest):
    try:
        res = await model_trainer.train_model(
            freight_code_id=req.freightCodeId,
            model_type=req.modelType,
            use_optuna=req.useOptuna,
            optuna_trials=req.optunaTrials,
            test_split_days=req.testSplitDays,
        )
        return TrainResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.get("/models")
async def list_models():
    models = []
    for k, m in registry._loaded_models.items():
        models.append({
            "key": k,
            "type": type(m).__name__,
            "status": "PRODUCTION",
            "features": len(getattr(m, "feature_names", [])),
        })
    return {"success": True, "count": len(models), "models": models}
