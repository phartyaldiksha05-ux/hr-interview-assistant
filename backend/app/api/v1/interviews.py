import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.interview import InterviewCreate, InterviewResponse, InterviewUpdate
from app.services import interview_service

router = APIRouter(prefix="/interviews", tags=["interviews"])


@router.get("", response_model=list[InterviewResponse])
def list_interviews(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return interview_service.list_interviews(db, owner_id=current_user.id, skip=skip, limit=limit)


@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(
    payload: InterviewCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    candidate = interview_service.get_candidate_or_none(db, payload.candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Candidate {payload.candidate_id} not found")
    return interview_service.create_interview(db, current_user.id, candidate, payload)


@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(
    interview_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    interview = interview_service.get_interview(db, interview_id, owner_id=current_user.id)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    return interview


@router.patch("/{interview_id}", response_model=InterviewResponse)
def update_interview(
    interview_id: uuid.UUID,
    payload: InterviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = interview_service.update_interview(db, interview_id, current_user.id, payload)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    return interview


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(
    interview_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if not interview_service.delete_interview(db, interview_id, owner_id=current_user.id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
