import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from unittest.mock import Mock, MagicMock  # Added MagicMock

from app.services.monitor_service import MonitorService
from app.schemas.monitor import MonitorCreate, MonitorUpdate


@pytest.mark.integration
@pytest.mark.asyncio
class TestMonitorService:
    async def test_create_monitor(self, db_session, sample_user_data):
        from app.models.user import User
        user = User(**sample_user_data)
        db_session.add(user)
        await db_session.commit()

        service = MonitorService(db_session)
        data = MonitorCreate(url="https://new.com", interval_seconds=300, is_active=True)
        monitor = await service.create(sample_user_data["id"], data)

        assert str(monitor.url) == "https://new.com/"
        assert monitor.interval_seconds == 300
        assert monitor.user_id == sample_user_data["id"]

    async def test_list_by_user_pagination(self, db_session, sample_user_data):
        from app.models.user import User
        from app.models.monitor import Monitor
        user = User(**sample_user_data)
        db_session.add(user)
        await db_session.commit()

        service = MonitorService(db_session)
        for i in range(5):
            m = Monitor(
                id=uuid4(),
                url=f"https://site{i}.com",
                interval_seconds=300,
                user_id=sample_user_data["id"],
            )
            db_session.add(m)
        await db_session.commit()

        all_monitors = await service.list_by_user(sample_user_data["id"], limit=10)
        assert len(all_monitors) == 5

        paginated = await service.list_by_user(sample_user_data["id"], skip=2, limit=2)
        assert len(paginated) == 2

    async def test_get_by_id(self, db_session, sample_user_data):
        from app.models.user import User
        from app.models.monitor import Monitor
        user = User(**sample_user_data)
        db_session.add(user)
        await db_session.commit()

        monitor = Monitor(
            id=uuid4(),
            url="https://test.com",
            interval_seconds=300,
            user_id=sample_user_data["id"],
        )
        db_session.add(monitor)
        await db_session.commit()

        service = MonitorService(db_session)
        found = await service.get_by_id(str(monitor.id), sample_user_data["id"])
        assert found is not None
        assert found.id == monitor.id

        not_found = await service.get_by_id(str(uuid4()), sample_user_data["id"])
        assert not_found is None

    async def test_update_monitor(self, db_session, sample_user_data):
        from app.models.user import User
        from app.models.monitor import Monitor
        user = User(**sample_user_data)
        db_session.add(user)
        await db_session.commit()

        monitor = Monitor(
            id=uuid4(),
            url="https://test.com",
            interval_seconds=300,
            user_id=sample_user_data["id"],
        )
        db_session.add(monitor)
        await db_session.commit()

        service = MonitorService(db_session)
        updated = await service.update(monitor, MonitorUpdate(interval_seconds=600))
        assert updated.interval_seconds == 600

    async def test_toggle_active(self, db_session, sample_user_data):
        from app.models.user import User
        from app.models.monitor import Monitor
        user = User(**sample_user_data)
        db_session.add(user)
        await db_session.commit()

        monitor = Monitor(
            id=uuid4(),
            url="https://test.com",
            interval_seconds=300,
            is_active=True,
            user_id=sample_user_data["id"],
        )
        db_session.add(monitor)
        await db_session.commit()

        service = MonitorService(db_session)
        toggled = await service.toggle_active(str(monitor.id), sample_user_data["id"])
        assert toggled.is_active is False

        toggled_again = await service.toggle_active(str(monitor.id), sample_user_data["id"])
        assert toggled_again.is_active is True
 
    async def test_toggle_active_not_found(self, db_session, sample_user_data):
        from app.models.user import User

        user = User(**sample_user_data)
        db_session.add(user)
        await db_session.commit()

        service = MonitorService(db_session)
        result = await service.toggle_active(str(uuid4()), sample_user_data["id"])
        assert result is None

@pytest.mark.unit
class TestMonitorServiceSync:
    def test_get_due_monitors(self):
        db = MagicMock()
        service = MonitorService(db)

        now = datetime.now(timezone.utc)
        due_monitor = Mock(
            id=uuid4(),
            is_active=True,
            next_check_at=now - timedelta(minutes=5),
        )
        future_monitor = Mock(
            id=uuid4(),
            is_active=True,
            next_check_at=now + timedelta(minutes=5),
        )
        inactive_monitor = Mock(
            id=uuid4(),
            is_active=False,
            next_check_at=now - timedelta(minutes=5),
        )

        result = MagicMock()
        result.scalars.return_value.all.return_value = [due_monitor]
        db.execute.return_value = result

        due = service.get_due_monitors_sync(db, now)
        assert len(due) == 1
        assert due[0].id == due_monitor.id

    def test_update_next_check(self):
        db = MagicMock()
        service = MonitorService(db)
        monitor = Mock(next_check_at=None, interval_seconds=300)  # ADD interval_seconds
        now = datetime.now(timezone.utc)

        service.update_next_check_sync(monitor, now)
        assert monitor.next_check_at is not None
        assert monitor.next_check_at > now
        assert monitor.next_check_at == now + timedelta(seconds=300)  # verify exact value
        
    def test_update_next_check_defaults_to_now(self):
        db = MagicMock()
        service = MonitorService(db)
        monitor = Mock(next_check_at=None, interval_seconds=300)

        service.update_next_check_sync(monitor)
        assert monitor.next_check_at is not None