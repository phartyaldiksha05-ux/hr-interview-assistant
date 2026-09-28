from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.reminder import Reminder
from app.models.user import User
from app.schemas.interview import InterviewResponse
from app.services import interview_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    owner_id = current_user.id
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    total_candidates = db.execute(
        select(func.count()).select_from(Candidate).where(Candidate.owner_id == owner_id, Candidate.deleted_at.is_(None))
    ).scalar_one()

    upcoming_interviews = db.execute(
        select(func.count()).select_from(Interview).where(
            Interview.owner_id == owner_id, Interview.scheduled_at >= now, Interview.status == "scheduled"
        )
    ).scalar_one()

    today_interviews = db.execute(
        select(func.count()).select_from(Interview).where(
            Interview.owner_id == owner_id,
            Interview.scheduled_at >= today_start,
            Interview.scheduled_at < today_end,
            Interview.status == "scheduled",
        )
    ).scalar_one()

    pending_reminders = db.execute(
        select(func.count()).select_from(Reminder).join(Interview, Reminder.interview_id == Interview.id).where(
            Interview.owner_id == owner_id, Interview.status == "scheduled", Reminder.status == "delivered"
        )
    ).scalar_one()
    pending_feedback = len(interview_service.list_pending_feedback(db, owner_id))

    return {
        "total_candidates": total_candidates,
        "upcoming_interviews": upcoming_interviews,
        "today_interviews": today_interviews,
        "pending_reminders": pending_reminders,
        "pending_feedback": pending_feedback,
    }


@router.get("/pending-feedback", response_model=list[InterviewResponse])
def get_pending_feedback(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return interview_service.list_pending_feedback(db, current_user.id)
