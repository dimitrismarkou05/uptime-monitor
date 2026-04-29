from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.monitor import Monitor
from app.schemas.monitor import MonitorCreate, MonitorRead, MonitorUpdate

router = APIRouter()


@router.post("/", response_model=MonitorRead, status_code=201)
async def create_monitor(
    monitor_in: MonitorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
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


@router.get("/{monitor_id}", response_model=MonitorRead)
async def get_monitor(
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
    return monitor


@router.patch("/{monitor_id}", response_model=MonitorRead)
async def update_monitor(
    monitor_id: str,
    monitor_in: MonitorUpdate,
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
    
    update_data = monitor_in.model_dump(exclude_unset=True, mode="json")
    for field, value in update_data.items():
        setattr(monitor, field, value)
    
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.delete("/{monitor_id}", status_code=204)
async def delete_monitor(
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
    
    await db.delete(monitor)
    await db.commit()
    return None