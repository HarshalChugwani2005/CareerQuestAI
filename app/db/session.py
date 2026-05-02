from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# Ensure the URL uses the asyncpg driver and clean up incompatible params
_db_url = settings.database_url
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Clean up the URL (strip all query params)
if "?" in _db_url:
    _db_url = _db_url.split("?", 1)[0]

# Pass SSL requirement directly as a connection argument
engine: AsyncEngine = create_async_engine(
    _db_url, 
    echo=False, 
    future=True,
    connect_args={"ssl": "require"}
)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        yield session
