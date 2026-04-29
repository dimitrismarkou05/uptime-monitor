from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request
from app.core.config import settings

def _rate_limit_key(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

# Configure Limiter to use the centralized Redis storage
limiter = Limiter(
    key_func=_rate_limit_key,
    storage_uri=settings.redis_url
)