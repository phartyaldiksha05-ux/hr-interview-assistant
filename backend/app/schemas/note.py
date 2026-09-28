import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Recommendation = Literal["pending", "selected", "rejected", "hold"]


class NoteCreate(BaseModel):
    content: str = Field(min_length=1)
    rating: int | None = Field(default=None, ge=1, le=5)
    recommendation: Recommendation | None = None


class NoteUpdate(BaseModel):
    content: str | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    recommendation: Recommendation | None = None


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    interview_id: uuid.UUID
    content: str
    rating: int | None
    recommendation: Recommendation | None
    created_at: datetime
    updated_at: datetime
