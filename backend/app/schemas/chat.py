from typing import Literal
from pydantic import BaseModel, Field, field_validator

MAX_MESSAGES = 20          # recent history only — bounds cost and free-tier token use
MAX_MESSAGE_LENGTH = 2000


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

    @field_validator("content")
    @classmethod
    def not_blank_and_not_too_long(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message can't be empty")
        if len(v) > MAX_MESSAGE_LENGTH:
            raise ValueError(f"Message is too long (max {MAX_MESSAGE_LENGTH} characters)")
        return v


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=MAX_MESSAGES)

    @field_validator("messages")
    @classmethod
    def last_is_from_user(cls, v: list[ChatMessage]) -> list[ChatMessage]:
        if v[-1].role != "user":
            raise ValueError("The last message must be from the user")
        return v


class ChatResponse(BaseModel):
    reply: str
