import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class HealthRecord(Base):
    """One user-entered item from the redesigned app: a symptom note, an appointment, a
    medicine, a health-history entry, a logged period day, or the doctor's notes.

    Stored as a JSON document per row (`data`) so the app can evolve the shape of these
    records without a migration each time. The server only validates `kind` and the size."""

    __tablename__ = "health_records"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String, nullable=False, index=True)
    data: Mapped[str] = mapped_column(Text, nullable=False)  # JSON object, serialised
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
