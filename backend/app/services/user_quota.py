import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, status

_hits: dict[str, deque] = defaultdict(deque)
_lock = Lock()


def check_user_quota(name: str, user_id: str, max_calls: int, per_seconds: int) -> None:
    """Per-account sliding window (in-process). Unlike the per-IP limiter, rotating
    addresses does not reset it, so one account cannot use up the shared model quota."""
    key = f"{name}:{user_id}"
    now = time.monotonic()
    with _lock:
        q = _hits[key]
        while q and now - q[0] > per_seconds:
            q.popleft()
        if len(q) >= max_calls:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You've reached today's chat limit. Please try again tomorrow.",
                headers={"Retry-After": str(per_seconds)},
            )
        q.append(now)
