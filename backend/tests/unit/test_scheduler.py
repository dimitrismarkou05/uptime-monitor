import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
from uuid import uuid4

from app.tasks.scheduler import dispatch_checks
from app.models.monitor import Monitor


@pytest.mark.unit
class TestDispatchChecks:
    @patch("app.tasks.scheduler.ping_url")
    @patch("app.tasks.scheduler.SyncSessionLocal")
    def test_dispatches_due_monitors(self, mock_session_cls, mock_ping):
        mock_db = MagicMock()
        mock_db.__enter__.return_value = mock_db
        mock_session_cls.return_value = mock_db

        monitor = Monitor(
            id=uuid4(),
            url="https://example.com",
            interval_seconds=300,
            is_active=True,
            next_check_at=datetime.now(timezone.utc) - timedelta(minutes=5),
        )

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [monitor]
        mock_db.execute.return_value = mock_result

        dispatch_checks.run()

        mock_ping.delay.assert_called_once_with(str(monitor.id), str(monitor.url))
        # Scheduler now commits to release SELECT FOR UPDATE row locks
        mock_db.commit.assert_called_once()

    @patch("app.tasks.scheduler.ping_url")
    @patch("app.tasks.scheduler.SyncSessionLocal")
    def test_no_dispatch_when_not_due(self, mock_session_cls, mock_ping):
        mock_db = MagicMock()
        mock_db.__enter__.return_value = mock_db
        mock_session_cls.return_value = mock_db

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []  # no due monitors
        mock_db.execute.return_value = mock_result

        dispatch_checks.run()

        mock_ping.delay.assert_not_called()
        mock_db.commit.assert_not_called()