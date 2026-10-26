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


class FailureThrottle:
    """Counts failed attempts per key (e.g. an email) so one account cannot be guessed at from many IPs.

    In-process like `limit`. Locks the key for `window` seconds after `max_failures` misses; a success clears it.
    """

    def __init__(self, max_failures: int, window: int):
        self.max_failures = max_failures
        self.window = window
        self._fails: dict[str, deque] = defaultdict(deque)

    def _prune(self, key: str, now: float) -> deque:
        q = self._fails[key]
        while q and now - q[0] > self.window:
            q.popleft()
        if not q:
            self._fails.pop(key, None)
        return q

    def check(self, key: str) -> None:
        now = time.monotonic()
        with _lock:
            if len(self._prune(key, now)) >= self.max_failures:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many sign-in attempts. Please try again later.",
                    headers={"Retry-After": str(self.window)},
                )

    def fail(self, key: str) -> None:
        with _lock:
            self._fails[key].append(time.monotonic())

    def clear(self, key: str) -> None:
        with _lock:
            self._fails.pop(key, None)
