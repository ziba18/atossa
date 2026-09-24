from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm import LLMUnavailable, chat_completion

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(body: ChatRequest, current_user: User = Depends(get_current_user)):
    # Only the message text is forwarded — no user id, email, or profile data.
    try:
        reply = chat_completion([m.model_dump() for m in body.messages])
    except LLMUnavailable as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    return ChatResponse(reply=reply)
