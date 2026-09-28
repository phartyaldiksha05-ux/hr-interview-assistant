import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

ReminderType = Literal["24_hour", "1_hour", "15_minute", "at_time"]
ReminderStatus = Literal["pending", "delivered", "acknowledged", "cancelled", "skipped"]


class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    interview_id: uuid.UUID
    reminder_type: ReminderType
    scheduled_for: datetime
    status: ReminderStatus
    delivered_at: datetime | None
    acknowledged_at: datetime | None

    candidate_name: str
    candidate_role: str
    interview_scheduled_at: datetime
    meeting_link: str | None
