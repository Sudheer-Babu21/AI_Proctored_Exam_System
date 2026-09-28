from uuid import UUID
from pydantic import BaseModel, ConfigDict


class StudentOptionResponse(BaseModel):
    id: int
    option_text: str

    model_config = ConfigDict(from_attributes=True)


class StudentQuestionResponse(BaseModel):
    public_id: UUID
    question_text: str
    question_type: str
    marks: float
    options: list[StudentOptionResponse]

    model_config = ConfigDict(from_attributes=True)


class StudentExamResponse(BaseModel):
    session_id: UUID
    exam_id: UUID
    exam_title: str | None = None
    duration_minutes: int | None = None
    remaining_seconds: int | None = None
    questions: list[StudentQuestionResponse]

    model_config = ConfigDict(from_attributes=True)