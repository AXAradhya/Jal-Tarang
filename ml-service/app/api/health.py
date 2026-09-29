from datetime import datetime
from fastapi import APIRouter
from ..core.config import settings
from ..core.database import get_db_pool
from ..models.registry import registry

router = APIRouter()

@router.get("/health")
async def get_health():
    pool = await get_db_pool()
    db_connected = pool is not None

    return {
        "status": "HEALTHY",
        "service": settings.SERVICE_NAME,
        "environment": settings.ENVIRONMENT,
        "port": settings.PORT,
        "database": {
            "status": "CONNECTED" if db_connected else "RESILIENT_FALLBACK",
            "isLive": db_connected,
        },
        "loadedModels": list(registry._loaded_models.keys()),
        "targets": {
            "c5tc_mape": settings.TARGET_MAPE_C5TC,
            "c3tc_mape": settings.TARGET_MAPE_C3TC,
            "p1a_mape": settings.TARGET_MAPE_P1A,
        },
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
