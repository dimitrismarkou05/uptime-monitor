import pytest
from pydantic import ValidationError

from app.schemas.monitor import MonitorCreate, MonitorUpdate, MonitorRead
from app.schemas.user import UserRead


@pytest.mark.unit
class TestMonitorCreate:
    def test_valid_monitor(self):
        monitor = MonitorCreate(
            url="https://example.com",
            interval_seconds=300,
            is_active=True,
        )
        assert str(monitor.url) == "https://example.com/"
        assert monitor.interval_seconds == 300

    def test_invalid_url(self):
        with pytest.raises(ValidationError) as exc_info:
            MonitorCreate(url="not-a-url", interval_seconds=300)
        assert "url" in str(exc_info.value)

    def test_interval_too_low(self):
        with pytest.raises(ValidationError) as exc_info:
            MonitorCreate(url="https://example.com", interval_seconds=30)
        assert "interval_seconds" in str(exc_info.value)

    def test_interval_too_high(self):
        with pytest.raises(ValidationError) as exc_info:
            MonitorCreate(url="https://example.com", interval_seconds=100000)
        assert "interval_seconds" in str(exc_info.value)

    def test_default_interval(self):
        monitor = MonitorCreate(url="https://example.com")
        assert monitor.interval_seconds == 300
        assert monitor.is_active is True


@pytest.mark.unit
class TestMonitorUpdate:
    def test_partial_update(self):
        update = MonitorUpdate(is_active=False)
        assert update.is_active is False
        assert update.url is None

    def test_empty_update(self):
        update = MonitorUpdate()
        assert update.model_dump(exclude_unset=True) == {}


@pytest.mark.unit
class TestUserRead:
    def test_user_schema(self):
        from uuid import uuid4
        from datetime import datetime, timezone
        
        user = UserRead(
            id=uuid4(),
            email="test@example.com",
            created_at=datetime.now(timezone.utc),
        )
        assert user.email == "test@example.com"