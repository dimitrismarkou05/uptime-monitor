import pytest
from unittest.mock import Mock, patch, MagicMock


@pytest.mark.unit
class TestCeleryTasks:
    @patch("app.services.ping_service.httpx.Client")
    @patch("app.tasks.ping.AlertService")
    def test_ping_url_success(self, mock_alert_service_class, mock_client_class):
        from app.tasks.ping import ping_url
        from uuid import uuid4

        mock_response = Mock()
        mock_response.status_code = 200
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.get.return_value = mock_response
        mock_client_class.return_value = mock_client

        mock_alert_service = MagicMock()
        mock_alert_service.process_ping_result.return_value = None
        mock_alert_service_class.return_value = mock_alert_service

        with patch("app.tasks.ping.SyncSessionLocal") as mock_session:
            mock_db = MagicMock()
            mock_db.__enter__.return_value = mock_db
            mock_session.return_value = mock_db

            result = ping_url.run(str(uuid4()), "https://example.com")

            assert result["is_up"] is True
            assert result["status_code"] == 200
            mock_alert_service.process_ping_result.assert_called_once()

    @patch("app.tasks.alerts.send_alert_email")
    def test_send_alert_email_task(self, mock_send):
        from app.tasks.alerts import send_alert_email_task
        from uuid import uuid4

        mock_send.return_value = True
        result = send_alert_email_task.run(
            str(uuid4()), "https://down-site.com", "admin@example.com", "DOWN"
        )
        assert result is True
        mock_send.assert_called_once()