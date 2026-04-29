from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class PingLogBase(BaseModel):
    status_code: int | None
    response_ms: int | None
    is_up: bool
    error_message: str | None


class PingLogRead(PingLogBase):
    id: UUID
    monitor_id: UUID
    timestamp: datetime

    class Config:
        from_attributes = True