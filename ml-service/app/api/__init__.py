from .health import router as health_router
from .forecast import router as forecast_router
from .train import router as train_router
from .explain import router as explain_router
from .nlp import router as nlp_router

__all__ = ["health_router", "forecast_router", "train_router", "explain_router", "nlp_router"]
