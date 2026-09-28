import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.reminder import ReminderResponse
from app.services import reminder_service

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("/due", response_model=list[ReminderResponse])
def get_due_reminders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return reminder_service.list_active_reminders(db, owner_id=current_user.id)


@router.patch("/{reminder_id}/acknowledge", response_model=ReminderResponse)
def acknowledge(
    reminder_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    reminder = reminder_service.acknowledge_reminder(db, reminder_id, owner_id=current_user.id)
    if reminder is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reminder not found")
    return reminder
