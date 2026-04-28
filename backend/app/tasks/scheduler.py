from datetime import datetime, timezone, timedelta

from celery_worker import celery_app
from sqlalchemy import select

from app.db.session import SyncSessionLocal
from app.models.monitor import Monitor
from app.tasks.ping import ping_url


@celery_app.task
def dispatch_checks():
    with SyncSessionLocal() as db:
        now = datetime.now(timezone.utc)
        result = db.execute(
            select(Monitor).where(
                Monitor.is_active == True,
                (Monitor.next_check_at <= now) | (Monitor.next_check_at.is_(None)),
            )
        )
        monitors = result.scalars().all()

        for monitor in monitors:
            ping_url.delay(str(monitor.id), str(monitor.url))
            monitor.next_check_at = now + timedelta(seconds=monitor.interval_seconds)
        
        db.commit()