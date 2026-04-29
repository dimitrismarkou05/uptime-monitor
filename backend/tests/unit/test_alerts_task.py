import pytest
from unittest.mock import patch
from app.tasks.alerts import send_alert_email_task


@pytest.mark.unit
class TestAlertsTask:
    @patch("app.tasks.alerts.send_alert_email")
    def test_task_delegates_to_service(self, mock_send):
        mock_send.return_value = True
        result = send_alert_email_task.run(
            "mon-1", "https://x.com", "a@b.com", "DOWN"
        )
        assert result is True
        mock_send.assert_called_once_with("mon-1", "https://x.com", "a@b.com", "DOWN")