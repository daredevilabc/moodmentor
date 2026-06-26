import logging
import time
from urllib.parse import quote

from services.http_client import request_with_retry

from services.logging_config import get_logger

logger = get_logger("moodmentor.philosophy")


class PhilosophyService:
    WIKI_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{title}"

    PHILOSOPHY_WIKI_MAP = {
        "Stoicism": "Stoicism",
        "Buddhism": "Buddhism",
        "Samurai Code": "Samurai",
        "Discipline": "Discipline",
        "Modern Success": "Success",
        "Growth Mindset": "Growth mindset",
    }

    def __init__(self):
        self.cache = {}

    async def get_summary(self, philosophy_id: str) -> dict:
        if philosophy_id in self.cache:
            logger.info("philosophy_cache_hit", extra={"philosophy": philosophy_id})
            return self.cache[philosophy_id]

        logger.info("philosophy_cache_miss", extra={"philosophy": philosophy_id})

        wiki_title = self.PHILOSOPHY_WIKI_MAP.get(philosophy_id, philosophy_id)
        encoded = quote(wiki_title.replace(" ", "_"))
        url = self.WIKI_SUMMARY_URL.format(title=encoded)

        try:
            start = time.perf_counter()
            response = await request_with_retry(
                "GET", url, headers={"User-Agent": "MoodMentor/1.0"}
            )
            duration_ms = int((time.perf_counter() - start) * 1000)
            data = response.json()
            result = {
                "title": data.get("title", wiki_title),
                "summary": data.get("extract", ""),
            }
            self.cache[philosophy_id] = result
            logger.info(
                "philosophy_api_success",
                extra={"philosophy": philosophy_id, "duration_ms": duration_ms}
            )
            return result
        except Exception as e:
            logger.warning(
                "philosophy_api_failed_using_fallback",
                extra={"philosophy": philosophy_id, "error": type(e).__name__},
                exc_info=True
            )
            result = {
                "title": philosophy_id,
                "summary": f"{philosophy_id} is a philosophical tradition that teaches us how to live with purpose and meaning.",
            }
            self.cache[philosophy_id] = result
            return result


philosophy_service = PhilosophyService()
