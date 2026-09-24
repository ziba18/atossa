import json
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.record import HealthRecord
from app.schemas.record import (
    MAX_RECORDS_PER_USER,
    RecordCreate,
    RecordListResponse,
    RecordResponse,
    RecordUpdate,
)

router = APIRouter(prefix="/records", tags=["records"])


def _to_response(row: HealthRecord) -> RecordResponse:
    return RecordResponse(
        id=row.id,
        kind=row.kind,
        data=json.loads(row.data),
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _get_owned(db: Session, user: User, record_id: str) -> HealthRecord:
    row = (
        db.query(HealthRecord)
        .filter(HealthRecord.id == record_id, HealthRecord.user_id == user.id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Record not found")
    return row


@router.get("", response_model=RecordListResponse)
def list_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(HealthRecord)
        .filter(HealthRecord.user_id == current_user.id)
        .order_by(HealthRecord.created_at.asc())
        .limit(MAX_RECORDS_PER_USER)
        .all()
    )
    return RecordListResponse(records=[_to_response(r) for r in rows])


@router.post("", response_model=RecordResponse, status_code=201)
def create_record(
    body: RecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = db.query(HealthRecord).filter(HealthRecord.user_id == current_user.id).count()
    if count >= MAX_RECORDS_PER_USER:
        raise HTTPException(status_code=409, detail="Record limit reached")
    row = HealthRecord(user_id=current_user.id, kind=body.kind, data=json.dumps(body.data))
    db.add(row)
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.put("/{record_id}", response_model=RecordResponse)
def update_record(
    record_id: str,
    body: RecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_owned(db, current_user, record_id)
    row.data = json.dumps(body.data)
    db.commit()
    db.refresh(row)
    return _to_response(row)


@router.delete("/{record_id}", status_code=204)
def delete_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = _get_owned(db, current_user, record_id)
    db.delete(row)
    db.commit()
    return Response(status_code=204)
