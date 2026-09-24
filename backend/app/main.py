from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers import auth, profiles, cycles, captures, connections, chat, records

app = FastAPI(title="Atossa API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(cycles.router)
app.include_router(captures.router)
app.include_router(connections.router)
app.include_router(chat.router)
app.include_router(records.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/warmup")
def warmup(db: Session = Depends(get_db)):
    """Wakes a spun-down instance and opens a pooled DB connection before the user logs in."""
    db.execute(text("select 1"))
    return {"status": "ok"}
