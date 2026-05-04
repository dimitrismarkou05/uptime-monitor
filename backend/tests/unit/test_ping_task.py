import pytest
from unittest.mock import patch, MagicMock
from uuid import uuid4

from app.tasks.ping import ping_url


@pytest.mark.unit
class TestPingTask:
    @patch("app.tasks.ping.SyncSessionLocal")
    @patch("app.tasks.ping.AlertService")
    @patch("app.tasks.ping.PingService")
    def test_ping_url_success(
        self, mock_ping_svc, mock_alert_svc, mock_session
    ):
        mock_db = MagicMock()
        mock_session.return_value.__enter__ = MagicMock(return_value=mock_db)
        mock_session.return_value.__exit__ = MagicMock(return_value=False)

        mock_ping = MagicMock()
        mock_ping.process_monitor_check.return_value = {
            "is_up": True,
            "status_code": 200,
        }
        mock_ping_svc.return_value = mock_ping

        monitor_id = str(uuid4())
        result = ping_url.run(monitor_id, "https://example.com")

        assert result["is_up"] is True
        mock_ping.process_monitor_check.assert_called_once_with(
            monitor_id, "https://example.com", mock_db
        )
        # next_check_at is now handled by the scheduler, not the ping task
        mock_db.commit.assert_not_called()