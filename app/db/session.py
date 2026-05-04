from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# Ensure the URL uses the asyncpg driver and normalize SSL handling.
_db_url = settings.database_url
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

parsed = urlparse(_db_url)
query_params = dict(parse_qsl(parsed.query, keep_blank_values=True))
sslmode = query_params.pop("sslmode", None)
ssl_flag = query_params.pop("ssl", None)
# channel_binding is not supported by all asyncpg/sqlalchemy versions
query_params.pop("channel_binding", None)

connect_args: dict[str, str] = {}
if sslmode and sslmode.lower() in {"require", "verify-ca", "verify-full"}:
    connect_args["ssl"] = "require"
if ssl_flag and ssl_flag.lower() in {"1", "true", "require"}:
    connect_args["ssl"] = "require"
if settings.app_env.lower() in {"production", "staging"}:
    connect_args["ssl"] = "require"

_db_url = urlunparse(parsed._replace(query=urlencode(query_params)))

import logging
import asyncio

logger = logging.getLogger(__name__)

engine_kwargs = {"echo": False, "future": True}
if connect_args:
    engine_kwargs["connect_args"] = connect_args

try:
    engine: AsyncEngine = create_async_engine(_db_url, **engine_kwargs)
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    # Test connection? No, that's done later.
except Exception as e:
    logger.error(f"Failed to create primary database engine: {e}. Falling back to SQLite.")
    engine = create_async_engine("sqlite+aiosqlite:///./ravi.db", future=True)
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_db() -> AsyncSession:
    session_yielded = False
    try:
        async with async_session_factory() as session:
            # Test the connection with a simple query
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
            session_yielded = True
            yield session
    except Exception as e:
        if session_yielded:
            # The exception occurred inside the route that used this session.
            # We must re-raise it so FastAPI can handle the error (e.g. 409, 422).
            raise
            
        logger.error(f"Primary database connection failed: {e}. Switching to local SQLite.")
        # Re-initialize for SQLite fallback
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
        sqlite_engine = create_async_engine("sqlite+aiosqlite:///./ravi.db", future=True)
        new_factory = async_sessionmaker(sqlite_engine, expire_on_commit=False, class_=AsyncSession)
        
        # Ensure tables exist in SQLite
        from app.db.base import Base
        import app.models
        async with sqlite_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
        async with new_factory() as session:
            yield session
