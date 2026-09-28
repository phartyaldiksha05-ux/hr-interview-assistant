import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

InterviewStatus = Literal["scheduled", "completed", "cancelled", "no_show"]
InterviewType = Literal["video", "phone", "onsite"]


class InterviewCreate(BaseModel):
    candidate_id: uuid.UUID
    scheduled_at: datetime
    duration_minutes: int = Field(default=60, gt=0, le=480)
    interview_type: InterviewType = "video"
    meeting_link: str | None = Field(default=None, max_length=500)
    interviewer: str | None = Field(default=None, max_length=150)

    @field_validator("scheduled_at")
    @classmethod
    def require_timezone(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("scheduled_at must include a timezone offset, e.g. 2026-09-20T11:00:00+05:30")
        return v


class InterviewUpdate(BaseModel):
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(default=None, gt=0, le=480)
    interview_type: InterviewType | None = None
    meeting_link: str | None = Field(default=None, max_length=500)
    interviewer: str | None = Field(default=None, max_length=150)
    status: InterviewStatus | None = None

    @field_validator("scheduled_at")
    @classmethod
    def require_timezone(cls, v: datetime | None) -> datetime | None:
        if v is not None and v.tzinfo is None:
            raise ValueError("scheduled_at must include a timezone offset")
        return v


class InterviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    candidate_id: uuid.UUID
    candidate_name: str
    candidate_email: str
    candidate_job_role: str
    scheduled_at: datetime
    duration_minutes: int
    interview_type: InterviewType
    meeting_link: str | None
    interviewer: str | None
    status: InterviewStatus
    created_at: datetime
    updated_at: datetime
