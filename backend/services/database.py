import os
import json
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator, CHAR
import uuid
from datetime import datetime

from services.logging_config import get_logger
from typing import Optional

logger = get_logger("moodmentor.database")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./moodmentor.db"
)

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)


class GUID(TypeDecorator):
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=False))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(uuid.UUID(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return uuid.UUID(value)


engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class WisdomHistory(Base):
    __tablename__ = "wisdom_history"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    mood = Column(String(50), nullable=False)
    philosophy = Column(String(50), nullable=False)
    wisdom_text = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class UserFeedback(Base):
    __tablename__ = "user_feedback"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    wisdom_id = Column(GUID(), nullable=True)
    mood = Column(String(50), nullable=False)
    philosophy = Column(String(50), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    wisdom_id = Column(GUID(), nullable=False, unique=True)
    mood = Column(String(50), nullable=False)
    philosophy = Column(String(50), nullable=False)
    wisdom_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized", extra={"tables": ["wisdom_history", "user_feedback"]})


async def close_db() -> None:
    await engine.dispose()
    logger.info("Database connections closed")


@asynccontextmanager
async def get_db_session():
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def save_wisdom_history(
    mood: str,
    philosophy: str,
    wisdom_text: str,
    sources: dict,
) -> str:
    async with get_db_session() as session:
        record = WisdomHistory(
            mood=mood,
            philosophy=philosophy,
            wisdom_text=wisdom_text,
            sources=json.dumps(sources) if sources else None,
        )
        session.add(record)
        await session.flush()
        return str(record.id)


async def save_user_feedback(
    wisdom_id: str | None,
    mood: str,
    philosophy: str,
    rating: int,
    comment: str | None = None,
) -> str:
    async with get_db_session() as session:
        record = UserFeedback(
            wisdom_id=uuid.UUID(wisdom_id) if wisdom_id else None,
            mood=mood,
            philosophy=philosophy,
            rating=rating,
            comment=comment,
        )
        session.add(record)
        await session.flush()
        return str(record.id)


async def get_wisdom_history(limit: int = 50, offset: int = 0) -> list[dict]:
    async with get_db_session() as session:
        from sqlalchemy import select, desc
        stmt = (
            select(WisdomHistory)
            .order_by(desc(WisdomHistory.created_at))
            .offset(offset)
            .limit(limit)
        )
        result = await session.execute(stmt)
        rows = result.scalars().all()
        return [
            {
                "id": str(r.id),
                "mood": r.mood,
                "philosophy": r.philosophy,
                "wisdom_text": r.wisdom_text,
                "sources": json.loads(r.sources) if r.sources else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]


async def delete_wisdom_entry(entry_id: str) -> bool:
    async with get_db_session() as session:
        from sqlalchemy import select
        stmt = select(WisdomHistory).where(WisdomHistory.id == uuid.UUID(entry_id))
        result = await session.execute(stmt)
        record = result.scalar_one_or_none()
        if not record:
            return False
        await session.delete(record)
        return True


async def clear_all_history() -> int:
    async with get_db_session() as session:
        from sqlalchemy import delete, select, func
        count_result = await session.execute(select(func.count()).select_from(WisdomHistory))
        total = count_result.scalar() or 0
        await session.execute(delete(WisdomHistory))
        return total


async def add_favorite(wisdom_id: str, mood: str, philosophy: str, wisdom_text: str) -> str | None:
    async with get_db_session() as session:
        from sqlalchemy import select
        existing = await session.execute(
            select(Favorite).where(Favorite.wisdom_id == uuid.UUID(wisdom_id))
        )
        if existing.scalar_one_or_none():
            return None
        record = Favorite(
            wisdom_id=uuid.UUID(wisdom_id),
            mood=mood,
            philosophy=philosophy,
            wisdom_text=wisdom_text,
        )
        session.add(record)
        await session.flush()
        return str(record.id)


async def remove_favorite(wisdom_id: str) -> bool:
    async with get_db_session() as session:
        from sqlalchemy import select
        stmt = select(Favorite).where(Favorite.wisdom_id == uuid.UUID(wisdom_id))
        result = await session.execute(stmt)
        record = result.scalar_one_or_none()
        if not record:
            return False
        await session.delete(record)
        return True


async def get_favorites() -> list[dict]:
    async with get_db_session() as session:
        from sqlalchemy import select, desc
        stmt = select(Favorite).order_by(desc(Favorite.created_at))
        result = await session.execute(stmt)
        rows = result.scalars().all()
        return [
            {
                "id": str(r.id),
                "wisdom_id": str(r.wisdom_id),
                "mood": r.mood,
                "philosophy": r.philosophy,
                "wisdom_text": r.wisdom_text,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]


async def check_favorite(wisdom_id: str) -> dict | None:
    async with get_db_session() as session:
        from sqlalchemy import select
        stmt = select(Favorite).where(Favorite.wisdom_id == uuid.UUID(wisdom_id))
        result = await session.execute(stmt)
        record = result.scalar_one_or_none()
        if not record:
            return None
        return {
            "id": str(record.id),
            "wisdom_id": str(record.wisdom_id),
            "mood": record.mood,
            "philosophy": record.philosophy,
            "wisdom_text": record.wisdom_text,
            "created_at": record.created_at.isoformat() if record.created_at else None,
        }