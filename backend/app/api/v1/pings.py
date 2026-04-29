from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.ping_log import PingLog
from app.models.monitor import Monitor
from app.schemas.ping_log import PingLogRead

router = APIRouter()


@router.get("/monitor/{monitor_id}", response_model=list[PingLogRead])
async def get_monitor_pings(
    monitor_id: str,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Verify monitor belongs to user
    result = await db.execute(
        select(Monitor).where(
            Monitor.id == monitor_id,
            Monitor.user_id == current_user["id"],
        )
    )
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    result = await db.execute(
        select(PingLog)
        .where(PingLog.monitor_id == monitor_id)
        .order_by(PingLog.timestamp.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/monitor/{monitor_id}/stats")
async def get_monitor_stats(
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(Monitor).where(
            Monitor.id == monitor_id,
            Monitor.user_id == current_user["id"],
        )
    )
    monitor = result.scalar_one_or_none()
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")

    # Total pings
    total = await db.scalar(
        select(func.count()).where(PingLog.monitor_id == monitor_id)
    )
    
    # Uptime count
    uptime = await db.scalar(
        select(func.count()).where(
            PingLog.monitor_id == monitor_id,
            PingLog.is_up == True,
        )
    )

    # Average response time
    avg_response = await db.scalar(
        select(func.avg(PingLog.response_ms)).where(
            PingLog.monitor_id == monitor_id,
            PingLog.response_ms.is_not(None),
        )
    )

    # Last 24h uptime
    from datetime import datetime, timezone, timedelta
    day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    
    day_total = await db.scalar(
        select(func.count()).where(
            PingLog.monitor_id == monitor_id,
            PingLog.timestamp >= day_ago,
        )
    )
    
    day_uptime = await db.scalar(
        select(func.count()).where(
            PingLog.monitor_id == monitor_id,
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