import asyncio
import logging
import os
import google.generativeai as genai

from services.logging_config import get_logger

logger = get_logger("moodmentor.gemini")

GEMINI_TIMEOUT = 60.0

from services.exceptions import GeminiTimeoutError, GeminiAPIError


class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here":
            raise ValueError("GEMINI_API_KEY not set in environment variables")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def _format_news(self, news: list) -> str:
        if not news:
            return "No news available."
        lines = []
        for item in news:
            title = item.get("title", "")
            desc = item.get("description", "")
            lines.append(f"- {title}: {desc}" if desc else f"- {title}")
        return "\n".join(lines)

    def _format_events(self, events: list) -> str:
        if not events:
            return "No historical events available."
        lines = []
        for ev in events:
            year = ev.get("year")
            text = ev.get("text", "")
            lines.append(f"- {f'({year}) ' if year else ''}{text}")
        return "\n".join(lines)

    async def generate_wisdom(
        self,
        mood: str,
        philosophy: str,
        philosophy_summary: str,
        news: list,
        historical_events: list,
        inspirational_story: dict,
    ) -> str:
        news_text = self._format_news(news)
        events_text = self._format_events(historical_events)
        story_name = inspirational_story.get("name", "Unknown")
        story_text = inspirational_story.get("summary", "")

        logger.info(
            "gemini_generate_start",
            extra={"mood": mood, "philosophy": philosophy}
        )

        prompt = f"""You are MoodMentor, an AI mentor that generates personalized wisdom.

User's Current Mood: {mood}
Chosen Philosophy: {philosophy}

About {philosophy}:
{philosophy_summary}

Today's Context:
- News: {news_text}
- Historical Event: {events_text}
- Inspirational Story ({story_name}): {story_text}

Task:
Generate a short wisdom message (maximum 70 words) that:
- Is original and unique to this specific combination of mood, philosophy, and context
- Is inspired by the philosophy of {philosophy} using the description above
- Is motivational and comforting for someone feeling {mood}
- Subtly incorporates themes from today's context without explicitly mentioning the sources
- Ends with ONE clear, actionable piece of advice

Write in a warm, wise, and encouraging tone. Do not use markdown formatting."""

        try:
            import time
            start = time.perf_counter()
            response = await asyncio.wait_for(
                self.model.generate_content_async(prompt),
                timeout=GEMINI_TIMEOUT
            )
            duration_ms = int((time.perf_counter() - start) * 1000)
            logger.info(
                "gemini_generate_success",
                extra={"mood": mood, "philosophy": philosophy, "duration_ms": duration_ms}
            )
            return response.text.strip()
        except asyncio.TimeoutError:
            logger.warning(
                "gemini_generate_timeout",
                extra={"mood": mood, "philosophy": philosophy, "timeout_s": GEMINI_TIMEOUT}
            )
            raise GeminiTimeoutError()
        except Exception as e:
            logger.error(
                "gemini_generate_error",
                extra={"mood": mood, "philosophy": philosophy, "error": type(e).__name__},
                exc_info=True
            )
            raise GeminiAPIError(str(e))


gemini_service = GeminiService()
