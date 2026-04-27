import uuid
from datetime import datetime, timezone

from sqlalchemy import ForeignKey, Integer, String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Monitor(Base):
    __tablename__ = "monitors"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    interval_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=300)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    alert_status: Mapped[str] = mapped_column(String(10), default="UP")
    last_alerted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    next_check_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.timezone('UTC', func.now()),
        default=lambda: datetime.now(timezone.utc)  # Fallback for unit tests
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.timezone('UTC', func.now()),
        onupdate=func.timezone('UTC', func.now()),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="monitors")
    ping_logs: Mapped[list["PingLog"]] = relationship(
        "PingLog", back_populates="monitor", cascade="all, delete-orphan"
    )