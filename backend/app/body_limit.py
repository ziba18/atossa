"""Refuses request bodies over a limit while they are read, so a chunked upload (no Content-Length)
cannot make the server buffer a huge body. The declared-length check in main.py stays as the cheap first test."""
import json


class BodyLimit:
    def __init__(self, app, limit: int):
        self.app = app
        self.limit = limit

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        total = 0
        started = False
        rejected = False

        async def reject():
            nonlocal rejected
            rejected = True
            body = json.dumps({"detail": "Request is too large"}).encode()
            await send({"type": "http.response.start", "status": 413,
                        "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())]})
            await send({"type": "http.response.body", "body": body})

        async def limited_receive():
            nonlocal total
            message = await receive()
            if message["type"] == "http.request" and not started and not rejected:
                total += len(message.get("body", b""))
                if total > self.limit:
                    await reject()
                    return {"type": "http.disconnect"}
            return message

        async def tracking_send(message):
            nonlocal started
            if rejected:
                return  # the 413 is already out; whatever the app tries to send now is dropped
            if message["type"] == "http.response.start":
                started = True
            await send(message)

        try:
            await self.app(scope, limited_receive, tracking_send)
        except Exception:
            if not rejected:
                raise
