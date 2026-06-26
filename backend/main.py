import asyncio
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

from services.logging_config import configure_logging

logger = configure_logging()

DISABLE_RATE_LIMIT = os.getenv("DISABLE_RATE_LIMIT", "false").lower() == "true"

class NoOpLimiter:
    def limit(self, limit_str):
        def decorator(func):
            return func
        return decorator
    
    def __call__(self, func):
        return func

if DISABLE_RATE_LIMIT:
    limiter = NoOpLimiter()
else:
    limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "1.0")),
        profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
        environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
    )
    logger.info("Sentry initialized", extra={"environment": os.getenv("SENTRY_ENVIRONMENT", "production")})

from services.exceptions import MoodMentorError
from services.gemini_service import gemini_service
from services.news_service import news_service
from services.history_service import history_service
from services.philosophy_service import philosophy_service
from services.http_client import close_client
from services.database import (
    init_db, close_db, save_wisdom_history,
    get_wisdom_history, delete_wisdom_entry, clear_all_history,
    add_favorite, remove_favorite, get_favorites, check_favorite,
    save_user_feedback,
)

REQUIRED_ENV_VARS = ["GEMINI_API_KEY"]

@asynccontextmanager
async def lifespan(app: FastAPI):
    missing = [var for var in REQUIRED_ENV_VARS if not os.getenv(var) or os.getenv(var) == f"your_{var.lower()}_here"]
    if missing:
        logger.error(f"Missing required environment variables: {missing}")
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
    
    if os.getenv("RUNNING_UNDER_GUNICORN") != "true":
        await init_db()
        logger.info("Database initialized locally")
    else:
        logger.info("Database initialization bypassed in worker process (handled by Gunicorn master)")
        
    logger.info("Application startup complete")
    yield
    logger.info("Application shutdown")
    await close_client()
    await close_db()

app = FastAPI(
    title="MoodMentor API",
    description="AI-powered personalized wisdom generator",
    version="1.0.0",
    lifespan=lifespan
)

if not DISABLE_RATE_LIMIT:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(MoodMentorError)
async def moodmentor_error_handler(request: Request, exc: MoodMentorError):
    return JSONResponse(
        status_code=500 if exc.code != "VALIDATION_ERROR" else 400,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )

cors_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if not API_KEY:
        return
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    start = time.perf_counter()
    logger.info(
        "request_start",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
        }
    )
    try:
        response = await call_next(request)
        duration_ms = int((time.perf_counter() - start) * 1000)
        logger.info(
            "request_complete",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            }
        )
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        duration_ms = int((time.perf_counter() - start) * 1000)
        logger.error(
            "request_error",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "error": type(e).__name__,
                "duration_ms": duration_ms,
            },
            exc_info=True
        )
        raise

class WisdomRequest(BaseModel):
    mood: str
    philosophy: str

    @field_validator("mood", "philosophy")
    @classmethod
    def validate_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

    @field_validator("mood")
    @classmethod
    def validate_mood_length(cls, v: str) -> str:
        if len(v) > 50:
            raise ValueError("Mood value too long")
        return v

    @field_validator("philosophy")
    @classmethod
    def validate_philosophy_length(cls, v: str) -> str:
        if len(v) > 50:
            raise ValueError("Philosophy value too long")
        return v

class WisdomResponse(BaseModel):
    id: str = ""
    mood: str
    philosophy: str
    wisdom: str
    sources: dict

MOODS = {
    "sad": "😔 Sad",
    "anxious": "😨 Anxious",
    "lazy": "😴 Lazy",
    "angry": "😡 Angry",
    "stressed": "😰 Stressed",
    "confident": "😎 Confident"
}

PHILOSOPHIES = [
    "Stoicism",
    "Buddhism",
    "Samurai Code",
    "Discipline",
    "Modern Success",
    "Growth Mindset"
]

@app.get("/")
@limiter.limit("100/minute")
async def root(request: Request):
    return {"message": "MoodMentor API is running", "version": "1.0.0"}

