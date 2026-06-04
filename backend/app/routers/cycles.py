from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.cycle import CycleLog, SymptomLog, CyclePrediction
from app.schemas.cycle import (
    CycleLogCreate, CycleLogResponse,
    SymptomLogCreate, SymptomLogResponse,
    PredictionResponse,
)
from app.ml.predict import compute_prediction

router = APIRouter(prefix="/cycles", tags=["cycles"])


# ── Cycle logs ───────────────────────────────────────────────────────────────

@router.get("", response_model=list[CycleLogResponse])
def list_cycle_logs(
    limit: int = Query(24, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(CycleLog)
        .filter(CycleLog.user_id == current_user.id)
        .order_by(CycleLog.period_start.desc())
        .limit(limit)
        .all()
    )


@router.post("", response_model=CycleLogResponse, status_code=201)
def add_cycle_log(
    body: CycleLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = CycleLog(user_id=current_user.id, **body.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    _recompute_and_save(current_user.id, db)
    return log


# ── Symptom logs ─────────────────────────────────────────────────────────────

@router.get("/symptoms", response_model=list[SymptomLogResponse])
def list_symptom_logs(
    date: str | None = Query(None, description="Filter by YYYY-MM-DD"),
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        db.query(SymptomLog)
        .filter(SymptomLog.user_id == current_user.id)
        .order_by(SymptomLog.logged_time.desc())
    )
    if date:
        q = q.filter(SymptomLog.logged_date == date)
    return q.limit(limit).all()


@router.post("/symptoms", response_model=SymptomLogResponse, status_code=201)
def add_symptom_log(
    body: SymptomLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = SymptomLog(user_id=current_user.id, **body.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ── Predictions ──────────────────────────────────────────────────────────────

@router.get("/prediction", response_model=PredictionResponse | None)
def get_prediction(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(CyclePrediction).filter(CyclePrediction.user_id == current_user.id).first()


@router.post("/prediction/recompute", response_model=PredictionResponse)
def recompute_prediction(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _recompute_and_save(current_user.id, db)


# ── Internal helper ──────────────────────────────────────────────────────────

def _recompute_and_save(user_id: str, db: Session) -> CyclePrediction:
    from app.models.user import Profile

    logs = (
        db.query(CycleLog)
        .filter(CycleLog.user_id == user_id)
        .order_by(CycleLog.period_start.asc())
        .all()
    )
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    default_cycle = profile.average_cycle_length if profile else 28
    default_period = profile.average_period_length if profile else 5

    result = compute_prediction(logs, default_cycle, default_period)

    prediction = db.query(CyclePrediction).filter(CyclePrediction.user_id == user_id).first()
    if prediction:
        for k, v in result.items():
            setattr(prediction, k, v)
    else:
        prediction = CyclePrediction(user_id=user_id, **result)
        db.add(prediction)

    db.commit()
    db.refresh(prediction)
    return prediction
