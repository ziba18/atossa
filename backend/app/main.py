from fastapi import Depends, FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.routers import auth, profiles, cycles, connections, chat, records, legal, basket_buddy

app = FastAPI(title="Atossa API", version="1.0.0")


@app.exception_handler(RequestValidationError)
async def validation_error(request, exc: RequestValidationError):
    """422 with the field and the rule only: FastAPI's default also echoes back the submitted
    value, which would repeat a password or a long note in the response."""
    detail = [{"loc": list(e.get("loc", ())), "msg": e.get("msg", ""), "type": e.get("type", "")} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": detail})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Cache-Control", "no-store")
    return response


app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(cycles.router)
app.include_router(connections.router)
app.include_router(chat.router)
app.include_router(records.router)
app.include_router(legal.router)
app.include_router(basket_buddy.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/warmup")
def warmup(db: Session = Depends(get_db)):
    """Wakes a spun-down instance and opens a pooled DB connection before the user logs in."""
    db.execute(text("select 1"))
    return {"status": "ok"}
