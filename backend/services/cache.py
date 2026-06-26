import time
import logging
from typing import Any, Optional

from services.logging_config import get_logger

logger = get_logger("moodmentor.cache")

CACHE_TTL = 600

_cache: dict[str, tuple[float, Any]] = {}


def get(key: str) -> Optional[Any]:
    entry = _cache.get(key)
    if entry is None:
        logger.debug("cache_miss", extra={"key": key})
        return None
    expires_at, value = entry
    if time.time() > expires_at:
        del _cache[key]
        logger.debug("cache_expired", extra={"key": key})
        return None
    logger.debug("cache_hit", extra={"key": key})
    return value


def set(key: str, value: Any, ttl: int = CACHE_TTL) -> None:
    _cache[key] = (time.time() + ttl, value)
    logger.debug("cache_set", extra={"key": key, "ttl": ttl})


def clear() -> None:
    _cache.clear()
    logger.debug("cache_cleared")