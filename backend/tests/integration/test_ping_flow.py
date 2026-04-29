import pytest
from datetime import datetime, timezone
from uuid import uuid4

from app.models.monitor import Monitor
from app.models.user import User
from app.models.ping_log import PingLog


@pytest.mark.integration
@pytest.mark.asyncio
class TestPingLog:
    async def test_create_ping_log(self, db_session, sample_user_data):
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

        ping = PingLog(
            id=uuid4(),
            monitor_id=monitor.id,
            status_code=200,
            response_ms=150,
            is_up=True,
        )
        db_session.add(ping)
        await db_session.commit()

        result = await db_session.get(PingLog, ping.id)
        assert result.status_code == 200
        assert result.response_ms == 150
        assert result.is_up is True

    async def test_ping_monitor_relationship(self, db_session, sample_user_data):
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

        ping = PingLog(
            id=uuid4(),
            monitor_id=monitor.id,
            is_up=False,
            error_message="Connection timeout",
        )
        db_session.add(ping)
        await db_session.commit()
        await db_session.refresh(ping)

        assert ping.monitor.url == "https://test.com"