from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.user import User
from app.schemas.interview import InterviewResponse
from app.services import interview_service, reminder_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(
    timezone_name: str = Query(default="UTC", alias="timezone", max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    owner_id = current_user.id
    now = datetime.now(timezone.utc)
    try:
        user_timezone = ZoneInfo(timezone_name)
    except (ZoneInfoNotFoundError, ValueError):
        raise HTTPException(status_code=422, detail="Invalid timezone. Use an IANA timezone such as Asia/Kolkata.")

    local_today = now.astimezone(user_timezone).date()
    today_start = datetime.combine(local_today, time.min, tzinfo=user_timezone).astimezone(timezone.utc)
    today_end = datetime.combine(local_today + timedelta(days=1), time.min, tzinfo=user_timezone).astimezone(timezone.utc)

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

    pending_reminders = reminder_service.count_active_reminders(db, owner_id, now=now)
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
