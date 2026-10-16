from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models import (
    AlertLog, ConnectedAccount, CycleLog, CyclePrediction, EmergencyContact, HealthMetric,
    HealthRecord, Profile, SymptomCapture, SymptomLog, User,
)
from app.schemas.profile import ProfileResponse, ProfileUpdate

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
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


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
        or_(ConnectedAccount.owner_user_id == uid, ConnectedAccount.viewer_user_id == uid)
    ).delete(synchronize_session=False)
    db.query(Profile).filter(Profile.id == uid).delete(synchronize_session=False)
    db.query(User).filter(User.id == uid).delete(synchronize_session=False)
    db.commit()
