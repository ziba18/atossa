from datetime import datetime
from pydantic import BaseModel


class CycleLogCreate(BaseModel):
    period_start: str        # YYYY-MM-DD
    period_end: str | None = None
    cycle_length: int | None = None
    period_length: int | None = None
    flow_intensity: str | None = None
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


class SymptomLogCreate(BaseModel):
    logged_date: str         # YYYY-MM-DD
    logged_time: str         # ISO timestamp
    symptom_type: str
    severity: int | None = None
    custom_label: str | None = None
    notes: str | None = None


class SymptomLogResponse(BaseModel):
    id: str
    user_id: str
    logged_date: str
    logged_time: str
    symptom_type: str
    severity: int | None
    custom_label: str | None
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionResponse(BaseModel):
    id: str
    user_id: str
    computed_at: datetime
    next_period_start: str | None
    next_period_end: str | None
    next_ovulation: str | None
    fertile_window_start: str | None
    fertile_window_end: str | None
    predicted_cycle_length: int | None
    confidence_score: float | None
    method_used: str | None

    class Config:
        from_attributes = True
