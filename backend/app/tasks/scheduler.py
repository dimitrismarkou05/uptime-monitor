from datetime import datetime, timezone

from celery_worker import celery_app
from app.db.session import SyncSessionLocal
from app.services.monitor_service import MonitorService
from app.tasks.ping import ping_url

def _align_to_beat(now: datetime, beat_interval: int = 60) -> datetime:
    """
    Round a datetime down to the nearest beat boundary.
    This ensures next_check_at always aligns to when the beat fires,
    preventing drift from Celery task queue lag.
    """
    timestamp = now.timestamp()
    aligned_timestamp = (timestamp // beat_interval) * beat_interval
    return datetime.fromtimestamp(aligned_timestamp, tz=timezone.utc)

@celery_app.task
def dispatch_checks():
    with SyncSessionLocal() as db:
        service = MonitorService(db)
        # Use aligned time so next_check_at always falls on a beat tick
        now = _align_to_beat(datetime.now(timezone.utc))
        monitors = service.get_due_monitors_sync(db, now)

        dispatched_ids = []
        for monitor in monitors:
            # Dispatch the check
            ping_url.delay(str(monitor.id), str(monitor.url))
            # Set next_check_at based on aligned time, not actual execution time
            # This prevents drift from queue lag
            service.update_next_check_sync(monitor, now)
            dispatched_ids.append(str(monitor.id))

        if monitors:
            db.commit()

        return {
            "dispatched": len(monitors),
            "monitors": dispatched_ids,
            "aligned_time": now.isoformat(),
        }