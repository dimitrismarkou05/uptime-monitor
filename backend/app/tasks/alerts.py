from celery_worker import celery_app
from app.services.alert_service import send_alert_email


@celery_app.task
def send_alert_email_task(monitor_id: str, url: str, recipient: str, status: str):
    """Celery wrapper for sending alert emails."""
    return send_alert_email(monitor_id, url, recipient, status)