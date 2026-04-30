"""
Redis client for caching, rate limiting, and session management.
Handles missing Redis gracefully with connection timeouts.
"""

import os
import json
import asyncio
from typing import Optional, Any
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "")

# Global redis client (initialized on first use)
_redis_client: Optional[redis.Redis] = None
_redis_available: Optional[bool] = None  # None = not checked yet


async def get_redis() -> Optional[redis.Redis]:
    """Get or create Redis connection with timeout. Returns None if unavailable."""
    global _redis_client, _redis_available

    if _redis_available is False:
        return None  # Already know Redis is down

    if _redis_client is None:
        if not REDIS_URL:
            _redis_available = False
            return None

        try:
            _redis_client = redis.from_url(
                REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,   # Fail fast if can't connect
                socket_timeout=2,           # Fail fast on operations
            )
            # Test connection immediately
            await asyncio.wait_for(_redis_client.ping(), timeout=3)
            _redis_available = True
        except Exception:
            _redis_available = False
            _redis_client = None
            return None

    return _redis_client


async def close_redis():
    """Close Redis connection."""
    global _redis_client, _redis_available
    if _redis_client:
        try:
            await _redis_client.close()
        except Exception:
            pass
        _redis_client = None
    _redis_available = None


async def cache_get(key: str) -> Optional[Any]:
    """Get value from cache. Returns None if Redis unavailable."""
    try:
        r = await get_redis()
        if r is None:
            return None
        value = await asyncio.wait_for(r.get(key), timeout=2)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None
    except Exception:
        return None


async def cache_set(key: str, value: Any, ttl: int = 300):
    """Set value in cache with TTL. Silently fails if Redis unavailable."""
    try:
        r = await get_redis()
        if r is None:
            return
        serialized = json.dumps(value) if not isinstance(value, (str, bytes)) else value
        await asyncio.wait_for(r.setex(key, ttl, serialized), timeout=2)
    except Exception:
        pass


async def cache_delete(key: str):
    """Delete value from cache. Silently fails if Redis unavailable."""
    try:
        r = await get_redis()
        if r is None:
            return
        await asyncio.wait_for(r.delete(key), timeout=2)
    except Exception:
        pass


# Rate limiting with Redis
async def check_rate_limit_redis(client_ip: str, endpoint: str, max_requests: int, window_seconds: int) -> dict:
    """
    Check rate limit using Redis sliding window.
    Returns {"allowed": bool, "retry_after": int, "remaining": int}
    Falls back to allowing the request if Redis is unavailable.
    """
    try:
        r = await get_redis()
        if r is None:
            return {"allowed": True, "retry_after": 0, "remaining": max_requests}

        key = f"ratelimit:{endpoint}:{client_ip}"
        now = await asyncio.wait_for(r.time(), timeout=2)
        current_time = now[0] + now[1] / 1000000
        window_start = current_time - window_seconds

        pipe = r.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zcard(key)
        results = await asyncio.wait_for(pipe.execute(), timeout=2)
        request_count = results[1]

        if request_count >= max_requests:
            oldest = await asyncio.wait_for(r.zrange(key, 0, 0, withscores=True), timeout=2)
            if oldest:
                retry_after = int(oldest[0][1] + window_seconds - current_time) + 1
            else:
                retry_after = window_seconds
            return {"allowed": False, "retry_after": max(1, retry_after), "remaining": 0}

        await asyncio.wait_for(
            r.zadd(key, {str(current_time): current_time}),
            timeout=2
        )
        await asyncio.wait_for(r.expire(key, window_seconds + 1), timeout=2)

        remaining = max_requests - request_count - 1
        return {"allowed": True, "retry_after": 0, "remaining": remaining}

    except Exception:
        # Fallback: allow request if Redis is down or timing out
        return {"allowed": True, "retry_after": 0, "remaining": max_requests}
