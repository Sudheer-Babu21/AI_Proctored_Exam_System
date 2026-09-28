from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.core.enums import SessionStatus, ResultStatus


class StartExamRequest(BaseModel):
    pass


class StartExamResponse(BaseModel):
    session_id: UUID
    exam_id: UUID
    duration_minutes: int
    total_questions: int
    message: str


class DisqualifySessionRequest(BaseModel):
    reason: str = "Disqualified for integrity violations."


class SessionListItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: UUID
    exam_id: int
    exam_public_id: UUID | None = None
    exam_title: str | None = None
    subject: str | None = None
    student_id: int
    student_name: str | None = None
    student_email: str | None = None
    status: SessionStatus
    start_time: datetime
    end_time: datetime | None = None
    total_marks: float | None = None
    obtained_marks: float | None = None
    percentage: float | None = None
    result_status: ResultStatus | None = None
    proctor_events_count: int = 0
    max_suspicion_score: float = 0.0