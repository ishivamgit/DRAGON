import json
from typing import Any, Optional
import redis.asyncio as aioredis
from app.config import settings


redis_pool: Optional[aioredis.ConnectionPool] = None
redis_client: Optional[aioredis.Redis] = None


async def init_redis() -> None:
    global redis_pool, redis_client
    redis_pool = aioredis.ConnectionPool.from_url(
        settings.REDIS_URL,
        max_connections=50,
        decode_responses=True,
    )
    redis_client = aioredis.Redis(connection_pool=redis_pool)


async def close_redis() -> None:
    global redis_client, redis_pool
    if redis_client:
        await redis_client.aclose()
    if redis_pool:
        await redis_pool.aclose()


async def get_redis() -> aioredis.Redis:
    if redis_client is None:
        raise RuntimeError("Redis client not initialized. Call init_redis() first.")
    return redis_client


async def cache_set(key: str, value: Any, ttl: int) -> None:
    client = await get_redis()
    serialized = json.dumps(value, default=str)
    await client.setex(key, ttl, serialized)


async def cache_get(key: str) -> Optional[Any]:
    client = await get_redis()
    raw = await client.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def cache_delete(key: str) -> None:
    client = await get_redis()
    await client.delete(key)


async def cache_delete_pattern(pattern: str) -> None:
    client = await get_redis()
    keys = await client.keys(pattern)
    if keys:
        await client.delete(*keys)
