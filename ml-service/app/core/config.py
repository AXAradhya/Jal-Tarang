import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SERVICE_NAME: str = "SAIL MARINEX ML Service"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8001
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str = "postgresql://sail_marinex:marinex_secure_pass@localhost:5432/sail_marinex_db"

    # Redis Cache
    REDIS_URL: str = "redis://:redis_secure_pass@localhost:6379/1"
    CACHE_PREDICTIONS: bool = True
    CACHE_TTL_SECONDS: int = 3600

    # Node.js Backend Integration
    NODE_BACKEND_URL: str = "http://localhost:8000"

    # Model Storage & MLflow
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    MODELS_DIR: Path = Path(__file__).resolve().parent.parent.parent / "models_store"

    # Forecast Performance Targets
    TARGET_MAPE_C5TC: float = 0.04   # < 4%
    TARGET_MAPE_C3TC: float = 0.05   # < 5%
    TARGET_MAPE_P1A: float = 0.06    # < 6%

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)
