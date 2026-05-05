from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.core.rate_limiter import limiter
from app.models.ping_log import PingLog
from app.models.monitor import Monitor
from app.schemas.ping_log import PingLogRead

router = APIRouter()


def _coerce_monitor_id(monitor_id: str) -> UUID:
    try:
        return UUID(monitor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid monitor ID format")


class PingListResponse(BaseModel):
    """Response model for paginated pings."""
    items: list[PingLogRead]
    total: int


@router.get("/monitor/{monitor_id}", response_model=PingListResponse)
@limiter.limit("60/minute")
async def get_monitor_pings(
    request: Request,
    monitor_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    monitor_uuid = _coerce_monitor_id(monitor_id)
    result = await db.execute(
        select(Monitor).where(
            Monitor.id == monitor_uuid,
            Monitor.user_id == current_user["id"],
        )
    )
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    # Get total count for pagination
    total = await db.scalar(
        select(func.count()).where(PingLog.monitor_id == monitor_uuid)
    )

    # Get paginated results
    result = await db.execute(
        select(PingLog)
        .where(PingLog.monitor_id == monitor_uuid)
        .order_by(PingLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
    )
    pings = result.scalars().all()

    # Convert ORM objects to Pydantic schemas
    items = [PingLogRead.model_validate(p) for p in pings]

    return PingListResponse(items=items, total=total or 0)


@router.get("/monitor/{monitor_id}/stats")
@limiter.limit("60/minute")
async def get_monitor_stats(
    request: Request,
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    monitor_uuid = _coerce_monitor_id(monitor_id)
    result = await db.execute(
        select(Monitor).where(
            Monitor.id == monitor_uuid,
            Monitor.user_id == current_user["id"],
        )
    )
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    total = await db.scalar(
        select(func.count()).where(PingLog.monitor_id == monitor_uuid)
    )

    uptime = await db.scalar(
        select(func.count()).where(
            PingLog.monitor_id == monitor_uuid,
            PingLog.is_up == True,
        )
    )

    avg_response = await db.scalar(
        select(func.avg(PingLog.response_ms)).where(
            PingLog.monitor_id == monitor_uuid,
            PingLog.response_ms.is_not(None),
        )
    )

    from datetime import datetime, timezone, timedelta
    day_ago = datetime.now(timezone.utc) - timedelta(hours=24)

    day_total = await db.scalar(
        select(func.count()).where(
            PingLog.monitor_id == monitor_uuid,
            PingLog.timestamp >= day_ago,
        )
    )

    day_uptime = await db.scalar(
        select(func.count()).where(
            PingLog.monitor_id == monitor_uuid,
            PingLog.timestamp >= day_ago,
            PingLog.is_up == True,
        )
    )

    return {
        "total_checks": total or 0,
        "uptime_count": uptime or 0,
        "uptime_percent": round((uptime / total * 100), 2) if total else 0,
        "avg_response_ms": round(avg_response, 2) if avg_response else None,
        "last_24h": {
            "checks": day_total or 0,
            "uptime_percent": round((day_uptime / day_total * 100), 2) if day_total else 0,
        },
    }