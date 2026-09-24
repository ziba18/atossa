from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, field_validator
import json

RecordKind = Literal["symptom", "appointment", "medicine", "history", "period_day", "doctor_note"]

MAX_DATA_CHARS = 20_000  # one record's serialised JSON — generous for free-text fields
MAX_RECORDS_PER_USER = 5_000


def _check_size(v: dict[str, Any]) -> dict[str, Any]:
    if len(json.dumps(v)) > MAX_DATA_CHARS:
        raise ValueError(f"Record is too large (max {MAX_DATA_CHARS} characters)")
    return v


class RecordCreate(BaseModel):
    kind: RecordKind
    data: dict[str, Any]

    _size = field_validator("data")(_check_size)


class RecordUpdate(BaseModel):
    data: dict[str, Any]

    _size = field_validator("data")(_check_size)


class RecordResponse(BaseModel):
    id: str
    kind: str
    data: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class RecordListResponse(BaseModel):
    records: list[RecordResponse]
