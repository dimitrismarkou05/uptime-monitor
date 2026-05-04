from datetime import datetime, timezone
from celery_worker import celery_app
from app.db.session import SyncSessionLocal
from app.services.ping_service import PingService
from app.services.alert_service import AlertService

@celery_app.task(bind=True, max_retries=3)
def ping_url(self, monitor_id: str, url: str):
    with SyncSessionLocal() as db:
        alert_service = AlertService(db)
        ping_service = PingService(alert_service)

        result = ping_service.process_monitor_check(monitor_id, url, db)

        # NOTE: next_check_at is now set by the scheduler at dispatch time,
        # not by the worker at completion time. This eliminates interval drift.

        return result