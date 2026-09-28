from pydantic import BaseModel, Field

class AssignQuestionsRequest(BaseModel):

    subject: str = Field(..., min_length=2)

    difficulty: str = Field(...)

    question_count: int = Field(
        ...,
        gt=0,
        le=200
    )

class AssignQuestionsResponse(BaseModel):

    exam_id: int

    assigned_questions: int

    message: str