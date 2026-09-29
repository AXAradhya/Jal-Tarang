from typing import Optional, List, Dict, Literal
from pydantic import BaseModel, Field

class ForecastRequest(BaseModel):
    freightCodeId: str = Field(..., description="Target Baltic freight code ID (e.g., C5TC, C3TC, P1A, or UUID)")
    horizonDays: int = Field(30, description="Forecast horizon in days (7, 14, 30, 60, 90, 180)")
    modelVersion: Optional[str] = Field("production", description="Target model version or tag")
    includeExplanation: bool = Field(False, description="Whether to include SHAP feature importance values")

class PredictionPoint(BaseModel):
    targetDate: str = Field(..., description="ISO 8601 target forecast date")
    predictedRateUsd: float = Field(..., description="Predicted freight rate in USD/MT or USD/day")
    lowerBoundUsd: float = Field(..., description="P10 lower prediction bound (Quantile Regression)")
    upperBoundUsd: float = Field(..., description="P90 upper prediction bound (Quantile Regression)")
    confidence: float = Field(..., description="Confidence score between 0 and 1")
    featureImportance: Optional[Dict[str, float]] = Field(None, description="SHAP feature importance if requested")

class ForecastMetrics(BaseModel):
    mae: float = Field(..., description="Mean Absolute Error")
    rmse: float = Field(..., description="Root Mean Squared Error")
    mape: float = Field(..., description="Mean Absolute Percentage Error (%)")

class ForecastResponse(BaseModel):
    runId: str = Field(..., description="Unique forecast execution UUID")
    freightCodeId: str = Field(..., description="Evaluated freight code ID")
    horizonDays: int = Field(..., description="Forecast horizon in days")
    modelVersion: str = Field(..., description="Active model version used for inference")
    predictions: List[PredictionPoint] = Field(..., description="Predicted time-series points")
    metrics: ForecastMetrics = Field(..., description="Model historical performance metrics")

class ExplainRequest(BaseModel):
    freightCodeId: str = Field(..., description="Freight code to explain")
    features: Optional[Dict[str, float]] = Field(None, description="Optional feature vector snapshot")
    horizonDays: int = Field(30, description="Target prediction horizon")

class ExplainResponse(BaseModel):
    freightCodeId: str
    baseValue: float = Field(..., description="SHAP expected baseline rate value")
    predictedRateUsd: float
    shapValues: Dict[str, float] = Field(..., description="Attribution of each feature to the predicted rate")
    topPositiveDrivers: List[Dict[str, float]] = Field(..., description="Top features pushing rate higher")
    topNegativeDrivers: List[Dict[str, float]] = Field(..., description="Top features pulling rate lower")

class TrainRequest(BaseModel):
    freightCodeId: str = Field(..., description="Freight code to train model for")
    modelType: Literal["xgboost", "lightgbm", "ensemble"] = Field("ensemble", description="Algorithm type")
    useOptuna: bool = Field(True, description="Enable Optuna Bayesian hyperparameter optimization")
    optunaTrials: int = Field(15, description="Number of Optuna trials")
    testSplitDays: int = Field(60, description="Walk-forward test evaluation window in days")

class TrainResponse(BaseModel):
    modelVersionId: str
    versionTag: str
    modelType: str
    freightCodeId: str
    status: str
    metrics: ForecastMetrics
    bestParams: Dict[str, float]
    featureCount: int
    trainingDurationSec: float
