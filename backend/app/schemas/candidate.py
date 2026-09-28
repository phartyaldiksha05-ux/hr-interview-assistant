import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

CandidateStatus = Literal["new", "scheduled", "interviewed", "hired", "rejected"]
SummaryStatus = Literal["not_started", "processing", "completed", "failed"]


class CandidateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    job_role: str = Field(min_length=1, max_length=150)


class CandidateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    job_role: str | None = Field(default=None, min_length=1, max_length=150)
    status: CandidateStatus | None = None


class CandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    email: str
    phone: str | None
    job_role: str
    status: CandidateStatus
    has_resume: bool = False
    summary_status: SummaryStatus
    created_at: datetime
    updated_at: datetime
