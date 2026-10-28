import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """Authentication record — stores credentials, nothing personal."""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String, nullable=True)  # null for OAuth users
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Bumped to sign the account out everywhere: tokens carry the number they were issued with.
    token_version: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False)


class Profile(Base):
    """Personal details and preferences — separate from auth."""
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), primary_key=True)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    date_of_birth: Mapped[str | None] = mapped_column(String, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    average_cycle_length: Mapped[int] = mapped_column(Integer, default=28)
    average_period_length: Mapped[int] = mapped_column(Integer, default=5)
    cycle_regularity: Mapped[str] = mapped_column(String, default="unknown")
    onboarding_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    timezone: Mapped[str] = mapped_column(String, default="UTC")
    dark_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    daily_log_reminder_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    daily_log_reminder_time: Mapped[str] = mapped_column(String, default="20:00")
    # Which version of the consent text the person agreed to, and when (set by the server).
    consent_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    consented_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship("User", back_populates="profile")


class SocialIdentity(Base):
    """Which Apple or Google subject belongs to which account (matched before the email)."""
    __tablename__ = "social_identities"
    __table_args__ = (UniqueConstraint("provider", "subject", name="uq_social_provider_subject"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class UsedRefreshToken(Base):
    """A refresh token that has been exchanged once. Seeing the same token again later means a copy exists."""
    __tablename__ = "used_refresh_tokens"

    jti: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
