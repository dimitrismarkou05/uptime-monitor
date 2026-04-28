from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.monitor import Monitor
from app.schemas.monitor import MonitorCreate, MonitorRead

router = APIRouter()


@router.post("/", response_model=MonitorRead, status_code=201)
async def create_monitor(
    monitor_in: MonitorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Override user_id from token, ignore body value
    monitor_data = monitor_in.model_dump(mode="json")
    monitor_data["user_id"] = current_user["id"]
    
    monitor = Monitor(**monitor_data)
    db.add(monitor)
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.get("/", response_model=list[MonitorRead])
async def list_monitors(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(
        select(Monitor).where(Monitor.user_id == current_user["id"])
    )
    return result.scalars().all()