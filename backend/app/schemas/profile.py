from datetime import datetime
from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    id: str
    display_name: str | None
    date_of_birth: str | None
    avatar_url: str | None
    average_cycle_length: int
    average_period_length: int
    cycle_regularity: str
    onboarding_complete: bool
    timezone: str
    dark_mode: bool
    notifications_enabled: bool
    daily_log_reminder_enabled: bool
    daily_log_reminder_time: str
    consent_version: int | None = None
    consented_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # lets Pydantic read SQLAlchemy model instances directly


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    date_of_birth: str | None = Field(default=None, max_length=32)
    avatar_url: str | None = Field(default=None, max_length=500)
    average_cycle_length: int | None = Field(default=None, ge=0, le=365)
    average_period_length: int | None = Field(default=None, ge=0, le=365)
    cycle_regularity: str | None = Field(default=None, max_length=32)
    onboarding_complete: bool | None = None
    timezone: str | None = Field(default=None, max_length=64)
    dark_mode: bool | None = None
    notifications_enabled: bool | None = None
    daily_log_reminder_enabled: bool | None = None
    daily_log_reminder_time: str | None = Field(default=None, max_length=16)
    consent_version: int | None = Field(default=None, ge=1, le=1000)
