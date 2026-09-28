from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

class ExamCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str | None = None

    subject: str
    duration_minutes: int = Field(..., gt=0)

    total_marks: int = Field(..., gt=0)
    pass_marks: int = Field(..., ge=0)

    negative_marking: bool = False
    shuffle_questions: bool = True
    shuffle_options: bool = True

    start_time: datetime
    end_time: datetime

class ExamUpdate(BaseModel):
    title: str | None = None
    description: str | None = None

    duration_minutes: int | None = None

    total_marks: int | None = None
    pass_marks: int | None = None

    negative_marking: bool | None = None
    shuffle_questions: bool | None = None
    shuffle_options: bool | None = None

    start_time: datetime | None = None
    end_time: datetime | None = None

class ExamResponse(BaseModel):
    id: int
    public_id: str

    title: str
    description: str | None

    subject: str

    duration_minutes: int

    total_marks: int
    pass_marks: int

    negative_marking: bool
    shuffle_questions: bool
    shuffle_options: bool

    start_time: datetime
    end_time: datetime

    is_active: bool

    model_config = ConfigDict(from_attributes=True)