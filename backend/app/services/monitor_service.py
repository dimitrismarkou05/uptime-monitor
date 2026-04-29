from datetime import datetime, timezone, timedelta
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.monitor import Monitor
from app.schemas.monitor import MonitorCreate, MonitorUpdate


def _coerce_uuid(value) -> UUID:
    """Coerce string UUID (from SQLite) to UUID object."""
    if isinstance(value, str):
        return UUID(value)
    return value


class MonitorService:
    """Business logic for monitor management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: UUID, data: MonitorCreate) -> Monitor:
        monitor = Monitor(
            user_id=user_id,
            url=str(data.url),
            interval_seconds=data.interval_seconds,
            is_active=data.is_active,
        )
        self.db.add(monitor)
        await self.db.commit()
        await self.db.refresh(monitor)
        return monitor

    async def list_by_user(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Monitor]:
        result = await self.db.execute(
            select(Monitor)
            .where(Monitor.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_id(self, monitor_id: str, user_id: UUID) -> Optional[Monitor]:
        """Get monitor by ID, coercing UUID types for SQLite compatibility."""
        monitor_uuid = _coerce_uuid(monitor_id)
        result = await self.db.execute(
            select(Monitor).where(
                Monitor.id == monitor_uuid,
                Monitor.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def update(
        self,
        monitor: Monitor,
        data: MonitorUpdate,
    ) -> Monitor:
        update_data = data.model_dump(exclude_unset=True, mode="json")
        for field, value in update_data.items():
            setattr(monitor, field, value)
        await self.db.commit()
        await self.db.refresh(monitor)
        return monitor

    async def delete(self, monitor: Monitor) -> None:
        await self.db.delete(monitor)
        await self.db.commit()

    async def toggle_active(self, monitor_id: str, user_id: UUID) -> Optional[Monitor]:
        monitor = await self.get_by_id(monitor_id, user_id)
        if not monitor:
            return None
        monitor.is_active = not monitor.is_active
        await self.db.commit()
        await self.db.refresh(monitor)
        return monitor

    def get_due_monitors_sync(self, db_session, now: Optional[datetime] = None) -> List[Monitor]:
        """
        Synchronous version for Celery scheduler.
        Returns monitors that are active and due for a check.
        """
        if now is None:
            now = datetime.now(timezone.utc)

        result = db_session.execute(
            select(Monitor).where(
                Monitor.is_active == True,
                (Monitor.next_check_at <= now) | (Monitor.next_check_at.is_(None)),
            )
        )
        return result.scalars().all()

    def update_next_check_sync(self, monitor: Monitor, now: Optional[datetime] = None) -> None:
        """Update next_check_at after dispatching a check."""
        if now is None:
            now = datetime.now(timezone.utc)
        monitor.next_check_at = now + timedelta(seconds=monitor.interval_seconds)