from datetime import datetime
from typing import Literal
from pydantic import BaseModel, field_validator

MAX_TRANSCRIPT_LENGTH = 8000  # generous ceiling — see /captures POST validation


class CaptureCreate(BaseModel):
    transcript: str
    input_method: Literal["voice", "text"]

    @field_validator("transcript")
    @classmethod
    def not_blank_and_not_too_long(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Transcript can't be empty")
        if len(v) > MAX_TRANSCRIPT_LENGTH:
            raise ValueError(f"Transcript is too long (max {MAX_TRANSCRIPT_LENGTH} characters)")
        return v


class CaptureResponse(BaseModel):
    id: str
    transcript: str
    input_method: str
    created_at: datetime

    class Config:
        from_attributes = True
