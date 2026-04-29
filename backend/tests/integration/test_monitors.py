import pytest
from uuid import uuid4

from app.models.monitor import Monitor
from app.models.user import User


@pytest.mark.integration
@pytest.mark.asyncio
class TestMonitorCRUD:
    async def test_create_monitor(self, db_session, sample_user_data):
        user = User(**sample_user_data)
        db_session.add(user)
        await db_session.commit()

        monitor = Monitor(
            id=uuid4(),  # UUID object
            url="https://test.com",
            interval_seconds=300,
            user_id=sample_user_data["id"],
        )
        db_session.add(monitor)
        await db_session.commit()

        result = await db_session.get(Monitor, monitor.id)
        assert result is not None
        assert str(result.url) == "https://test.com"
        assert result.alert_status == "UP"

    async def test_monitor_user_relationship(self, db_session, sample_user_data):
        user = User(**sample_user_data)
        db_session.add(user)
        await db_session.commit()

        monitor = Monitor(
            id=uuid4(),
            url="https://test.com",
            user_id=sample_user_data["id"],
        )
        db_session.add(monitor)
        await db_session.commit()
        await db_session.refresh(monitor)

        assert monitor.user.email == "test@example.com"

    async def test_cascade_delete(self, db_session, sample_user_data):
        user = User(**sample_user_data)
        db_session.add(user)
        await db_session.commit()

        monitor = Monitor(
            id=uuid4(),
            url="https://test.com",
            user_id=sample_user_data["id"],
        )
        db_session.add(monitor)
        await db_session.commit()

        await db_session.delete(user)
        await db_session.commit()

        result = await db_session.get(Monitor, monitor.id)
        assert result is None