import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.interview_note import InterviewNote
from app.schemas.interview import InterviewCreate, InterviewResponse, InterviewUpdate
from app.services import reminder_service


def _to_response(interview: Interview, candidate: Candidate) -> InterviewResponse:
    return InterviewResponse(
        id=interview.id,
        candidate_id=interview.candidate_id,
        candidate_name=candidate.name,
        candidate_email=candidate.email,
        candidate_job_role=candidate.job_role,
        scheduled_at=interview.scheduled_at,
        duration_minutes=interview.duration_minutes,
        interview_type=interview.interview_type,
        meeting_link=interview.meeting_link,
        interviewer=interview.interviewer,
        status=interview.status,
        created_at=interview.created_at,
        updated_at=interview.updated_at,
    )


def list_interviews(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[InterviewResponse]:
    stmt = (
        select(Interview, Candidate)
        .join(Candidate, Interview.candidate_id == Candidate.id)
        .where(Interview.owner_id == owner_id)
        .order_by(Interview.scheduled_at.asc())
        .offset(skip)
        .limit(limit)
    )
    return [_to_response(i, c) for i, c in db.execute(stmt).all()]


def list_pending_feedback(db: Session, owner_id: uuid.UUID) -> list[InterviewResponse]:
    has_notes = select(InterviewNote.id).where(InterviewNote.interview_id == Interview.id).exists()
    stmt = (
        select(Interview, Candidate)
        .join(Candidate, Interview.candidate_id == Candidate.id)
        .where(
            Interview.owner_id == owner_id,
            Interview.status == "completed",
            Candidate.deleted_at.is_(None),
            ~has_notes,
        )
        .order_by(Interview.scheduled_at.desc())
    )
    return [_to_response(interview, candidate) for interview, candidate in db.execute(stmt).all()]


def get_interview(db: Session, interview_id: uuid.UUID, owner_id: uuid.UUID) -> InterviewResponse | None:
    stmt = (
        select(Interview, Candidate)
        .join(Candidate, Interview.candidate_id == Candidate.id)
        .where(Interview.id == interview_id, Interview.owner_id == owner_id)
    )
    row = db.execute(stmt).first()
    return _to_response(*row) if row else None


def get_interview_or_none(db: Session, interview_id: uuid.UUID, owner_id: uuid.UUID) -> Interview | None:
    """Raw model (not the response DTO) — used by routers that need the ORM object,
    e.g. to pass into ai_service or note-taking flows."""
    stmt = select(Interview).where(Interview.id == interview_id, Interview.owner_id == owner_id)
    return db.execute(stmt).scalar_one_or_none()


def get_candidate_or_none(db: Session, candidate_id: uuid.UUID, owner_id: uuid.UUID) -> Candidate | None:
    stmt = select(Candidate).where(
        Candidate.id == candidate_id, Candidate.owner_id == owner_id, Candidate.deleted_at.is_(None)
    )
    return db.execute(stmt).scalar_one_or_none()


def create_interview(
    db: Session, owner_id: uuid.UUID, candidate: Candidate, data: InterviewCreate
) -> InterviewResponse:
    interview = Interview(
        owner_id=owner_id,
        candidate_id=candidate.id,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        interview_type=data.interview_type,
        meeting_link=data.meeting_link,
        interviewer=data.interviewer,
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)

    reminder_service.create_reminders_for_interview(db, interview)

    return _to_response(interview, candidate)


def update_interview(
    db: Session, interview_id: uuid.UUID, owner_id: uuid.UUID, data: InterviewUpdate
) -> InterviewResponse | None:
    stmt = select(Interview).where(Interview.id == interview_id, Interview.owner_id == owner_id)
    interview = db.execute(stmt).scalar_one_or_none()
    if interview is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    time_changed = "scheduled_at" in updates and updates["scheduled_at"] != interview.scheduled_at
    status_changed_to_inactive = updates.get("status") in {"cancelled", "completed", "no_show"}

    for field, value in updates.items():
        setattr(interview, field, value)
    db.commit()
    db.refresh(interview)

    if status_changed_to_inactive:
        reminder_service.cancel_pending_reminders(db, interview.id)
    elif time_changed:
        reminder_service.replace_reminders_for_reschedule(db, interview)

    candidate = db.get(Candidate, interview.candidate_id)
    return _to_response(interview, candidate)


def delete_interview(db: Session, interview_id: uuid.UUID, owner_id: uuid.UUID) -> bool:
    stmt = select(Interview).where(Interview.id == interview_id, Interview.owner_id == owner_id)
    interview = db.execute(stmt).scalar_one_or_none()
    if interview is None:
        return False
    db.delete(interview)
    db.commit()
    return True
