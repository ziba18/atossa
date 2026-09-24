from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.cycle import CycleLog
from app.schemas.cycle import CycleLogCreate, CycleLogUpdate, CycleLogResponse

router = APIRouter(prefix="/cycles", tags=["cycles"])


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
    return log


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
