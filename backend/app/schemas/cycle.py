from datetime import datetime
from pydantic import BaseModel


class CycleLogCreate(BaseModel):
    period_start: str        # YYYY-MM-DD
    period_end: str | None = None
    cycle_length: int | None = None
    period_length: int | None = None
    flow_intensity: str | None = None
    notes: str | None = None


class CycleLogUpdate(BaseModel):
    period_start: str | None = None
    period_end: str | None = None
    cycle_length: int | None = None
    period_length: int | None = None
    flow_intensity: str | None = None
    is_confirmed: bool | None = None
    notes: str | None = None


class CycleLogResponse(BaseModel):
    id: str
    user_id: str
    period_start: str
    period_end: str | None
    cycle_length: int | None
    period_length: int | None
    flow_intensity: str | None
    is_confirmed: bool
    notes: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
