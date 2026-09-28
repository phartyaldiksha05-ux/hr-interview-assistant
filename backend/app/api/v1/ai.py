import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.ai import AIGenerationResponse, PostInterviewSummaryContent, QuestionGenerationRequest, QuestionSaveItem
from app.services import ai_service, candidate_service, interview_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/candidates/{candidate_id}/summary", response_model=AIGenerationResponse)
def generate_summary(
    candidate_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    return ai_service.run_candidate_summary(db, candidate)


@router.get("/candidates/{candidate_id}/summary", response_model=AIGenerationResponse | None)
def get_summary(
    candidate_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    return ai_service.get_latest_generation(db, "candidate_summary", candidate_id=candidate_id)


@router.get("/candidates/{candidate_id}/questions", response_model=AIGenerationResponse | None)
def get_candidate_questions(
    candidate_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    return ai_service.get_latest_candidate_questions(db, candidate_id)


@router.post("/candidates/{candidate_id}/questions", response_model=AIGenerationResponse)
def generate_candidate_questions(
    candidate_id: uuid.UUID,
    payload: QuestionGenerationRequest = QuestionGenerationRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    return ai_service.run_candidate_questions(db, candidate, payload.target_job_role)


@router.put("/candidates/{candidate_id}/questions", response_model=AIGenerationResponse)
def save_candidate_questions(
    candidate_id: uuid.UUID,
    payload: list[QuestionSaveItem],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = candidate_service.get_candidate(db, candidate_id, owner_id=current_user.id)
    if candidate is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Candidate not found")
    if len(payload) > 50:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "At most 50 questions can be saved.")
    questions = [item.model_dump() for item in payload if item.question_text.strip()]
    return ai_service.save_candidate_questions(db, candidate, questions)


@router.post("/interviews/{interview_id}/questions", response_model=AIGenerationResponse)
def generate_questions(
    interview_id: uuid.UUID,
    payload: QuestionGenerationRequest = QuestionGenerationRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = interview_service.get_interview_or_none(db, interview_id, owner_id=current_user.id)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    candidate = db.get(Candidate, interview.candidate_id)
    return ai_service.run_interview_questions(db, interview, candidate, payload.target_job_role)


@router.post("/interviews/{interview_id}/post-summary", response_model=AIGenerationResponse)
def generate_post_summary(
    interview_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    interview = interview_service.get_interview_or_none(db, interview_id, owner_id=current_user.id)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    candidate = db.get(Candidate, interview.candidate_id)
    return ai_service.run_post_interview_summary(db, interview, candidate)


@router.get("/interviews/{interview_id}/post-summary", response_model=AIGenerationResponse | None)
def get_post_summary(
    interview_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    interview = interview_service.get_interview_or_none(db, interview_id, owner_id=current_user.id)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    return ai_service.get_latest_generation(
        db, "post_interview_summary", interview_id=interview_id, status="completed"
    )


@router.put("/interviews/{interview_id}/post-summary", response_model=AIGenerationResponse)
def save_post_summary(
    interview_id: uuid.UUID,
    payload: PostInterviewSummaryContent,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = interview_service.get_interview_or_none(db, interview_id, owner_id=current_user.id)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    candidate = db.get(Candidate, interview.candidate_id)
    return ai_service.save_post_interview_summary(db, interview, candidate, payload.model_dump())
