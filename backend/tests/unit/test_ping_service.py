import pytest
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4

from app.services.ping_service import PingService
from app.services.alert_service import AlertService


@pytest.mark.unit
class TestPingService:
    @patch("app.services.ping_service.httpx.Client")
    def test_check_url_success(self, mock_client_class):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.get.return_value = mock_response
        mock_client_class.return_value = mock_client

        service = PingService()
        is_up, status_code, response_ms, error = service.check_url("https://example.com")

        assert is_up is True
        assert status_code == 200
        assert response_ms is not None
        assert error is None

    @patch("app.services.ping_service.httpx.Client")
    def test_check_url_404(self, mock_client_class):
        mock_response = Mock()
        mock_response.status_code = 404
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.get.return_value = mock_response
        mock_client_class.return_value = mock_client

        service = PingService()
        is_up, status_code, response_ms, error = service.check_url("https://example.com")

        assert is_up is False
        assert status_code == 404

    @patch("app.services.ping_service.httpx.Client")
    def test_check_url_timeout(self, mock_client_class):
        from httpx import TimeoutException
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.get.side_effect = TimeoutException("Timeout")
        mock_client_class.return_value = mock_client

        service = PingService()
        is_up, status_code, response_ms, error = service.check_url("https://example.com")

        assert is_up is False
        assert status_code is None
        assert "timed out" in error.lower()

    def test_process_monitor_check_with_alert_service(self):
        alert_service = Mock(spec=AlertService)
        alert_service.process_ping_result.return_value = "DOWN"

        db = MagicMock()
        service = PingService(alert_service)

        with patch.object(service, "check_url", return_value=(False, 500, None, "Error")):
            result = service.process_monitor_check("mon-123", "https://example.com", db)

        assert result["is_up"] is False
        assert result["alert_sent"] == "DOWN"
        alert_service.process_ping_result.assert_called_once()

    def test_process_monitor_check_without_alert_service(self):
        db = MagicMock()
        service = PingService()

        with patch.object(service, "check_url", return_value=(True, 200, 150, None)):
            result = service.process_monitor_check("mon-123", "https://example.com", db)

        assert result["is_up"] is True
        assert result["alert_sent"] is None
        db.add.assert_called_once()
        db.commit.assert_called_once()
        
    @patch("app.services.ping_service.httpx.Client")
    def test_check_url_connect_error(self, mock_client_class):
        from httpx import ConnectError

        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.get.side_effect = ConnectError("Connection failed")
        mock_client_class.return_value = mock_client

        service = PingService()
        is_up, status_code, response_ms, error = service.check_url(
            "https://example.com"
        )

        assert is_up is False
        assert status_code is None
        assert "connection failed" in error.lower()

    @patch("app.services.ping_service.httpx.Client")
    def test_check_url_generic_exception(self, mock_client_class):
        mock_client = MagicMock()
        mock_client.__enter__.return_value = mock_client
        mock_client.get.side_effect = RuntimeError("Unexpected boom")
        mock_client_class.return_value = mock_client

        service = PingService()
        is_up, status_code, response_ms, error = service.check_url(
            "https://example.com"
        )

        assert is_up is False
        assert status_code is None
        assert error == "Unexpected boom"