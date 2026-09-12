import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SymptomCapture(Base):
    __tablename__ = "symptom_captures"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    transcript: Mapped[str] = mapped_column(Text, nullable=False)
    input_method: Mapped[str] = mapped_column(String, nullable=False)  # 'voice' | 'text'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
