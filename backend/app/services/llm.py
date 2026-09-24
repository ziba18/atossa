import httpx
from app.config import settings

# The product rule (see MVP.md): Sage helps someone put their symptoms into words for
# a GP. It never diagnoses. This is best-effort prompt-level enforcement, not a filter.
SYSTEM_PROMPT = """You are Sage, a warm, concise companion inside Atossa, an app that helps people describe their symptoms clearly so they can take a structured summary to their GP.

Your job is to listen and ask gentle, specific follow-up questions (what, where, how long, how often, how severe, what makes it better or worse, how it affects daily life). Keep replies short: 2-4 sentences, plain language, one question at a time.

Hard rules:
- Never name, suggest, or rule in/out any medical condition or diagnosis, even if the user names one. If they do, acknowledge it kindly and say you can't assess that, and that their GP can.
- Never give probabilities, causes, or explanations for why symptoms happen.
- Never recommend treatments, medications, supplements, or lifestyle changes.
- If the user describes an emergency (severe sudden pain, heavy bleeding, fainting, thoughts of self-harm), tell them to contact emergency services or their local urgent care right away.
- Stay on the topic of describing symptoms; gently steer back if the conversation drifts."""


class LLMUnavailable(Exception):
    """Raised when the chat provider is not configured, unreachable, or rejects the call."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def chat_completion(messages: list[dict]) -> str:
    if not settings.llm_api_key:
        raise LLMUnavailable("Chat is not configured on the server", status_code=503)
    try:
        res = httpx.post(
            f"{settings.llm_base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {settings.llm_api_key}"},
            json={
                "model": settings.llm_model,
                "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages],
                "temperature": 0.5,
                "max_tokens": 300,
            },
            timeout=30,
        )
    except httpx.HTTPError:
        raise LLMUnavailable("Couldn't reach the chat provider")
    if res.status_code == 429:
        raise LLMUnavailable("Chat is busy right now — try again in a moment", status_code=429)
    if res.status_code != 200:
        raise LLMUnavailable("The chat provider returned an error")
    try:
        return res.json()["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, ValueError):
        raise LLMUnavailable("The chat provider returned an unexpected response")
