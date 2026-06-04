import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class CycleLog(Base):
    __tablename__ = "cycle_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    period_start: Mapped[str] = mapped_column(String, nullable=False)  # YYYY-MM-DD
    period_end: Mapped[str | None] = mapped_column(String, nullable=True)
    cycle_length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    period_length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    flow_intensity: Mapped[str | None] = mapped_column(String, nullable=True)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    logged_date: Mapped[str] = mapped_column(String, nullable=False)   # YYYY-MM-DD
    logged_time: Mapped[str] = mapped_column(String, nullable=False)   # ISO timestamp
    symptom_type: Mapped[str] = mapped_column(String, nullable=False)
    severity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    custom_label: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class CyclePrediction(Base):
    __tablename__ = "cycle_predictions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    next_period_start: Mapped[str | None] = mapped_column(String, nullable=True)
    next_period_end: Mapped[str | None] = mapped_column(String, nullable=True)
    next_ovulation: Mapped[str | None] = mapped_column(String, nullable=True)
    fertile_window_start: Mapped[str | None] = mapped_column(String, nullable=True)
    fertile_window_end: Mapped[str | None] = mapped_column(String, nullable=True)
    predicted_cycle_length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    method_used: Mapped[str | None] = mapped_column(String, nullable=True)
