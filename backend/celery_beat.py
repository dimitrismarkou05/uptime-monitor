from celery_worker import celery_app
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    "dispatch-due-monitors": {
        "task": "app.tasks.scheduler.dispatch_checks",
        "schedule": 60.0,  # Every 60 seconds
    },
}

celery_app.conf.timezone = "UTC"