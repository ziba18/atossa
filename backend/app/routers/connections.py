from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Profile
from app.models.cycle import CycleLog
from app.models.social import ConnectedAccount
from app.schemas.connection import (
    InviteFriendRequest, ConnectionResponse, FriendSummary, FriendCycleLog,
)

router = APIRouter(prefix="/connections", tags=["connections"])


def _display_name(db: Session, user_id: str) -> str | None:
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    return profile.display_name if profile else None


@router.post("/invite", response_model=ConnectionResponse, status_code=201)
def invite_friend(
    body: InviteFriendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invite_email = body.invite_email.lower()
    if invite_email == current_user.email.lower():
        raise HTTPException(status_code=400, detail="You can't invite yourself")

    existing = (
        db.query(ConnectedAccount)
        .filter(
            ConnectedAccount.owner_user_id == current_user.id,
            ConnectedAccount.invite_email == invite_email,
            ConnectedAccount.relationship == "friend",
        )
        .first()
    )
    if existing:
        return ConnectionResponse(
            id=existing.id, relationship=existing.relationship, status=existing.status,
            invite_email=existing.invite_email, other_display_name=None,
            created_at=existing.created_at,
        )

    connection = ConnectedAccount(
        owner_user_id=current_user.id,
        invite_email=invite_email,
        relationship="friend",
        status="pending",
        can_view_cycle=True,
        can_view_symptoms=False,
        can_view_metrics=False,
        can_receive_alerts=False,
    )
    db.add(connection)
    db.commit()
    db.refresh(connection)
    return ConnectionResponse(
        id=connection.id, relationship=connection.relationship, status=connection.status,
        invite_email=connection.invite_email, other_display_name=None,
        created_at=connection.created_at,
    )


@router.get("/pending", response_model=list[ConnectionResponse])
def list_pending_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ConnectedAccount)
        .filter(
            ConnectedAccount.invite_email == current_user.email.lower(),
            ConnectedAccount.status == "pending",
            ConnectedAccount.relationship == "friend",
        )
        .all()
    )
    return [
        ConnectionResponse(
            id=r.id, relationship=r.relationship, status=r.status,
            invite_email=r.invite_email, other_display_name=_display_name(db, r.owner_user_id),
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post("/{connection_id}/accept", response_model=ConnectionResponse)
def accept_invite(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    connection = db.query(ConnectedAccount).filter(ConnectedAccount.id == connection_id).first()
    if (
        not connection
        or connection.status != "pending"
        or connection.invite_email != current_user.email.lower()
    ):
        raise HTTPException(status_code=404, detail="Invite not found")

    connection.viewer_user_id = current_user.id
    connection.status = "accepted"
    connection.accepted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(connection)
    return ConnectionResponse(
        id=connection.id, relationship=connection.relationship, status=connection.status,
        invite_email=connection.invite_email, other_display_name=_display_name(db, connection.owner_user_id),
        created_at=connection.created_at,
    )


@router.post("/{connection_id}/decline", status_code=204)
def decline_invite(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    connection = db.query(ConnectedAccount).filter(ConnectedAccount.id == connection_id).first()
    if (
        not connection
        or connection.status != "pending"
        or connection.invite_email != current_user.email.lower()
    ):
        raise HTTPException(status_code=404, detail="Invite not found")
    db.delete(connection)
    db.commit()


@router.get("/friends", response_model=list[FriendSummary])
def list_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ConnectedAccount)
        .filter(
            ConnectedAccount.relationship == "friend",
            ConnectedAccount.status == "accepted",
            (
                (ConnectedAccount.owner_user_id == current_user.id)
                | (ConnectedAccount.viewer_user_id == current_user.id)
            ),
        )
        .all()
    )

    summaries = []
    for r in rows:
        friend_id = r.viewer_user_id if r.owner_user_id == current_user.id else r.owner_user_id
        if not friend_id:
            continue
        profile = db.query(Profile).filter(Profile.id == friend_id).first()
        logs = (
            db.query(CycleLog)
            .filter(CycleLog.user_id == friend_id)
            .order_by(CycleLog.period_start.desc())
            .limit(12)
            .all()
        )
        summaries.append(FriendSummary(
            connection_id=r.id,
            friend_id=friend_id,
            display_name=profile.display_name if profile else None,
            average_cycle_length=profile.average_cycle_length if profile else 28,
            average_period_length=profile.average_period_length if profile else 5,
            cycle_logs=[FriendCycleLog.model_validate(log) for log in logs],
        ))
    return summaries


@router.delete("/{connection_id}", status_code=204)
def remove_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    connection = db.query(ConnectedAccount).filter(ConnectedAccount.id == connection_id).first()
    if not connection or current_user.id not in (connection.owner_user_id, connection.viewer_user_id):
        raise HTTPException(status_code=404, detail="Connection not found")
    db.delete(connection)
    db.commit()
