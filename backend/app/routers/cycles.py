from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.cycle import CycleLog, SymptomLog, CyclePrediction
from app.schemas.cycle import (
    CycleLogCreate, CycleLogUpdate, CycleLogResponse,
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
# Registered before the /{log_id} cycle-log routes below: FastAPI matches
# routes in registration order, and "/symptoms" would otherwise be captured
# by DELETE /{log_id} (with log_id="symptoms") before ever reaching here.

@router.get("/symptoms/count")
def count_symptom_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(SymptomLog).filter(SymptomLog.user_id == current_user.id).count()
    return {"count": count}


@router.get("/symptoms", response_model=list[SymptomLogResponse])
def list_symptom_logs(
    date: str | None = Query(None, description="Filter by exact YYYY-MM-DD"),
    since: str | None = Query(None, description="Return logs with logged_date >= YYYY-MM-DD"),
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
    if since:
        q = q.filter(SymptomLog.logged_date >= since)
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


@router.post("/symptoms/bulk", response_model=list[SymptomLogResponse], status_code=201)
def add_symptom_logs_bulk(
    body: list[SymptomLogCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = [SymptomLog(user_id=current_user.id, **item.model_dump()) for item in body]
    db.add_all(logs)
    db.commit()
    for log in logs:
        db.refresh(log)
    return logs


@router.delete("/symptoms", status_code=204)
def delete_symptom_logs(
    date: str = Query(..., description="Delete logs for this exact YYYY-MM-DD"),
    types: str = Query(..., description="Comma-separated symptom_type values to delete"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    type_list = [t for t in types.split(",") if t]
    (
        db.query(SymptomLog)
        .filter(
            SymptomLog.user_id == current_user.id,
            SymptomLog.logged_date == date,
            SymptomLog.symptom_type.in_(type_list),
        )
        .delete(synchronize_session=False)
    )
    db.commit()


@router.patch("/{log_id}", response_model=CycleLogResponse)
def update_cycle_log(
    log_id: str,
    body: CycleLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(CycleLog).filter(CycleLog.id == log_id, CycleLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Cycle log not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    _recompute_and_save(current_user.id, db)
    return log


@router.delete("/{log_id}", status_code=204)
def delete_cycle_log(
    log_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(CycleLog).filter(CycleLog.id == log_id, CycleLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Cycle log not found")
    db.delete(log)
    db.commit()
    _recompute_and_save(current_user.id, db)


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
