import json
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.database import Base, get_db
from app.dependencies import get_current_user
from app.models import (
    AlertLog, ConnectedAccount, CycleLog, CyclePrediction, EmergencyContact, HealthMetric,
    HealthRecord, Profile, SocialIdentity, SymptomCapture, SymptomLog, User,
)
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.rate_limit import limit

router = APIRouter(prefix="/me", tags=["profile"])


@router.get("", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("", response_model=ProfileResponse)
def update_profile(
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # model_dump(exclude_unset=True) only returns fields the client actually sent,
    # so a PATCH with {"dark_mode": true} won't overwrite all other fields with None.
    changes = body.model_dump(exclude_unset=True)
    if "consent_version" in changes:
        # Consent can be given or renewed, never erased or wound back by a client request.
        new = changes["consent_version"]
        if new is None:
            del changes["consent_version"]
        elif profile.consent_version is not None and new < profile.consent_version:
            raise HTTPException(status_code=400, detail="Consent version cannot go down")
    for field, value in changes.items():
        setattr(profile, field, value)
    if changes.get("consent_version") is not None:
        profile.consented_at = datetime.now(timezone.utc)  # the server's clock, never the client's

    db.commit()
    db.refresh(profile)
    return profile


# Columns that are credentials or secrets, never part of a data copy.
_EXPORT_HIDDEN = {"hashed_password", "invite_token"}
_OWNER_COLUMNS = ("user_id", "owner_user_id", "viewer_user_id")


def _jsonable(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


def _rows(db: Session, mapper, condition) -> list[dict]:
    table = mapper.local_table
    columns = [c for c in table.c if c.name not in _EXPORT_HIDDEN]
    out = []
    for row in db.execute(table.select().where(condition)).mappings():
        item = {c.name: _jsonable(row[c.name]) for c in columns}
        if isinstance(item.get("data"), str):  # JSON documents stored as text
            try:
                item["data"] = json.loads(item["data"])
            except ValueError:
                pass
        out.append(item)
    return out


@router.get("/export", dependencies=[Depends(limit("export", 5, 3600))])
def export_my_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """A copy of everything stored for the signed-in user (UK GDPR right of access).

    Walks every mapped table with a user column, so a new user-owned table is included
    without touching this function. Credentials and invite tokens are left out."""
    uid = current_user.id
    data: dict[str, list[dict]] = {}
    for mapper in Base.registry.mappers:
        table = mapper.local_table
        if table.name == "users":
            data["users"] = _rows(db, mapper, table.c.id == uid)
        elif table.name == "profiles":
            data["profiles"] = _rows(db, mapper, table.c.id == uid)
        else:
            cols = [table.c[c] for c in _OWNER_COLUMNS if c in table.c]
            if cols:
                data[table.name] = _rows(db, mapper, or_(*[c == uid for c in cols]))
    return {"exported_at": datetime.now(timezone.utc).isoformat(), "tables": data}


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete the account and everything stored for it, in one transaction.

    Apple requires in-app account deletion for apps that let people sign up. None of
    these tables cascade from `users`, so each one is cleared here; add new user-owned
    tables to this list.
    """
    uid = current_user.id
    for model in (HealthRecord, CycleLog, SymptomLog, CyclePrediction, SymptomCapture,
                  HealthMetric, AlertLog, EmergencyContact):
        db.query(model).filter(model.user_id == uid).delete(synchronize_session=False)
    db.query(ConnectedAccount).filter(
        or_(
            ConnectedAccount.owner_user_id == uid,
            ConnectedAccount.viewer_user_id == uid,
            ConnectedAccount.invite_email == current_user.email.lower(),
        )
    ).delete(synchronize_session=False)
    db.query(SocialIdentity).filter(SocialIdentity.user_id == uid).delete(synchronize_session=False)
    db.query(Profile).filter(Profile.id == uid).delete(synchronize_session=False)
    db.query(User).filter(User.id == uid).delete(synchronize_session=False)
    db.commit()
