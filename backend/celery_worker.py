from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "uptime_monitor",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.scheduler", "app.tasks.ping", "app.tasks.alerts"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30,
    worker_prefetch_multiplier=1,
)