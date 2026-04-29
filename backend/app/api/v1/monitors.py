from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.core.rate_limiter import limiter
from app.schemas.monitor import MonitorCreate, MonitorRead, MonitorUpdate
from app.services.monitor_service import MonitorService

router = APIRouter()


@router.post("/", response_model=MonitorRead, status_code=201)
@limiter.limit("10/minute")
async def create_monitor(
    request: Request,
    monitor_in: MonitorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = MonitorService(db)
    monitor = await service.create(current_user["id"], monitor_in)
    return monitor


@router.get("/", response_model=list[MonitorRead])
@limiter.limit("60/minute")
async def list_monitors(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(100, ge=1, le=500),
):
    service = MonitorService(db)
    return await service.list_by_user(current_user["id"], skip, limit)


@router.get("/{monitor_id}", response_model=MonitorRead)
@limiter.limit("60/minute")
async def get_monitor(
    request: Request,
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = MonitorService(db)
    monitor = await service.get_by_id(monitor_id, current_user["id"])
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return monitor


@router.patch("/{monitor_id}", response_model=MonitorRead)
@limiter.limit("20/minute")
async def update_monitor(
    request: Request,
    monitor_id: str,
    monitor_in: MonitorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = MonitorService(db)
    monitor = await service.get_by_id(monitor_id, current_user["id"])
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    return await service.update(monitor, monitor_in)


@router.delete("/{monitor_id}", status_code=204)
@limiter.limit("20/minute")
async def delete_monitor(
    request: Request,
    monitor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = MonitorService(db)
    monitor = await service.get_by_id(monitor_id, current_user["id"])
    if not monitor:
        raise HTTPException(status_code=404, detail="Monitor not found")
    await service.delete(monitor)
    return None