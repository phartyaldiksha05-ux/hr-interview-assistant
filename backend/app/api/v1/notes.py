import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.interview_note import InterviewNote
from app.models.user import User
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.services import interview_service

router = APIRouter(prefix="/interviews", tags=["notes"])


@router.get("/{interview_id}/notes", response_model=list[NoteResponse])
def list_notes(
    interview_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    interview = interview_service.get_interview_or_none(db, interview_id, owner_id=current_user.id)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    stmt = select(InterviewNote).where(InterviewNote.interview_id == interview_id).order_by(InterviewNote.created_at)
    return list(db.execute(stmt).scalars().all())


@router.post("/{interview_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    interview_id: uuid.UUID,
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = interview_service.get_interview_or_none(db, interview_id, owner_id=current_user.id)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    note = InterviewNote(interview_id=interview_id, **payload.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.patch("/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(InterviewNote).where(InterviewNote.id == note_id)
    note = db.execute(stmt).scalar_one_or_none()
    if note is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found")
    # Ownership check goes through the parent interview, since notes have no owner_id of their own.
    if interview_service.get_interview_or_none(db, note.interview_id, owner_id=current_user.id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return note
