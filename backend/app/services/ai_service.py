import uuid
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.client import AIConfigError, AIGenerationError
from app.ai.generators import (
    generate_candidate_summary,
    generate_interview_questions,
    generate_post_interview_summary,
)
from app.models.ai_generation import AIGeneration
from app.models.candidate import Candidate
from app.models.interview import Interview
from app.models.interview_note import InterviewNote
from app.services.resume_service import get_latest_resume

logger = logging.getLogger(__name__)


def _record(db: Session, **kwargs) -> AIGeneration:
    kwargs.setdefault("created_at", datetime.now(timezone.utc))
    gen = AIGeneration(**kwargs)
    db.add(gen)
    db.commit()
    db.refresh(gen)
    return gen


def run_candidate_summary(db: Session, candidate: Candidate) -> AIGeneration:
    resume = get_latest_resume(db, candidate.id)
    if resume is None or not resume.extracted_text:
        return _record(
            db, candidate_id=candidate.id, kind="candidate_summary", status="failed",
            error_message="No parsed resume text available for this candidate.",
        )
    try:
        content, model, latency = generate_candidate_summary(resume.extracted_text, candidate.job_role)
        candidate.summary_status = "completed"
        db.commit()
        return _record(
            db, candidate_id=candidate.id, kind="candidate_summary", status="completed",
            content=content, model_name=model, latency_ms=latency,
        )
    except AIConfigError as exc:
        logger.warning("Candidate briefing unavailable (%s)", type(exc).__name__)
        candidate.summary_status = "failed"
        db.commit()
        return _record(db, candidate_id=candidate.id, kind="candidate_summary", status="failed", error_message="AI generation is not configured for this workspace.")
    except AIGenerationError as exc:
        logger.warning("Candidate briefing failed (%s)", type(exc).__name__)
        candidate.summary_status = "failed"
        db.commit()
        return _record(db, candidate_id=candidate.id, kind="candidate_summary", status="failed", error_message="The AI provider could not complete the briefing. Retry in a moment.")


def run_candidate_questions(
    db: Session,
    candidate: Candidate,
    target_job_role: str | None = None,
    interview: Interview | None = None,
) -> AIGeneration:
    resume = get_latest_resume(db, candidate.id)
    if resume is None or not resume.extracted_text:
        return _record(
            db,
            interview_id=interview.id if interview else None,
            candidate_id=candidate.id,
            kind="interview_questions",
            status="failed",
            error_message="No parsed resume text is available. Upload a text-based PDF before generating candidate-grounded questions.",
        )
    resume_text = resume.extracted_text
    try:
        content, model, latency = generate_interview_questions(
            resume_text, target_job_role or candidate.job_role
        )
        return _record(
            db, interview_id=interview.id if interview else None, candidate_id=candidate.id, kind="interview_questions",
            status="completed", content=content, model_name=model, latency_ms=latency,
        )
    except AIConfigError as exc:
        logger.warning("Interview question generation unavailable (%s)", type(exc).__name__)
        return _record(db, interview_id=interview.id if interview else None, candidate_id=candidate.id, kind="interview_questions", status="failed", error_message="AI generation is not configured for this workspace.")
    except AIGenerationError as exc:
        logger.warning("Interview question generation failed (%s)", type(exc).__name__)
        return _record(db, interview_id=interview.id if interview else None, candidate_id=candidate.id, kind="interview_questions", status="failed", error_message="The AI provider could not generate questions. Retry in a moment.")


def run_interview_questions(
    db: Session, interview: Interview, candidate: Candidate, target_job_role: str | None = None
) -> AIGeneration:
    return run_candidate_questions(db, candidate, target_job_role, interview)


def save_candidate_questions(db: Session, candidate: Candidate, questions: list[dict]) -> AIGeneration:
    return _record(
        db,
        candidate_id=candidate.id,
        kind="interview_questions",
        status="completed",
        content={"questions": questions},
    )


def run_post_interview_summary(db: Session, interview: Interview, candidate: Candidate) -> AIGeneration:
    notes = db.execute(
        select(InterviewNote).where(InterviewNote.interview_id == interview.id).order_by(InterviewNote.created_at)
    ).scalars().all()
    if not notes:
        return _record(
            db, interview_id=interview.id, kind="post_interview_summary", status="failed",
            error_message="No interview notes recorded yet.",
        )
    notes_text = "\n---\n".join(
        "\n".join((
            f"Recorded HR note: {note.content}",
            f"Interviewer rating: {note.rating if note.rating is not None else 'not recorded'}",
            f"Interviewer feedback: {note.recommendation or 'not recorded'}",
        ))
        for note in notes
    )
    try:
        content, model, latency = generate_post_interview_summary(notes_text)
        return _record(
            db, interview_id=interview.id, candidate_id=candidate.id, kind="post_interview_summary",
            status="completed", content=content, model_name=model, latency_ms=latency,
        )
    except AIConfigError as exc:
        logger.warning("Post-interview summary unavailable (%s)", type(exc).__name__)
        return _record(db, interview_id=interview.id, candidate_id=candidate.id, kind="post_interview_summary", status="failed", error_message="AI generation is not configured for this workspace.")
    except AIGenerationError as exc:
        logger.warning("Post-interview summary failed (%s)", type(exc).__name__)
        return _record(db, interview_id=interview.id, candidate_id=candidate.id, kind="post_interview_summary", status="failed", error_message="The AI provider could not complete the summary. Retry in a moment.")


def save_post_interview_summary(
    db: Session, interview: Interview, candidate: Candidate, content: dict
) -> AIGeneration:
    return _record(
        db,
        interview_id=interview.id,
        candidate_id=candidate.id,
        kind="post_interview_summary",
        status="completed",
        content=content,
    )


def get_latest_generation(
    db: Session,
    kind: str,
    candidate_id: uuid.UUID | None = None,
    interview_id: uuid.UUID | None = None,
    status: str | None = None,
) -> AIGeneration | None:
    stmt = select(AIGeneration).where(AIGeneration.kind == kind)
    if candidate_id:
        stmt = stmt.where(AIGeneration.candidate_id == candidate_id)
    if interview_id:
        stmt = stmt.where(AIGeneration.interview_id == interview_id)
    if status:
        stmt = stmt.where(AIGeneration.status == status)
    stmt = stmt.order_by(AIGeneration.created_at.desc()).limit(1)
    return db.execute(stmt).scalar_one_or_none()


def get_latest_candidate_questions(db: Session, candidate_id: uuid.UUID) -> AIGeneration | None:
    stmt = (
        select(AIGeneration)
        .where(
            AIGeneration.kind == "interview_questions",
            AIGeneration.candidate_id == candidate_id,
            AIGeneration.interview_id.is_(None),
        )
        .order_by(AIGeneration.created_at.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()
