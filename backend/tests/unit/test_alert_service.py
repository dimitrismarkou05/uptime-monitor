import pytest
from datetime import datetime, timezone
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4

from app.services.alert_service import AlertService
from app.models.monitor import Monitor
from app.models.user import User


@pytest.mark.unit
class TestAlertService:
    def test_should_alert_down_transition(self):
        db = MagicMock()
        service = AlertService(db)
        monitor = Mock(alert_status="UP")
        assert service.should_alert(monitor, False) == "DOWN"
        assert service.should_alert(monitor, True) is None

    def test_should_alert_up_transition(self):
        db = MagicMock()
        service = AlertService(db)
        monitor = Mock(alert_status="DOWN")
        assert service.should_alert(monitor, True) == "UP"
        assert service.should_alert(monitor, False) is None

    def test_should_alert_no_change(self):
        db = MagicMock()
        service = AlertService(db)
        monitor_up = Mock(alert_status="UP")
        monitor_down = Mock(alert_status="DOWN")
        assert service.should_alert(monitor_up, True) is None
        assert service.should_alert(monitor_down, False) is None

    @patch("app.services.alert_service.smtplib.SMTP")
    def test_send_email_success(self, mock_smtp):
        db = MagicMock()
        service = AlertService(db)
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__ = Mock(return_value=mock_server)
        mock_smtp.return_value.__exit__ = Mock(return_value=False)

        result = service.send_email("mon-123", "https://example.com", "user@test.com", "DOWN")
        assert result is True
        mock_server.send_message.assert_called_once()

    @patch("app.services.alert_service.smtplib.SMTP")
    def test_send_email_failure(self, mock_smtp):
        db = MagicMock()
        service = AlertService(db)
        mock_smtp.side_effect = Exception("SMTP error")

        result = service.send_email("mon-123", "https://example.com", "user@test.com", "DOWN")
        assert result is False

    def test_get_recipient_from_user(self):
        db = MagicMock()
        service = AlertService(db)
        user = Mock(email="user@test.com")
        monitor = Mock(user=user)
        assert service.get_recipient(monitor) == "user@test.com"

    def test_get_recipient_fallback(self):
        db = MagicMock()
        service = AlertService(db)
        monitor = Mock(user=None)
        assert service.get_recipient(monitor) == "admin@example.com"

    def test_process_ping_result_triggers_alert(self):
        db = MagicMock()
        service = AlertService(db)
        service.send_email = Mock(return_value=True)

        monitor = Mock(
            id=uuid4(),
            alert_status="UP",
            url="https://example.com",
            user=Mock(email="user@test.com"),
        )
        db.get.return_value = monitor

        result = service.process_ping_result(
            monitor_id=str(monitor.id),
            is_up=False,
            status_code=500,
            response_ms=None,
            error_message="Server Error",
        )

        assert result == "DOWN"
        assert monitor.alert_status == "DOWN"
        assert monitor.last_alerted_at is not None
        service.send_email.assert_called_once()

    def test_process_ping_result_no_alert(self):
        db = MagicMock()
        service = AlertService(db)
        service.send_email = Mock()

        monitor = Mock(
            id=uuid4(),
            alert_status="UP",
            url="https://example.com",
            user=Mock(email="user@test.com"),
        )
        db.get.return_value = monitor

        result = service.process_ping_result(
            monitor_id=str(monitor.id),
            is_up=True,
            status_code=200,
            response_ms=150,
            error_message=None,
        )

        assert result is None
        service.send_email.assert_not_called()
        
    @patch("app.services.alert_service.smtplib.SMTP")
    @patch("app.services.alert_service.settings")
    def test_send_email_with_smtp_auth(self, mock_settings, mock_smtp):
        mock_settings.smtp_user = "user"
        mock_settings.smtp_pass = "pass"
        mock_settings.smtp_host = "localhost"
        mock_settings.smtp_port = 1025
        mock_settings.from_email = "test@localhost"

        db = MagicMock()
        service = AlertService(db)
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__ = Mock(return_value=mock_server)
        mock_smtp.return_value.__exit__ = Mock(return_value=False)

        result = service.send_email(
            "mon-123", "https://example.com", "user@test.com", "DOWN"
        )
        assert result is True
        mock_server.login.assert_called_once_with("user", "pass")

    def test_process_ping_result_monitor_not_found(self):
        db = MagicMock()
        service = AlertService(db)
        db.get.return_value = None

        result = service.process_ping_result(
            monitor_id=str(uuid4()),
            is_up=True,
            status_code=200,
            response_ms=150,
            error_message=None,
        )
        assert result is None
        db.commit.assert_called_once()