import httpx
from datetime import datetime, timezone

from celery_worker import celery_app
from sqlalchemy.orm import Session

from app.db.session import SyncSessionLocal
from app.models.ping_log import PingLog
from app.models.monitor import Monitor
from app.tasks.alerts import send_alert_email

from app.services.alert_service import send_alert_email


@celery_app.task(bind=True, max_retries=3)
def ping_url(self, monitor_id: str, url: str):
    with SyncSessionLocal() as db:
        start = datetime.now(timezone.utc)
        is_up = False
        status_code = None
        response_ms = None
        error_message = None

        try:
            # Use sync httpx client
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                response = client.get(url)
                status_code = response.status_code
                is_up = 200 <= status_code < 400
                response_ms = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)
        except Exception as e:
            error_message = str(e)
            is_up = False

        # Write PingLog
        ping_log = PingLog(
            monitor_id=monitor_id,
            status_code=status_code,
            response_ms=response_ms,
            is_up=is_up,
            error_message=error_message,
        )
        db.add(ping_log)
        db.flush()

        # Update monitor alert state
        monitor = db.get(Monitor, monitor_id)
        if monitor:
            if not is_up and monitor.alert_status == "UP":
                monitor.alert_status = "DOWN"
                monitor.last_alerted_at = datetime.now(timezone.utc)
                db.commit()
                # Get user email from relationship
                user_email = monitor.user.email if monitor.user else "admin@example.com"
                send_alert_email.delay(str(monitor.id), str(monitor.url), user_email, "DOWN")
            elif is_up and monitor.alert_status == "DOWN":
                monitor.alert_status = "UP"
                db.commit()
                user_email = monitor.user.email if monitor.user else "admin@example.com"
                send_alert_email.delay(str(monitor.id), str(monitor.url), user_email, "UP")
            else:
                db.commit()
        else:
            db.commit()