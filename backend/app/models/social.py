import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ConnectedAccount(Base):
    __tablename__ = "connected_accounts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    viewer_user_id: Mapped[str | None] = mapped_column(String, nullable=True)
    invite_email: Mapped[str | None] = mapped_column(String, nullable=True)
    relationship: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")
    can_view_cycle: Mapped[bool] = mapped_column(Boolean, default=True)
    can_view_symptoms: Mapped[bool] = mapped_column(Boolean, default=False)
    can_view_metrics: Mapped[bool] = mapped_column(Boolean, default=False)
    can_receive_alerts: Mapped[bool] = mapped_column(Boolean, default=False)
    invite_token: Mapped[str] = mapped_column(String, unique=True, default=lambda: str(uuid.uuid4()))
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone_number: Mapped[str] = mapped_column(String, nullable=False)
    relationship: Mapped[str | None] = mapped_column(String, nullable=True)
    notify_on_heavy_bleeding: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_on_fainting: Mapped[bool] = mapped_column(Boolean, default=False)
    notify_on_missed_period: Mapped[bool] = mapped_column(Boolean, default=False)
    call_911_after_no_response: Mapped[bool] = mapped_column(Boolean, default=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
