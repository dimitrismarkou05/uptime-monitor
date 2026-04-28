from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl


class MonitorBase(BaseModel):
    url: HttpUrl
    interval_seconds: int = Field(default=300, ge=60, le=86400)
    is_active: bool = True


class MonitorCreate(MonitorBase):
    user_id: UUID


class MonitorRead(MonitorBase):
    id: UUID
    user_id: UUID
    alert_status: str
    last_alerted_at: datetime | None
    next_check_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True