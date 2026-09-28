import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderResponse

# (reminder_type, timedelta before scheduled_at)
REMINDER_OFFSETS: list[tuple[str, timedelta]] = [
    ("24_hour", timedelta(hours=24)),
    ("1_hour", timedelta(hours=1)),
    ("15_minute", timedelta(minutes=15)),
    ("at_time", timedelta(0)),
]


def create_reminders_for_interview(db: Session, interview: Interview) -> None:
    """Creates one row per tier. If a tier's fire time has already passed (e.g. the
    interview was booked less than 24h out), that reminder is created as 'skipped'
    rather than 'pending', so it never fires immediately on creation."""
    now = datetime.now(timezone.utc)
    for reminder_type, offset in REMINDER_OFFSETS:
        fire_at = interview.scheduled_at - offset
        status = "pending" if fire_at > now else "skipped"
        reminder = Reminder(
            interview_id=interview.id,
            reminder_type=reminder_type,
            scheduled_for=fire_at,
            status=status,
        )
        db.add(reminder)
    db.commit()


def cancel_pending_reminders(db: Session, interview_id: uuid.UUID) -> None:
    """Used when an interview is cancelled. Marks pending reminders as cancelled so
    there's an audit trail of 'this was going to fire but the interview was called off'."""
    stmt = (
        update(Reminder)
        .where(Reminder.interview_id == interview_id, Reminder.status == "pending")
        .values(status="cancelled")
    )
    db.execute(stmt)
    db.commit()


def replace_reminders_for_reschedule(db: Session, interview: Interview) -> None:
    """Used when an interview's time changes. Deletes ALL existing reminder rows for
    this interview (pending, skipped, delivered, acknowledged alike) and recreates the
    three tiers against the new scheduled_at. A plain 'cancel pending' isn't enough here:
    the unique (interview_id, reminder_type) constraint means a stale 'skipped' or
    'delivered' row from the old schedule would block inserting the new one."""
    db.execute(delete(Reminder).where(Reminder.interview_id == interview.id))
    db.commit()
    create_reminders_for_interview(db, interview)


def _to_response(reminder: Reminder, interview: Interview, candidate: Candidate) -> ReminderResponse:
    return ReminderResponse(
        id=reminder.id,
        interview_id=reminder.interview_id,
        reminder_type=reminder.reminder_type,
        scheduled_for=reminder.scheduled_for,
        status=reminder.status,
        delivered_at=reminder.delivered_at,
        acknowledged_at=reminder.acknowledged_at,
        candidate_name=candidate.name,
        candidate_role=candidate.job_role,
        interview_scheduled_at=interview.scheduled_at,
        meeting_link=interview.meeting_link,
    )


def claim_due_reminders(db: Session) -> list[Reminder]:
    """Called by the scheduler. Atomically claims every 'pending' reminder whose
    scheduled_for has passed, flips them to 'delivered', and returns them.
    FOR UPDATE SKIP LOCKED means a second worker process (if one ever exists)
    can't claim the same row twice — the core duplicate-prevention mechanism."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(Reminder)
        .join(Interview, Reminder.interview_id == Interview.id)
        .where(Reminder.status == "pending", Reminder.scheduled_for <= now)
        .where(Interview.status == "scheduled")
        .with_for_update(skip_locked=True, of=Reminder)
    )
    due = list(db.execute(stmt).scalars().all())
    for reminder in due:
        reminder.status = "delivered"
        reminder.delivered_at = now
    db.commit()
    return due


def list_active_reminders(db: Session, owner_id: uuid.UUID) -> list[ReminderResponse]:
    """Reminders the frontend should currently show: delivered-but-not-yet-acknowledged,
    scoped to this HR account's own interviews only."""
    stmt = (
        select(Reminder, Interview, Candidate)
        .join(Interview, Reminder.interview_id == Interview.id)
        .join(Candidate, Interview.candidate_id == Candidate.id)
        .where(Reminder.status == "delivered", Interview.owner_id == owner_id, Interview.status == "scheduled")
        .order_by(Reminder.scheduled_for.asc())
    )
    return [_to_response(r, i, c) for r, i, c in db.execute(stmt).all()]


def acknowledge_reminder(db: Session, reminder_id: uuid.UUID, owner_id: uuid.UUID) -> ReminderResponse | None:
    """owner_id is required so one HR account can't acknowledge (or even discover the
    existence of) a reminder belonging to another account's interview."""
    stmt = (
        select(Reminder, Interview, Candidate)
        .join(Interview, Reminder.interview_id == Interview.id)
        .join(Candidate, Interview.candidate_id == Candidate.id)
        .where(Reminder.id == reminder_id, Interview.owner_id == owner_id)
    )
    row = db.execute(stmt).first()
    if row is None:
        return None
    reminder, interview, candidate = row
    reminder.status = "acknowledged"
    reminder.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(reminder)
    return _to_response(reminder, interview, candidate)
