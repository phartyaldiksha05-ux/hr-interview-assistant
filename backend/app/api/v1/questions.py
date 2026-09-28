import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.interview_question import InterviewQuestion
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionResponse
from app.models.interview_question import InterviewQuestion
from app.services import interview_service

router = APIRouter(prefix="/interviews", tags=["questions"])


@router.get("/{interview_id}/questions", response_model=list[QuestionResponse])
def list_questions(
    interview_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    interview = interview_service.get_interview_or_none(db, interview_id, owner_id=current_user.id)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    stmt = (
        select(InterviewQuestion)
        .where(InterviewQuestion.interview_id == interview_id)
        .order_by(InterviewQuestion.order_index)
    )
    return list(db.execute(stmt).scalars().all())


@router.put("/{interview_id}/questions", response_model=list[QuestionResponse])
def save_questions(
    interview_id: uuid.UUID,
    payload: list[QuestionCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interview = interview_service.get_interview_or_none(db, interview_id, owner_id=current_user.id)
    if interview is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview not found")
    if len(payload) > 50:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "At most 50 questions can be saved.")

    db.execute(delete(InterviewQuestion).where(InterviewQuestion.interview_id == interview_id))
    questions = [
        InterviewQuestion(
            interview_id=interview_id,
            question_text=item.question_text.strip(),
            category=item.category,
            rationale=item.rationale,
            order_index=index,
        )
        for index, item in enumerate(payload)
        if item.question_text.strip()
    ]
    db.add_all(questions)
    db.commit()
    for question in questions:
        db.refresh(question)
    return questions
