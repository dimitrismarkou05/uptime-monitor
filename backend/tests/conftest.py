import pytest
import pytest_asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import delete

from app.db.base import Base
from app.models import User, Monitor, PingLog

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncSession:
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        yield session
        # Clean up after each test
        await session.rollback()  # Rollback any failed transactions first
        await session.execute(delete(PingLog))
        await session.execute(delete(Monitor))
        await session.execute(delete(User))
        await session.commit()


@pytest.fixture
def sample_user_data():
    return {
        "id": uuid4(),  #UUID object
        "email": "test@example.com",
        "supabase_uid": "supabase-test-uid-123",
    }


@pytest.fixture
def sample_monitor_data(sample_user_data):
    return {
        "url": "https://test.com",
        "interval_seconds": 300,
        "is_active": True,
        "user_id": sample_user_data["id"],  # UUID object
    }