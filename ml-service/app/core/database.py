import asyncio
import logging
import asyncpg
from typing import Optional
from .config import settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None

async def init_db() -> Optional[asyncpg.Pool]:
    global _pool
    if _pool is not None:
        return _pool
    try:
        db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        _pool = await asyncio.wait_for(
            asyncpg.create_pool(
                dsn=db_url,
                min_size=1,
                max_size=10,
                command_timeout=5.0,
                timeout=1.5
            ),
            timeout=2.0
        )
        logger.info("[Database] Connected to PostgreSQL pool successfully.")
        return _pool
    except Exception as e:
        logger.info(f"[Database] PostgreSQL offline/unreachable ({e}). Operating in resilient fallback mode.")
        _pool = None
        return None


async def get_db_pool() -> Optional[asyncpg.Pool]:
    global _pool
    if _pool is None:
        await init_db()
    return _pool

async def close_db():
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("[Database] Closed PostgreSQL connection pool.")
