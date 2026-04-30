import asyncio
import pytest
import pytest_asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import delete
from httpx import AsyncClient, ASGITransport

from app.db.base import Base
from app.models import User, Monitor, PingLog
from app.main import app
from app.api.deps import get_db, get_current_user

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
        await session.rollback()
        await session.execute(delete(PingLog))
        await session.execute(delete(Monitor))
        await session.execute(delete(User))
        await session.commit()


@pytest.fixture
def sample_user_data():
    return {
        "id": uuid4(),
        "email": "test@example.com",
        "supabase_uid": "supabase-test-uid-123",
    }


@pytest.fixture
def sample_monitor_data(sample_user_data):
    return {
        "url": "https://test.com",
        "interval_seconds": 300,
        "is_active": True,
        "user_id": sample_user_data["id"],
    }

@pytest.fixture
def token_headers():
    """Provides a dummy bearer token header for authenticated requests."""
    return {"Authorization": "Bearer fake-test-token"}

@pytest_asyncio.fixture
async def async_client(db_session):
    test_user_id = db_session.bind.url  # not used, just need stable id
    # Use a fixed UUID for the auth override
    from uuid import UUID
    fixed_user_id = UUID("12345678-1234-1234-1234-123456789abc")

    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return {
            "id": fixed_user_id,
            "email": "test@example.com",
            "supabase_uid": "supabase-test-uid-123",
        }

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()