from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
import redis.asyncio as aioredis

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.api.v1.monitors import router as monitors_router
from app.api.v1.users import router as users_router
from app.api.v1.pings import router as pings_router
from app.core.rate_limiter import limiter
from app.core.config import settings
from app.api.deps import get_db

from app.core.logging import setup_logging

setup_logging()

app = FastAPI(
    title="Uptime Monitor API",
    description="URL uptime monitoring and alerting system",
    version="0.1.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(monitors_router, prefix="/api/v1/monitors", tags=["Monitors"])
app.include_router(pings_router, prefix="/api/v1/pings", tags=["Pings"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])


@app.get("/health", tags=["Health"])
@limiter.limit("30/minute")
async def health_check(request: Request, db=Depends(get_db)):
    health = {"status": "ok", "services": {}}

    try:
        await db.execute(text("SELECT 1"))
        health["services"]["database"] = "ok"
    except Exception as e:
        health["services"]["database"] = f"error: {e}"
        health["status"] = "degraded"

    r = None
    try:
        r = aioredis.from_url(settings.redis_url)
        await r.ping()
        health["services"]["redis"] = "ok"
    except Exception as e:
        health["services"]["redis"] = f"error: {e}"
        health["status"] = "degraded"
    finally:
        if r:
            await r.close()

    status_code = 200 if health["status"] == "ok" else 503
    return JSONResponse(content=health, status_code=status_code)


@app.get("/", tags=["Root"])
@limiter.limit("60/minute")
async def root(request: Request):
    return {"message": "Uptime Monitor API", "docs": "/docs"}