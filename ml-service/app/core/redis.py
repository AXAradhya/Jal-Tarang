import asyncio
import json
import logging
import time
from typing import Any, Optional
from .config import settings

logger = logging.getLogger(__name__)

# Fallback in-memory cache with TTL
_in_memory_cache: dict[str, tuple[float, Any]] = {}
_redis_client = None

async def init_redis():
    global _redis_client
    if not settings.CACHE_PREDICTIONS:
        return None
    try:
        import redis.asyncio as aioredis
        client = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True, socket_connect_timeout=1.5)
        await asyncio.wait_for(client.ping(), timeout=1.5)
        _redis_client = client
        logger.info("[Redis] Connected to Redis cache.")
        return _redis_client
    except Exception as e:
        logger.info(f"[Redis] Redis offline/unreachable ({e}). Using in-memory fallback cache.")
        _redis_client = None
        return None


async def get_cached(key: str) -> Optional[Any]:
    global _redis_client
    if _redis_client is not None:
        try:
            val = await _redis_client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.warning(f"[Redis] Error getting key {key}: {e}")

    # Check in-memory cache
    if key in _in_memory_cache:
        expire_at, val = _in_memory_cache[key]
        if time.time() < expire_at:
            return val
        else:
            del _in_memory_cache[key]
    return None

async def set_cached(key: str, value: Any, ttl_seconds: int = 3600):
    global _redis_client
    serialized = json.dumps(value)
    if _redis_client is not None:
        try:
            await _redis_client.set(key, serialized, ex=ttl_seconds)
            return
        except Exception as e:
            logger.warning(f"[Redis] Error setting key {key}: {e}")

    # Store in memory
    _in_memory_cache[key] = (time.time() + ttl_seconds, value)
