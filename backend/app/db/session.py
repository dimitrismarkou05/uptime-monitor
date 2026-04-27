from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings

# Async engine for FastAPI
async_engine = create_async_engine(settings.database_url, echo=True)
AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)

# Sync engine for Celery workers
sync_engine = create_engine(settings.sync_database_url, echo=True)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session