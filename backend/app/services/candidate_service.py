import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.models.resume import Resume
from app.schemas.candidate import CandidateCreate, CandidateUpdate


def _attach_resume_flags(db: Session, candidates: list[Candidate]) -> None:
    if not candidates:
        return
    ids = [c.id for c in candidates]
    resume_ids = set(
        db.execute(
            select(Resume.candidate_id).where(
                Resume.candidate_id.in_(ids), Resume.parse_status == "completed"
            )
        ).scalars().all()
    )
    for c in candidates:
        c.has_resume = c.id in resume_ids


def list_candidates(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 50) -> list[Candidate]:
    stmt = (
        select(Candidate)
        .where(Candidate.owner_id == owner_id, Candidate.deleted_at.is_(None))
        .order_by(Candidate.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    candidates = list(db.execute(stmt).scalars().all())
    _attach_resume_flags(db, candidates)
    return candidates


def list_archived_candidates(db: Session, owner_id: uuid.UUID, skip: int = 0, limit: int = 50) -> list[Candidate]:
    stmt = (
        select(Candidate)
        .where(Candidate.owner_id == owner_id, Candidate.deleted_at.is_not(None))
        .order_by(Candidate.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    candidates = list(db.execute(stmt).scalars().all())
    _attach_resume_flags(db, candidates)
    return candidates


def restore_candidate(db: Session, candidate_id: uuid.UUID, owner_id: uuid.UUID) -> Candidate | None:
    candidate = db.execute(
        select(Candidate).where(
            Candidate.id == candidate_id,
            Candidate.owner_id == owner_id,
            Candidate.deleted_at.is_not(None),
        )
    ).scalar_one_or_none()
    if candidate is None:
        return None
    candidate.deleted_at = None
    db.commit()
    db.refresh(candidate)
    _attach_resume_flags(db, [candidate])
    return candidate


def get_candidate(db: Session, candidate_id: uuid.UUID, owner_id: uuid.UUID) -> Candidate | None:
    """owner_id is always required here — this is what stops one HR account from
    reading another's candidate by guessing/reusing a UUID, not just hiding it from lists."""
    stmt = select(Candidate).where(
        Candidate.id == candidate_id, Candidate.owner_id == owner_id, Candidate.deleted_at.is_(None)
    )
    candidate = db.execute(stmt).scalar_one_or_none()
    if candidate is not None:
        _attach_resume_flags(db, [candidate])
    return candidate


def get_candidate_by_email(db: Session, email: str, owner_id: uuid.UUID) -> Candidate | None:
    stmt = select(Candidate).where(
        func.lower(Candidate.email) == email.lower(),
        Candidate.owner_id == owner_id,
        Candidate.deleted_at.is_(None),
    ).order_by(Candidate.created_at.desc()).limit(1)
    candidate = db.execute(stmt).scalar_one_or_none()
    if candidate is not None:
        _attach_resume_flags(db, [candidate])
    return candidate


def email_taken(db: Session, email: str, owner_id: uuid.UUID, exclude_id: uuid.UUID | None = None) -> bool:
    """Emails remain reserved per-owner, including on soft-deleted candidates, to match
    the database's owner/email unique constraint."""
    stmt = select(Candidate.id).where(
        func.lower(Candidate.email) == email.lower(),
        Candidate.owner_id == owner_id,
    )
    if exclude_id is not None:
        stmt = stmt.where(Candidate.id != exclude_id)
    return db.execute(stmt.limit(1)).scalar_one_or_none() is not None


def create_candidate(db: Session, owner_id: uuid.UUID, data: CandidateCreate) -> Candidate:
    candidate = Candidate(owner_id=owner_id, **data.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


def update_candidate(db: Session, candidate: Candidate, data: CandidateUpdate) -> Candidate:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(candidate, field, value)
    db.commit()
    db.refresh(candidate)
    return candidate


def soft_delete_candidate(db: Session, candidate: Candidate) -> None:
    candidate.deleted_at = func.now()
    db.commit()
