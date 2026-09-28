import uuid

from pydantic import BaseModel, ConfigDict, Field


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    interview_id: uuid.UUID
    question_text: str
    category: str
    rationale: str | None
    order_index: int


class QuestionCreate(BaseModel):
    question_text: str = Field(min_length=1, max_length=2000)
    category: str = Field(default="technical", min_length=1, max_length=30)
    rationale: str | None = Field(default=None, max_length=2000)
