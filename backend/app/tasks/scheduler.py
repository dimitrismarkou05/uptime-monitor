from datetime import datetime, timezone

from celery_worker import celery_app
from app.db.session import SyncSessionLocal
from app.services.monitor_service import MonitorService
from app.tasks.ping import ping_url


@celery_app.task
def dispatch_checks():
    with SyncSessionLocal() as db:
        service = MonitorService(db)
        now = datetime.now(timezone.utc)
        monitors = service.get_due_monitors_sync(db, now)

        for monitor in monitors:
            ping_url.delay(str(monitor.id), str(monitor.url))
            service.update_next_check_sync(monitor, now)

        db.commit()
        return {"dispatched": len(monitors), "monitors": [str(m.id) for m in monitors]}