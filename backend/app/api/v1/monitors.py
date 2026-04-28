from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.monitor import Monitor
from app.schemas.monitor import MonitorCreate, MonitorRead

router = APIRouter()


@router.post("/", response_model=MonitorRead, status_code=201)
async def create_monitor(
    monitor_in: MonitorCreate,
    db: AsyncSession = Depends(get_db),
):
    monitor = Monitor(**monitor_in.model_dump(mode="json"))
    db.add(monitor)
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.get("/", response_model=list[MonitorRead])
async def list_monitors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Monitor))
    return result.scalars().all()