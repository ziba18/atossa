import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status

_hits: dict[str, deque] = defaultdict(deque)
_lock = Lock()


def limit(name: str, max_calls: int, per_seconds: int):
    """Per-client sliding-window limiter (in-process; fine for a single instance)."""

    def dependency(request: Request) -> None:
        fwd = request.headers.get("x-forwarded-for", "")
        client = fwd.split(",")[0].strip() or (request.client.host if request.client else "unknown")
        key = f"{name}:{client}"
        now = time.monotonic()
        with _lock:
            q = _hits[key]
            while q and now - q[0] > per_seconds:
                q.popleft()
            if len(q) >= max_calls:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again shortly.",
                    headers={"Retry-After": str(per_seconds)},
                )
            q.append(now)
            if len(_hits) > 10000:
                for k in [k for k, v in _hits.items() if not v or now - v[-1] > per_seconds]:
                    del _hits[k]

    return dependency
