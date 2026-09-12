from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.capture import SymptomCapture
from app.schemas.capture import CaptureCreate, CaptureResponse

router = APIRouter(prefix="/captures", tags=["captures"])


@router.post("", response_model=CaptureResponse, status_code=201)
def create_capture(
    body: CaptureCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    capture = SymptomCapture(
        user_id=current_user.id,
        transcript=body.transcript,
        input_method=body.input_method,
    )
    db.add(capture)
    db.commit()
    db.refresh(capture)
    return capture


@router.get("", response_model=list[CaptureResponse])
def list_captures(
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(SymptomCapture)
        .filter(SymptomCapture.user_id == current_user.id)
        .order_by(SymptomCapture.created_at.desc())
        .limit(limit)
        .all()
    )
