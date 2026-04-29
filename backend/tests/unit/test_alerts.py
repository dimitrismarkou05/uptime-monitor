import pytest
from unittest.mock import Mock, patch
from app.tasks.alerts import send_alert_email_task


@pytest.mark.unit
class TestSendAlertEmail:
    @patch("app.services.alert_service.smtplib.SMTP")
    def test_send_down_alert(self, mock_smtp):
        mock_server = Mock()
        mock_smtp.return_value.__enter__ = Mock(return_value=mock_server)
        mock_smtp.return_value.__exit__ = Mock(return_value=False)

        result = send_alert_email_task.run("mon-123", "https://example.com", "admin@example.com", "DOWN")

        mock_server.send_message.assert_called_once()
        msg = mock_server.send_message.call_args[0][0]
        assert msg["To"] == "admin@example.com"
        assert "DOWN" in msg["Subject"]
        assert result is True

    @patch("app.services.alert_service.smtplib.SMTP")
    def test_send_up_alert(self, mock_smtp):
        mock_server = Mock()
        mock_smtp.return_value.__enter__ = Mock(return_value=mock_server)
        mock_smtp.return_value.__exit__ = Mock(return_value=False)

        result = send_alert_email_task.run("mon-123", "https://example.com", "admin@example.com", "UP")

        msg = mock_server.send_message.call_args[0][0]
        assert "UP" in msg["Subject"]
        assert result is True