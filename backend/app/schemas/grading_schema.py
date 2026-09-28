from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EvaluateAnswerRequest(BaseModel):
    marks_awarded: float = Field(
        ...,
        ge=0,
        description="Marks awarded by examiner",
    )

    feedback: str | None = Field(
        default=None,
        max_length=1000,
        description="Examiner feedback",
    )


class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: UUID
    exam_session_id: int | None = None
    session_public_id: UUID | None = None
    question_id: int | None = None
    question_text: str | None = None
    question_type: str | None = None
    max_marks: float | None = None
    model_answer: str | None = None
    answer_text: str | None = None
    image_url: str | None = None
    marks_awarded: float = 0.0
    feedback: str | None = None
    ai_score: float | None = None
    ai_justification: str | None = None
    student_name: str | None = None
    submitted_at: datetime