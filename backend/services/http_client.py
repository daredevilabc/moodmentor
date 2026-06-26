import asyncio
import logging
import httpx

from services.logging_config import get_logger

logger = get_logger("moodmentor.http")

DEFAULT_TIMEOUT = httpx.Timeout(10.0, connect=5.0)
MAX_RETRIES = 3
BASE_DELAY = 0.5

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT)
    return _client


async def close_client() -> None:
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
        _client = None


async def request_with_retry(
    method: str,
    url: str,
    *,
    max_retries: int = MAX_RETRIES,
    base_delay: float = BASE_DELAY,
    **kwargs,
) -> httpx.Response:
    client = get_client()
    last_exc = None

    for attempt in range(max_retries + 1):
        try:
            response = await client.request(method, url, **kwargs)

            if response.status_code >= 500:
                raise httpx.HTTPStatusError(
                    f"Server error: {response.status_code}",
                    request=response.request,
                    response=response,
                )

            response.raise_for_status()
            return response

        except (httpx.TimeoutException, httpx.NetworkError, httpx.HTTPStatusError) as e:
            last_exc = e
            if attempt < max_retries:
                delay = base_delay * (2 ** attempt)
                logger.warning(
                    "http_request_retry",
                    extra={
                        "url": url,
                        "method": method,
                        "attempt": attempt + 1,
                        "max_attempts": max_retries + 1,
                        "error": type(e).__name__,
                        "retry_delay_s": delay,
                    }
                )
                await asyncio.sleep(delay)
            else:
                logger.error(
                    "http_request_failed",
                    extra={
                        "url": url,
                        "method": method,
                        "attempts": max_retries + 1,
                        "error": type(last_exc).__name__,
                        "error_msg": str(last_exc),
                    },
                    exc_info=True
                )

    raise last_exc