import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import EmailStr
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.candidate import CandidateCreate, CandidateResponse, CandidateUpdate
from app.services import candidate_service

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("", response_model=list[CandidateResponse])
def list_candidates(
    skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return candidate_service.list_candidates(db, owner_id=current_user.id, skip=skip, limit=limit)


@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(
    payload: CandidateCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if candidate_service.email_taken(db, payload.email, owner_id=current_user.id):
        raise HTTPException(status.HTTP_409_CONFLICT, f"A candidate with email '{payload.email}' already exists.")
    return candidate_service.create_candidate(db, current_user.id, payload)


@router.get("/archived", response_model=list[CandidateResponse])
def list_archived_candidates(
    skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return candidate_service.list_archived_candidates(db, owner_id=current_user.id, skip=skip, limit=limit)


@router.post("/{candidate_id}/restore", response_model=CandidateResponse)
def restore_candidate(
    candidate_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    candidate = candidate_service.restore_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Archived candidate not found")
    return candidate


@router.get("/by-email", response_model=CandidateResponse)
def get_candidate_by_email(
    email: EmailStr = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = candidate_service.get_candidate_by_email(db, str(email), owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    return candidate


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(
    candidate_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    return candidate


@router.patch("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: uuid.UUID,
    payload: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    if payload.email and candidate_service.email_taken(db, payload.email, owner_id=current_user.id, exclude_id=candidate_id):
        raise HTTPException(status.HTTP_409_CONFLICT, f"A candidate with email '{payload.email}' already exists.")
    return candidate_service.update_candidate(db, candidate, payload)


@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    candidate_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    candidate_service.soft_delete_candidate(db, candidate)
