from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PingLogRead(BaseModel):
    id: UUID
    monitor_id: UUID
    timestamp: datetime
    status_code: int | None
    response_ms: int | None
    is_up: bool
    error_message: str | None

    model_config = ConfigDict(from_attributes=True)