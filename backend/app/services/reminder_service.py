import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session, aliased

from app.config import settings
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.reminder import Reminder
from app.schemas.reminder import ReminderResponse

# (reminder_type, timedelta before scheduled_at)
# If the scheduler was unavailable for longer than this, skip stale tiers instead of
# surprising the user with delayed reminders after a restart.
REMINDER_DELIVERY_GRACE = timedelta(seconds=max(300, settings.REMINDER_POLL_SECONDS * 2))

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
    """Claim only timely reminders for future scheduled interviews.

    Pending reminders are marked skipped when their interview has already started,
    was made inactive, or the reminder tier is too stale to be useful. This prevents
    a scheduler restart from delivering a burst of old reminder tiers.
    """
    now = datetime.now(timezone.utc)
    stale_cutoff = now - REMINDER_DELIVERY_GRACE

    # These reminders can no longer be useful: the interview is no longer scheduled
    # or its start time has arrived. Keep the rows for auditability.
    expired_interview_ids = select(Interview.id).where(
        (Interview.status != "scheduled") | (Interview.scheduled_at <= now)
    )
    db.execute(
        update(Reminder)
        .where(Reminder.status == "pending", Reminder.interview_id.in_(expired_interview_ids))
        .values(status="skipped")
    )

    # A late tier for an interview that is still upcoming is also skipped once it is
    # outside the grace window; later tiers can still fire at their intended times.
    db.execute(
        update(Reminder)
        .where(
            Reminder.status == "pending",
            Reminder.scheduled_for <= stale_cutoff,
            Reminder.interview_id.in_(select(Interview.id).where(
                Interview.status == "scheduled", Interview.scheduled_at > now
            )),
        )
        .values(status="skipped")
    )

    stmt = (
        select(Reminder)
        .join(Interview, Reminder.interview_id == Interview.id)
        .where(
            Reminder.status == "pending",
            Reminder.scheduled_for <= now,
            Interview.status == "scheduled",
            Interview.scheduled_at > now,
        )
        .with_for_update(skip_locked=True, of=Reminder)
    )
    due = list(db.execute(stmt).scalars().all())
    for reminder in due:
        reminder.status = "delivered"
        reminder.delivered_at = now
    db.commit()
    return due


def _has_newer_delivered_reminder():
    newer_delivered = aliased(Reminder)
    return (
        select(newer_delivered.id)
        .where(
            newer_delivered.interview_id == Reminder.interview_id,
            newer_delivered.status.in_(("delivered", "acknowledged")),
            newer_delivered.scheduled_for > Reminder.scheduled_for,
        )
        .exists()
    )


def count_active_reminders(db: Session, owner_id: uuid.UUID, now: datetime | None = None) -> int:
    """Count interviews with one current reminder using the same rules as the alert list."""
    now = now or datetime.now(timezone.utc)
    stmt = (
        select(func.count(func.distinct(Interview.id)))
        .select_from(Reminder)
        .join(Interview, Reminder.interview_id == Interview.id)
        .where(
            Interview.owner_id == owner_id,
            Interview.status == "scheduled",
            Interview.scheduled_at > now,
            Reminder.status == "delivered",
            Reminder.acknowledged_at.is_(None),
            ~_has_newer_delivered_reminder(),
        )
    )
    return int(db.execute(stmt).scalar_one())


def list_active_reminders(db: Session, owner_id: uuid.UUID) -> list[ReminderResponse]:
    """Return at most the latest delivered, unacknowledged reminder per upcoming
    scheduled interview, scoped to this HR account. Acknowledging the latest tier
    must not cause an older tier for the same interview to reappear.
    """
    now = datetime.now(timezone.utc)
    stmt = (
        select(Reminder, Interview, Candidate)
        .join(Interview, Reminder.interview_id == Interview.id)
        .join(Candidate, Interview.candidate_id == Candidate.id)
        .where(
            Reminder.status == "delivered",
            Reminder.acknowledged_at.is_(None),
            Interview.owner_id == owner_id,
            Interview.status == "scheduled",
            Interview.scheduled_at > now,
            ~_has_newer_delivered_reminder(),
        )
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
