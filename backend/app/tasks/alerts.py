import smtplib
from email.mime.text import MIMEText

from celery_worker import celery_app
from app.core.config import settings


@celery_app.task
def send_alert_email(monitor_id: str, url: str):
    msg = MIMEText(f"ALERT: {url} is DOWN.\nMonitor ID: {monitor_id}")
    msg["Subject"] = f"[ALERT] {url} is down"
    msg["From"] = settings.from_email
    msg["To"] = "admin@example.com"  # Replace with user's email later

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_user and settings.smtp_pass:
                server.login(settings.smtp_user, settings.smtp_pass)
            server.send_message(msg)
        print(f"Alert sent for {url}")
    except Exception as e:
        print(f"Failed to send alert: {e}")