import uuid
from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Integer, String, Boolean, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PingLog(Base):
    __tablename__ = "ping_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    monitor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("monitors.id"), nullable=False)
    
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    response_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_up: Mapped[bool] = mapped_column(Boolean, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    monitor: Mapped["Monitor"] = relationship("Monitor", back_populates="ping_logs")