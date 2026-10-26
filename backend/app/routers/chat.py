import logging

from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.models.user import User
from app.services.rate_limit import limit
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import output_guard
from app.services.llm import LLMUnavailable, chat_completion

router = APIRouter(prefix="/chat", tags=["chat"])
log = logging.getLogger(__name__)
# uvicorn only configures its own loggers, so without a handler these INFO lines (guard reasons, reply
# shape: counts only, never message text) would be dropped before reaching the host's log viewer.
if not log.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(levelname)s:     %(message)s"))
    log.addHandler(_handler)
    log.setLevel(logging.INFO)
    log.propagate = False


@router.post("", response_model=ChatResponse, dependencies=[Depends(limit("chat", 30, 60))])
def chat(body: ChatRequest, current_user: User = Depends(get_current_user)):
    last_user_text = body.messages[-1].content
    # Emergency wording gets the fixed urgent message; the model is not called at all.
    if output_guard.is_emergency(last_user_text):
        log.info("chat guard: emergency_input")
        return ChatResponse(reply=output_guard.urgent_text(last_user_text))
    # Only the message text is forwarded — no user id, email, or profile data.
    try:
        reply = chat_completion([m.model_dump() for m in body.messages])
    except LLMUnavailable as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    # The system prompt is not enough on its own: replies that name a condition, give a cause
    # or probability, recommend treatment or reassure are swapped for a fixed fallback.
    user_text = " ".join(m.content for m in body.messages if m.role == "user")
    # Emergency wording was already handled above on the latest message only: an older message
    # ("I fainted last month") must not turn every later reply into the urgent text.
    result = output_guard.check(reply, user_text, check_emergency=False)
    if not result.ok:
        log.info("chat guard: replaced reply (%s)", ",".join(result.reasons))  # reasons only, never text
    shape = output_guard.reply_shape(result.text)
    if shape:
        log.info("chat shape: %s", ",".join(shape))  # soft metric, tags only
    return ChatResponse(reply=result.text)
