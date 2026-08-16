"""Tiny Win — Async Redis cache layer."""

import json
from typing import Any

import redis.asyncio as aioredis

from .config import settings

redis_client: aioredis.Redis | None = None


async def init_redis() -> None:
    """Connect to Redis on application startup."""
    global redis_client
    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)


async def close_redis() -> None:
    """Disconnect from Redis on application shutdown."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


async def cache_get(key: str) -> Any | None:
    """Get a JSON-serialised value from cache."""
    if not redis_client:
        return None
    raw = await redis_client.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def cache_set(key: str, value: Any, ttl_seconds: int = 60) -> None:
    """Set a JSON-serialised value in cache with TTL."""
    if not redis_client:
        return
    await redis_client.set(key, json.dumps(value, default=str), ex=ttl_seconds)


async def cache_del(key: str) -> None:
    """Delete a cache key."""
    if not redis_client:
        return
    await redis_client.delete(key)
