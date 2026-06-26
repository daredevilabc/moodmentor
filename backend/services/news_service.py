import logging
import os
import random
import time

from services.http_client import request_with_retry
from services.cache import get, set

from services.logging_config import get_logger

logger = get_logger("moodmentor.news")

NEWS_CACHE_KEY = "todays_news"
NEWS_CACHE_TTL = 600


class NewsService:
    def __init__(self):
        self.api_key = os.getenv("NEWS_API_KEY")
        self.base_url = "https://newsapi.org/v2"

    async def get_todays_news(self) -> list:
        if not self.api_key or self.api_key == "your_news_api_key_here":
            logger.debug("news_api_key_missing_using_fallback")
            return self._get_fallback_news()

        cached = get(NEWS_CACHE_KEY)
        if cached is not None:
            logger.info("news_cache_hit", extra={"cache_key": NEWS_CACHE_KEY})
            return cached

        logger.info("news_cache_miss", extra={"cache_key": NEWS_CACHE_KEY})

        try:
            start = time.perf_counter()
            response = await request_with_retry(
                "GET",
                f"{self.base_url}/top-headlines",
                params={
                    "country": "us",
                    "pageSize": 3,
                    "apiKey": self.api_key,
                },
            )
            duration_ms = int((time.perf_counter() - start) * 1000)
            data = response.json()

            if data.get("articles"):
                articles = []
                for article in data["articles"][:3]:
                    articles.append(
                        {
                            "title": article.get("title", ""),
                            "description": article.get("description", ""),
                            "url": article.get("url", ""),
                        }
                    )
                set(NEWS_CACHE_KEY, articles, NEWS_CACHE_TTL)
                logger.info(
                    "news_api_success",
                    extra={"duration_ms": duration_ms, "article_count": len(articles)}
                )
                return articles
            logger.warning("news_api_empty_response_using_fallback")
            return self._get_fallback_news()
        except Exception as e:
            logger.warning(
                "news_api_failed_using_fallback",
                extra={"error": type(e).__name__},
                exc_info=True
            )
            return self._get_fallback_news()

    def _get_fallback_news(self) -> list:
        fallback = [
            {
                "title": "Global climate summit reaches historic agreement on renewable energy transition",
                "description": "World leaders commit to ambitious climate goals in landmark deal.",
                "url": "",
            },
            {
                "title": "Breakthrough in quantum computing promises revolutionary advances in medicine",
                "description": "Scientists achieve major milestone in quantum computing research.",
                "url": "",
            },
            {
                "title": "International space collaboration launches mission to study dark matter",
                "description": "Global space agencies join forces for unprecedented scientific mission.",
                "url": "",
            },
        ]
        return random.sample(fallback, 2)


news_service = NewsService()
