import smtplib
import logging
from email.mime.text import MIMEText
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.monitor import Monitor

logger = logging.getLogger(__name__)

class AlertService:
    """Handles alert state transitions and email dispatching."""

    def __init__(self, db: Session):
        self.db = db

    def should_alert(self, monitor: Monitor, is_up: bool) -> Optional[str]:
        """
        Determine if an alert should be sent based on state transition.
        Returns the new alert_status if an alert should fire, else None.
        """
        if not is_up and monitor.alert_status == "UP":
            return "DOWN"
        elif is_up and monitor.alert_status == "DOWN":
            return "UP"
        return None

    def update_monitor_state(self, monitor: Monitor, new_status: str) -> None:
        """Update monitor alert state and timestamp."""
        monitor.alert_status = new_status
        monitor.last_alerted_at = datetime.now(timezone.utc)
        self.db.commit()

    def send_email(
        self,
        monitor_id: str,
        url: str,
        recipient: str,
        status: str,
    ) -> bool:
        """Send alert email via SMTP. Returns success boolean."""
        subject = f"[ALERT] {url} is {status}"
        body = (
            f"Monitor Alert\n"
            f"URL: {url}\n"
            f"Status: {status}\n"
            f"Monitor ID: {monitor_id}\n"
            f"Time: {datetime.now(timezone.utc).isoformat()}"
        )

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = settings.from_email
        msg["To"] = recipient

        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                if settings.smtp_user and settings.smtp_pass:
                    server.login(settings.smtp_user, settings.smtp_pass)
                server.send_message(msg)
            return True
        except Exception as e:
            # Log structured error instead of a silent print
            logger.error(f"[AlertService] Failed to send email for monitor {monitor_id}: {e}", exc_info=True)
            return False

    def get_recipient(self, monitor: Monitor) -> str:
        """Get alert recipient email for a monitor."""
        if monitor.user and monitor.user.email:
            return monitor.user.email
        return "admin@example.com"

    def process_ping_result(
        self,
        monitor_id: str,
        is_up: bool,
        status_code: Optional[int],
        response_ms: Optional[int],
        error_message: Optional[str],
    ) -> Optional[str]:
        """
        Full pipeline: record ping, check state transition, send alert if needed.
        Returns the alert status sent (UP/DOWN) or None.
        """
        from app.models.ping_log import PingLog

        # Record the ping
        ping = PingLog(
            monitor_id=monitor_id,
            status_code=status_code,
            response_ms=response_ms,
            is_up=is_up,
            error_message=error_message,
        )
        self.db.add(ping)
        self.db.flush()

        # Get monitor with user relationship
        monitor = self.db.get(Monitor, monitor_id)
        if not monitor:
            self.db.commit()
            return None

        new_status = self.should_alert(monitor, is_up)
        if new_status:
            self.update_monitor_state(monitor, new_status)
            recipient = self.get_recipient(monitor)
            self.send_email(
                str(monitor.id),
                str(monitor.url),
                recipient,
                new_status,
            )
            return new_status
        else:
            self.db.commit()
            return None

def send_alert_email(monitor_id: str, url: str, recipient: str, status: str) -> bool:
    """
    Standalone function for Celery tasks.
    Creates a temporary session and sends email.
    """
    from app.db.session import SyncSessionLocal

    with SyncSessionLocal() as db:
        service = AlertService(db)
        return service.send_email(monitor_id, url, recipient, status)