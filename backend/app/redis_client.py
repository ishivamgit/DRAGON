"""Cache + ephemeral key/value store.

In production (USE_REDIS=true) this is backed by Redis. For local dev
(USE_REDIS=false, the default) it transparently falls back to an in-process
store with TTL support, so the app runs with no Redis install required.

The public API (init_redis / close_redis / cache_set / cache_get /
cache_delete / cache_delete_pattern) is identical in both modes, so callers
never need to know which backend is active.
"""
import asyncio
import fnmatch
import json
import time
from typing import Any, Optional

from app.config import settings

# redis is only imported when actually used, so the package is not a hard
# dependency for local (in-memory) runs.
try:  # pragma: no cover - import guard
    import redis.asyncio as aioredis
except Exception:  # noqa: BLE001
    aioredis = None  # type: ignore[assignment]


_use_redis: bool = False
redis_client: Optional["aioredis.Redis"] = None  # type: ignore[name-defined]
redis_pool: Optional["aioredis.ConnectionPool"] = None  # type: ignore[name-defined]


class _InMemoryStore:
    """Async-safe in-process key/value store with per-key TTL."""

    def __init__(self) -> None:
        self._data: dict[str, tuple[str, Optional[float]]] = {}
        self._lock = asyncio.Lock()

    def _expired(self, key: str) -> bool:
        item = self._data.get(key)
        if item is None:
            return True
        _, expires_at = item
        if expires_at is not None and expires_at < time.monotonic():
            self._data.pop(key, None)
            return True
        return False

    async def setex(self, key: str, ttl: int, value: str) -> None:
        async with self._lock:
            self._data[key] = (value, time.monotonic() + ttl)

    async def set(self, key: str, value: str) -> None:
        async with self._lock:
            self._data[key] = (value, None)

    async def get(self, key: str) -> Optional[str]:
        async with self._lock:
            if self._expired(key):
                return None
            return self._data[key][0]

    async def delete(self, *keys: str) -> None:
        async with self._lock:
            for key in keys:
                self._data.pop(key, None)

    async def keys(self, pattern: str) -> list[str]:
        async with self._lock:
            # Drop expired entries first so they are not matched.
            for key in list(self._data.keys()):
                self._expired(key)
            return [k for k in self._data.keys() if fnmatch.fnmatch(k, pattern)]


_memory_store = _InMemoryStore()


async def init_redis() -> None:
    """Connect to Redis if enabled; otherwise use the in-memory fallback."""
    global redis_pool, redis_client, _use_redis

    if not settings.USE_REDIS:
        _use_redis = False
        return

    if aioredis is None:
        raise RuntimeError(
            "USE_REDIS=true but the 'redis' package is not installed. "
            "Install it with: pip install 'redis[hiredis]'"
        )

    redis_pool = aioredis.ConnectionPool.from_url(
        settings.REDIS_URL,
        max_connections=50,
        decode_responses=True,
    )
    redis_client = aioredis.Redis(connection_pool=redis_pool)
    # Fail fast if Redis is unreachable.
    await redis_client.ping()
    _use_redis = True


async def close_redis() -> None:
    global redis_client, redis_pool
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None
    if redis_pool is not None:
        await redis_pool.aclose()
        redis_pool = None


def _backend():
    """Return the active store (Redis client or in-memory fallback)."""
    if _use_redis and redis_client is not None:
        return redis_client
    return _memory_store


async def cache_set(key: str, value: Any, ttl: int) -> None:
    serialized = json.dumps(value, default=str)
    await _backend().setex(key, ttl, serialized)


async def cache_get(key: str) -> Optional[Any]:
    raw = await _backend().get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def cache_delete(key: str) -> None:
    await _backend().delete(key)


async def cache_delete_pattern(pattern: str) -> None:
    backend = _backend()
    keys = await backend.keys(pattern)
    if keys:
        await backend.delete(*keys)
