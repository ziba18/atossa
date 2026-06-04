from datetime import datetime
from pydantic import BaseModel


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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # lets Pydantic read SQLAlchemy model instances directly


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    date_of_birth: str | None = None
    avatar_url: str | None = None
    average_cycle_length: int | None = None
    average_period_length: int | None = None
    cycle_regularity: str | None = None
    onboarding_complete: bool | None = None
    timezone: str | None = None
    dark_mode: bool | None = None
    notifications_enabled: bool | None = None
