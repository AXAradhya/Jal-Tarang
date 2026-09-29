import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import init_db, close_db
from .core.redis import init_redis
from .models.registry import registry
from .api import health_router, forecast_router, train_router, explain_router, nlp_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ml_service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SAGAR DRISHTI ML Service...")
    # Initialize background connections
    await init_db()
    await init_redis()

    # Warm up models
    registry.warm_up_production_models()
    logger.info("SAGAR DRISHTI ML Service ready on port %s", settings.PORT)
    yield
    logger.info("Shutting down ML Service...")
    await close_db()

app = FastAPI(
    title="SAGAR DRISHTI ML Microservice",
    description="Intelligent Freight Forecasting, Quantile Uncertainty Estimation, SHAP Attribution & NLP Geopolitical Sentiment",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/internal/ml/docs",
    openapi_url="/internal/ml/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount /internal/ml routes
app.include_router(health_router, prefix="/internal/ml", tags=["Health"])
app.include_router(forecast_router, prefix="/internal/ml", tags=["Forecast"])
app.include_router(explain_router, prefix="/internal/ml", tags=["Explainability"])
app.include_router(train_router, prefix="/internal/ml", tags=["Training & Governance"])
app.include_router(nlp_router, prefix="/internal/ml", tags=["NLP Disruption Sentiment"])

@app.get("/")
def root():
    return {
        "service": "SAGAR DRISHTI Python ML Microservice",
        "version": "2.0.0",
        "docs": "/internal/ml/docs",
        "health": "/internal/ml/health",
    }
