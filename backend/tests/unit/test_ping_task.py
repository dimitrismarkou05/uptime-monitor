import pytest
from unittest.mock import patch, MagicMock
from uuid import uuid4

from app.tasks.ping import ping_url


@pytest.mark.unit
class TestPingTask:
    @patch("app.tasks.ping.SyncSessionLocal")
    @patch("app.tasks.ping.AlertService")
    @patch("app.tasks.ping.PingService")
    @patch("app.tasks.ping.MonitorService")
    def test_ping_url_success(
        self, mock_mon_svc, mock_ping_svc, mock_alert_svc, mock_session
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

        mock_monitor = MagicMock()
        mock_monitor.interval_seconds = 300
        mock_db.get.return_value = mock_monitor

        monitor_id = str(uuid4())
        result = ping_url.run(monitor_id, "https://example.com")

        assert result["is_up"] is True
        mock_ping.process_monitor_check.assert_called_once_with(
            monitor_id, "https://example.com", mock_db
        )
        mock_db.commit.assert_called_once()