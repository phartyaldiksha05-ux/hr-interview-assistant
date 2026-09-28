import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

ParseStatus = Literal["not_started", "processing", "completed", "failed"]


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    candidate_id: uuid.UUID
    original_filename: str
    file_size_bytes: int | None
    parse_status: ParseStatus
    parse_error: str | None
    extracted_text: str | None
    parsed_data: dict | None
    created_at: datetime
