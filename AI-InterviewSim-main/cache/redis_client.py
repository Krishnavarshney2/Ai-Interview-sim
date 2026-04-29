"""
Redis client for caching, rate limiting, and session management.
"""

import os
import json
from typing import Optional, Any
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Global redis client (initialized on first use)
_redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """Get or create Redis connection."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


async def close_redis():
    """Close Redis connection."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None


async def cache_get(key: str) -> Optional[Any]:
    """Get value from cache."""
    try:
        r = await get_redis()
        value = await r.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None
    except Exception:
        return None


async def cache_set(key: str, value: Any, ttl: int = 300):
    """Set value in cache with TTL (seconds)."""
    try:
        r = await get_redis()
        serialized = json.dumps(value) if not isinstance(value, (str, bytes)) else value
        await r.setex(key, ttl, serialized)
    except Exception:
        pass


async def cache_delete(key: str):
    """Delete value from cache."""
    try:
        r = await get_redis()
        await r.delete(key)
    except Exception:
        pass


# Rate limiting with Redis
async def check_rate_limit_redis(client_ip: str, endpoint: str, max_requests: int, window_seconds: int) -> dict:
    """
    Check rate limit using Redis sliding window.
    Returns {"allowed": bool, "retry_after": int, "remaining": int}
    """
    try:
        r = await get_redis()
        key = f"ratelimit:{endpoint}:{client_ip}"
        now = await r.time()  # Get Redis server time
        current_time = now[0] + now[1] / 1000000
        window_start = current_time - window_seconds

        # Remove old entries outside the window
        await r.zremrangebyscore(key, 0, window_start)

        # Count current requests in window
        request_count = await r.zcard(key)

        if request_count >= max_requests:
            # Get oldest request to calculate retry-after
            oldest = await r.zrange(key, 0, 0, withscores=True)
            if oldest:
                retry_after = int(oldest[0][1] + window_seconds - current_time) + 1
            else:
                retry_after = window_seconds
            return {"allowed": False, "retry_after": max(1, retry_after), "remaining": 0}

        # Add current request
        await r.zadd(key, {str(current_time): current_time})
        # Set expiry on the key
        await r.expire(key, window_seconds + 1)

        remaining = max_requests - request_count - 1
        return {"allowed": True, "retry_after": 0, "remaining": remaining}

    except Exception:
        # Fallback: allow request if Redis is down
        return {"allowed": True, "retry_after": 0, "remaining": max_requests}
