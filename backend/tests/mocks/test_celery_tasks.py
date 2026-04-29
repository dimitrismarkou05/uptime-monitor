import pytest
from unittest.mock import Mock, patch, MagicMock


@pytest.mark.unit
class TestCeleryTasks:
    @patch("app.tasks.ping.httpx.Client")
    def test_ping_url_success(self, mock_client_class):
        from app.tasks.ping import ping_url
        from uuid import uuid4

        mock_response = Mock()
        mock_response.status_code = 200
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.get.return_value = mock_response
        mock_client_class.return_value = mock_client

        with patch("app.tasks.ping.SyncSessionLocal") as mock_session:
            mock_db = MagicMock()
            mock_db.__enter__.return_value = mock_db
            
            mock_monitor = Mock()
            mock_monitor.alert_status = "UP"
            mock_db.get.return_value = mock_monitor
            
            mock_session.return_value = mock_db

            # Run synchronously for test (bypass @celery_app.task)
            ping_url.run(str(uuid4()), "https://example.com")
            
            mock_db.add.assert_called_once()
            mock_db.commit.assert_called()

    @patch("app.tasks.alerts.smtplib.SMTP")
    def test_send_alert_email(self, mock_smtp_class):
        from app.tasks.alerts import send_alert_email
        from uuid import uuid4

        mock_server = MagicMock()
        mock_smtp_class.return_value = mock_server

        send_alert_email.run(str(uuid4()), "https://down-site.com")
        
        mock_server.__enter__.return_value.send_message.assert_called_once()