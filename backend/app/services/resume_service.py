import uuid

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.pdf import PDFExtractionError, extract_text
from app.core.storage import save_upload
from app.models.resume import Resume


def upload_and_extract(db: Session, candidate_id: uuid.UUID, filename: str, content: bytes) -> Resume:
    """Synchronous for this MVP (simple + reliable for a portfolio project). A production
    version would run extraction in a BackgroundTask and poll parse_status, the same
    pattern the reminder scheduler already demonstrates."""
    path = save_upload(candidate_id, filename, content)
    resume = Resume(
        candidate_id=candidate_id,
        original_filename=filename,
        storage_path=path,
        file_size_bytes=len(content),
        parse_status="processing",
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    try:
        text = extract_text(content)
        resume.extracted_text = text
        resume.parse_status = "completed"
    except PDFExtractionError as exc:
        resume.parse_status = "failed"
        resume.parse_error = str(exc)

    db.commit()
    db.refresh(resume)
    return resume


def list_resumes(db: Session, candidate_id: uuid.UUID) -> list[Resume]:
    stmt = select(Resume).where(Resume.candidate_id == candidate_id).order_by(Resume.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def get_resume(db: Session, candidate_id: uuid.UUID, resume_id: uuid.UUID) -> Resume | None:
    stmt = select(Resume).where(Resume.id == resume_id, Resume.candidate_id == candidate_id)
    return db.execute(stmt).scalar_one_or_none()


def get_latest_resume(db: Session, candidate_id: uuid.UUID) -> Resume | None:
    stmt = (
        select(Resume)
        .where(Resume.candidate_id == candidate_id, Resume.parse_status == "completed")
        .order_by(Resume.created_at.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()
