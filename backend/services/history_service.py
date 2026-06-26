import logging
import random
import time
from datetime import datetime
from urllib.parse import quote

from services.http_client import request_with_retry
from services.cache import get, set

from services.logging_config import get_logger

logger = get_logger("moodmentor.history")

HISTORY_CACHE_TTL = 600


class HistoryService:
    WIKI_ONTHISDAY_URL = (
        "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/{month}/{day}"
    )
    WIKI_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{name}"

    INSPIRATIONAL_PEOPLE = [
        "Nelson Mandela",
        "Malala Yousafzai",
        "Stephen Hawking",
        "Marie Curie",
        "Thomas Edison",
        "J.K. Rowling",
        "Abraham Lincoln",
        "Wright brothers",
        "Helen Keller",
        "Alan Turing",
        "Oprah Winfrey",
    ]

    FALLBACK_STORIES = [
        "J.K. Rowling was rejected by 12 publishers before Harry Potter became a global phenomenon, teaching us persistence creates magic.",
        "Thomas Edison failed 10,000 times before inventing the light bulb, showing that perseverance turns failure into success.",
        "Nelson Mandela spent 27 years in prison yet emerged to lead South Africa toward reconciliation, proving forgiveness is stronger than bitterness.",
    ]

    async def get_historical_events(self) -> list:
        today = datetime.now()
        cache_key = f"historical_events_{today.month}_{today.day}"

        cached = get(cache_key)
        if cached is not None:
            logger.info("history_events_cache_hit", extra={"cache_key": cache_key})
            return cached

        logger.info("history_events_cache_miss", extra={"cache_key": cache_key})

        url = self.WIKI_ONTHISDAY_URL.format(month=today.month, day=today.day)

        try:
            start = time.perf_counter()
            response = await request_with_retry(
                "GET", url, headers={"User-Agent": "MoodMentor/1.0"}
            )
            duration_ms = int((time.perf_counter() - start) * 1000)
            data = response.json()
            events = (data.get("events") or [])[:3]

            result = []
            for event in events:
                entry = {
                    "year": event.get("year"),
                    "text": event.get("text", ""),
                }
                pages = event.get("pages") or []
                if pages:
                    content_urls = pages[0].get("content_urls") or {}
                    desktop = content_urls.get("desktop") or {}
                    if desktop.get("page"):
                        entry["url"] = desktop["page"]
                result.append(entry)
            if result:
                set(cache_key, result, HISTORY_CACHE_TTL)
            logger.info(
                "history_events_api_success",
                extra={"duration_ms": duration_ms, "event_count": len(result)}
            )
            return result if result else self._fallback_events()
        except Exception as e:
            logger.warning(
                "history_events_api_failed_using_fallback",
                extra={"error": type(e).__name__},
                exc_info=True
            )
            return self._fallback_events()

    def _fallback_events(self) -> list:
        return [
            {
                "year": None,
                "text": "On this day in history, courageous individuals stood up for what they believed in, changing the course of humanity.",
                "url": None,
            }
        ]

    async def get_inspirational_story(self) -> dict:
        name = random.choice(self.INSPIRATIONAL_PEOPLE)
        encoded = quote(name.replace(" ", "_"))
        cache_key = f"inspirational_story_{encoded}"

        cached = get(cache_key)
        if cached is not None:
            logger.info("inspirational_story_cache_hit", extra={"cache_key": cache_key, "person": name})
            return cached

        logger.info("inspirational_story_cache_miss", extra={"cache_key": cache_key, "person": name})

        url = self.WIKI_SUMMARY_URL.format(name=encoded)

        try:
            start = time.perf_counter()
            response = await request_with_retry(
                "GET", url, headers={"User-Agent": "MoodMentor/1.0"}
            )
            duration_ms = int((time.perf_counter() - start) * 1000)
            data = response.json()
            result = {
                "name": data.get("title", name),
                "summary": data.get("extract", ""),
                "url": (
                    data.get("content_urls", {})
                    .get("desktop", {})
                    .get("page", "")
                ),
            }
            set(cache_key, result, HISTORY_CACHE_TTL)
            logger.info(
                "inspirational_story_api_success",
                extra={"duration_ms": duration_ms, "person": name}
            )
            return result
        except Exception as e:
            logger.warning(
                "inspirational_story_api_failed_using_fallback",
                extra={"person": name, "error": type(e).__name__},
                exc_info=True
            )
            return {
                "name": name,
                "summary": random.choice(self.FALLBACK_STORIES),
                "url": "",
            }


history_service = HistoryService()