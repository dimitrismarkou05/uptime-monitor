from datetime import datetime, timezone
from celery_worker import celery_app
from app.db.session import SyncSessionLocal
from app.services.ping_service import PingService
from app.services.alert_service import AlertService
from app.services.monitor_service import MonitorService
from app.models.monitor import Monitor

@celery_app.task(bind=True, max_retries=3)
def ping_url(self, monitor_id: str, url: str):
    with SyncSessionLocal() as db:
        alert_service = AlertService(db)
        ping_service = PingService(alert_service)
        monitor_service = MonitorService(db)
        
        result = ping_service.process_monitor_check(monitor_id, url, db)
        
        # Post-execution update to ensure accurate scheduling
        monitor = db.get(Monitor, monitor_id)
        if monitor:
            now = datetime.now(timezone.utc)
            monitor_service.update_next_check_sync(monitor, now)
            db.commit()
            
        return result