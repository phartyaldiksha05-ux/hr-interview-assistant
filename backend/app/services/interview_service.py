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


def list_interviews(
    db: Session,
    owner_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> list[InterviewResponse]:
    stmt = (
        select(Interview, Candidate)
        .join(Candidate, Candidate.id == Interview.candidate_id)
        .where(Interview.owner_id == owner_id)
        .order_by(Interview.scheduled_at.desc())
        .offset(skip)
        .limit(limit)
    )

    rows = db.execute(stmt).all()

    return [
        _to_response(interview, candidate)
        for interview, candidate in rows
    ]


def list_pending_feedback(
    db: Session,
    owner_id: uuid.UUID,
) -> list[InterviewResponse]:
    stmt = (
        select(Interview, Candidate)
        .join(Candidate, Candidate.id == Interview.candidate_id)
        .where(
            Interview.owner_id == owner_id,
            Interview.status == "completed",
        )
        .order_by(Interview.scheduled_at.desc())
    )

    rows = db.execute(stmt).all()

    return [
        _to_response(interview, candidate)
        for interview, candidate in rows
    ]


def get_interview(
    db: Session,
    interview_id: uuid.UUID,
    owner_id: uuid.UUID,
) -> InterviewResponse:
    stmt = (
        select(Interview, Candidate)
        .join(Candidate, Candidate.id == Interview.candidate_id)
        .where(
            Interview.id == interview_id,
            Interview.owner_id == owner_id,
        )
    )

    row = db.execute(stmt).first()

    if row is None:
        raise ValueError("Interview not found")

    interview, candidate = row

    return _to_response(interview, candidate)


def get_interview_or_none(
    db: Session,
    interview_id: uuid.UUID,
    owner_id: uuid.UUID,
):
    stmt = select(Interview).where(
        Interview.id == interview_id,
        Interview.owner_id == owner_id,
    )

    return db.execute(stmt).scalar_one_or_none()


def get_candidate_or_none(
    db: Session,
    candidate_id: uuid.UUID,
    owner_id: uuid.UUID,
):
    stmt = select(Candidate).where(
        Candidate.id == candidate_id,
        Candidate.owner_id == owner_id,
    )

    return db.execute(stmt).scalar_one_or_none()


def create_interview(
    db: Session,
    owner_id: uuid.UUID,
    candidate: Candidate,
    data: InterviewCreate,
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

    # Create HR reminders
    reminder_service.create_reminders_for_interview(
        db,
        interview,
    )

    # Candidate interview email is handled by EmailJS
    # on the frontend after the interview is successfully created.

    return _to_response(interview, candidate)


def update_interview(
    db: Session,
    interview_id: uuid.UUID,
    owner_id: uuid.UUID,
    data: InterviewUpdate,
):
    stmt = select(Interview).where(
        Interview.id == interview_id,
        Interview.owner_id == owner_id,
    )

    interview = db.execute(stmt).scalar_one_or_none()

    if interview is None:
        return None

    candidate = db.get(
        Candidate,
        interview.candidate_id,
    )

    if candidate is None:
        return None

    updates = data.model_dump(
        exclude_unset=True
    )

    time_changed = (
        "scheduled_at" in updates
        and updates["scheduled_at"] != interview.scheduled_at
    )

    status_changed_to_inactive = (
        updates.get("status")
        in {"cancelled", "completed", "no_show"}
    )

    # Apply updates
    for field, value in updates.items():
        setattr(interview, field, value)

    db.commit()
    db.refresh(interview)

    # ---------------------------------------------------------
    # CANCEL / COMPLETE / NO-SHOW
    # ---------------------------------------------------------
    if status_changed_to_inactive:

        # Cancel pending reminders
        reminder_service.cancel_pending_reminders(
            db,
            interview.id,
        )

    # ---------------------------------------------------------
    # RESCHEDULE
    # ---------------------------------------------------------
    elif time_changed:

        # Replace old reminders with new reminders
        reminder_service.replace_reminders_for_reschedule(
            db,
            interview,
        )

    return _to_response(
        interview,
        candidate,
    )


def delete_interview(
    db: Session,
    interview_id: uuid.UUID,
    owner_id: uuid.UUID,
) -> bool:
    interview = get_interview_or_none(
        db,
        interview_id,
        owner_id,
    )

    if interview is None:
        return False

    db.delete(interview)
    db.commit()

    return True