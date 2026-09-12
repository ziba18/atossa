from datetime import datetime
from pydantic import BaseModel, EmailStr


class InviteFriendRequest(BaseModel):
    invite_email: EmailStr


class ConnectionResponse(BaseModel):
    id: str
    relationship: str
    status: str
    invite_email: str | None
    other_display_name: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class FriendCycleLog(BaseModel):
    period_start: str
    period_end: str | None
    period_length: int | None

    class Config:
        from_attributes = True


class FriendSummary(BaseModel):
    connection_id: str
    friend_id: str
    display_name: str | None
    average_cycle_length: int
    average_period_length: int
    cycle_logs: list[FriendCycleLog]
