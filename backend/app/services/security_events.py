"""Counts of failed sign-ins per hour, logged when a count passes a threshold.

Nothing identifying is kept or logged: no email, no IP, no token, only the event name and a
number. It exists so a run of failed sign-ins shows in the host logs (ASVS V7)."""
import logging
import threading
import time

logger = logging.getLogger("atossa.security")
THRESHOLDS = (20, 100, 500)

_lock = threading.Lock()
_hour = 0
_counts: dict[str, int] = {}


def record(event: str, now: float | None = None) -> int:
    """Count one event in the current hour and return the count; log when a threshold is crossed."""
    global _hour, _counts
    hour = int((time.time() if now is None else now) // 3600)
    with _lock:
        if hour != _hour:
            _hour, _counts = hour, {}
        n = _counts[event] = _counts.get(event, 0) + 1
    if n in THRESHOLDS:
        logger.warning("security event %s reached %d this hour", event, n)
    return n
