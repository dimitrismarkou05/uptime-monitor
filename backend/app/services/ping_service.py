import httpx
from datetime import datetime, timezone
from typing import Optional, Tuple

from app.services.alert_service import AlertService


class PingService:
    """Handles HTTP health checks and result processing."""

    DEFAULT_TIMEOUT = 10.0

    # Browser-like headers to avoid bot detection
    _HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": (
            "text/html,application/xhtml+xml,application/xml;"
            "q=0.9,image/avif,image/webp,*/*;q=0.8"
        ),
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
    }

    def __init__(self, alert_service: Optional[AlertService] = None):
        self.alert_service = alert_service

    def check_url(self, url: str) -> Tuple[bool, Optional[int], Optional[int], Optional[str]]:
        """
        Perform HTTP GET against URL.
        Returns: (is_up, status_code, response_ms, error_message)
        """
        start = datetime.now(timezone.utc)
        is_up = False
        status_code = None
        response_ms = None
        error_message = None

        try:
            with httpx.Client(
                timeout=self.DEFAULT_TIMEOUT,
                follow_redirects=True,
                headers=self._HEADERS,
            ) as client:
                response = client.get(url)
                status_code = response.status_code
                is_up = 200 <= status_code < 400
                response_ms = int(
                    (datetime.now(timezone.utc) - start).total_seconds() * 1000
                )
        except httpx.TimeoutException:
            error_message = "Request timed out"
            is_up = False
        except httpx.ConnectError:
            error_message = "Connection failed"
            is_up = False
        except Exception as e:
            error_message = str(e)
            is_up = False

        return is_up, status_code, response_ms, error_message

    def process_monitor_check(self, monitor_id: str, url: str, db) -> dict:
        """
        Full check pipeline: ping URL, record result, handle alerts.
        Returns result summary dict.
        """
        is_up, status_code, response_ms, error_message = self.check_url(url)

        if self.alert_service:
            alert_status = self.alert_service.process_ping_result(
                monitor_id=monitor_id,
                is_up=is_up,
                status_code=status_code,
                response_ms=response_ms,
                error_message=error_message,
            )
        else:
            # Fallback: just record ping without alerts
            from app.models.ping_log import PingLog
            ping = PingLog(
                monitor_id=monitor_id,
                status_code=status_code,
                response_ms=response_ms,
                is_up=is_up,
                error_message=error_message,
            )
            db.add(ping)
            db.commit()
            alert_status = None

        return {
            "monitor_id": monitor_id,
            "is_up": is_up,
            "status_code": status_code,
            "response_ms": response_ms,
            "error_message": error_message,
            "alert_sent": alert_status,
        }