@app.get("/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    from services.gemini_service import gemini_service
    from services.http_client import get_client

    deps = {}

    try:
        if gemini_service.model is not None:
            deps["gemini"] = "configured"
        else:
            deps["gemini"] = "unavailable"
    except Exception:
        deps["gemini"] = "unavailable"

    try:
        client = get_client()
        deps["http_client"] = "available"
    except Exception:
        deps["http_client"] = "unavailable"

    all_healthy = all(v in ("configured", "available") for v in deps.values())
    return {"status": "healthy" if all_healthy else "degraded", "dependencies": deps}

@app.get("/api/moods")
@limiter.limit("100/minute")
async def get_moods(request: Request, _: None = Depends(verify_api_key)):
    return MOODS

@app.get("/api/philosophies")
@limiter.limit("100/minute")
async def get_philosophies(request: Request, _: None = Depends(verify_api_key)):
    return PHILOSOPHIES

@app.post("/api/generate-wisdom", response_model=WisdomResponse)
@limiter.limit("20/minute")
async def generate_wisdom(request: Request, wisdom_request: WisdomRequest, _: None = Depends(verify_api_key)):
    if wisdom_request.mood not in MOODS:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "VALIDATION_ERROR", "message": "Invalid mood", "details": f"Mood must be one of: {', '.join(MOODS.keys())}"}}
        )
    if wisdom_request.philosophy not in PHILOSOPHIES:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "VALIDATION_ERROR", "message": "Invalid philosophy", "details": f"Philosophy must be one of: {', '.join(PHILOSOPHIES)}"}}
        )

    try:
        news_task = news_service.get_todays_news()
        events_task = history_service.get_historical_events()
        story_task = history_service.get_inspirational_story()
        philosophy_task = philosophy_service.get_summary(wisdom_request.philosophy)

        news, historical_events, inspirational_story, philosophy_info = await asyncio.gather(
            news_task, events_task, story_task, philosophy_task
        )

        wisdom = await gemini_service.generate_wisdom(
            mood=wisdom_request.mood,
            philosophy=wisdom_request.philosophy,
            philosophy_summary=philosophy_info["summary"],
            news=news,
            historical_events=historical_events,
            inspirational_story=inspirational_story,
        )

        sources = {
            "philosophy": philosophy_info,
            "news": news,
            "historical_events": historical_events,
            "inspirational_story": inspirational_story,
        }

        history_id = ""
        try:
            history_id = await save_wisdom_history(
                mood=wisdom_request.mood,
                philosophy=wisdom_request.philosophy,
                wisdom_text=wisdom,
                sources=sources,
            )
        except Exception as e:
            logger.warning("Failed to save wisdom history", extra={"error": str(e)})

        response = WisdomResponse(
            id=history_id,
            mood=wisdom_request.mood,
            philosophy=wisdom_request.philosophy,
            wisdom=wisdom,
            sources=sources,
        )

        return response
    except MoodMentorError:
        raise
    except Exception as e:
        logger.error(f"Failed to generate wisdom: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "Failed to generate wisdom. Please try again.", "details": str(e)}}
        )

@app.get("/api/history")
@limiter.limit("30/minute")
async def list_history(request: Request, _: None = Depends(verify_api_key)):
    entries = await get_wisdom_history()
    return entries


@app.delete("/api/history/{entry_id}")
@limiter.limit("30/minute")
async def delete_history(request: Request, entry_id: str, _: None = Depends(verify_api_key)):
    deleted = await delete_wisdom_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="History entry not found")
    return {"ok": True}


@app.delete("/api/history")
@limiter.limit("10/minute")
async def clear_history(request: Request, _: None = Depends(verify_api_key)):
    total = await clear_all_history()
    return {"ok": True, "deleted": total}


@app.post("/api/favorites")
@limiter.limit("30/minute")
async def create_favorite(request: Request, body: dict, _: None = Depends(verify_api_key)):
    required = ["wisdom_id", "mood", "philosophy", "wisdom_text"]
    for field in required:
        if field not in body:
            raise HTTPException(status_code=422, detail=f"Missing field: {field}")
    fav_id = await add_favorite(
        wisdom_id=body["wisdom_id"],
        mood=body["mood"],
        philosophy=body["philosophy"],
        wisdom_text=body["wisdom_text"],
    )
    if fav_id is None:
        raise HTTPException(status_code=409, detail="Already favorited")
    return {"id": fav_id, "ok": True}


@app.get("/api/favorites")
@limiter.limit("30/minute")
async def list_favorites(request: Request, _: None = Depends(verify_api_key)):
    return await get_favorites()


@app.get("/api/favorites/check")
@limiter.limit("30/minute")
async def check_favorite_endpoint(request: Request, wisdom_id: str, _: None = Depends(verify_api_key)):
    result = await check_favorite(wisdom_id)
    if result:
        return {"favorited": True, "id": result["id"], "wisdom_id": result["wisdom_id"]}
    return {"favorited": False}


@app.delete("/api/favorites")
@limiter.limit("30/minute")
async def remove_favorite_endpoint(request: Request, wisdom_id: str, _: None = Depends(verify_api_key)):
    deleted = await remove_favorite(wisdom_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"ok": True}


@app.post("/api/feedback")
@limiter.limit("30/minute")
async def submit_feedback(request: Request, body: dict, _: None = Depends(verify_api_key)):
    rating = body.get("rating")
    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
        raise HTTPException(status_code=422, detail="Rating must be an integer between 1 and 5")
    feedback_id = await save_user_feedback(
        wisdom_id=body.get("wisdom_id"),
        mood=body.get("mood", ""),
        philosophy=body.get("philosophy", ""),
        rating=rating,
        comment=body.get("comment"),
    )
    return {"id": feedback_id, "ok": True}


if __name__ == "__main__":
    import uvicorn
    import asyncio
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "9000"))
    uvicorn.run(app, host=host, port=port)