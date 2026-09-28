from typing import Optional
from pydantic import model_validator
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.enums import DifficultyLevel, QuestionType

class OptionCreate(BaseModel):
    option_text: str = Field(..., min_length=1, max_length=500)
    is_correct: bool = False

class OptionResponse(BaseModel):
    id: int
    option_text: str
    is_correct: bool

    model_config = ConfigDict(from_attributes=True)

class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=5)

    question_type: QuestionType

    difficulty: DifficultyLevel

    subject: str = Field(..., min_length=2, max_length=100)

    topic: Optional[str] = None

    marks: float = Field(..., gt=0)

    negative_marks: float = Field(default=0, ge=0)

    model_answer: Optional[str] = None

    explanation: Optional[str] = None

    image_path: Optional[str] = None

    language: str = "English"

    options: list[OptionCreate] = []

    @field_validator("options")
    @classmethod
    def validate_options(cls, options):
        if not options:
            return options

        if len(options) < 2:
            raise ValueError(
                "At least 2 options are required."
            )

        correct_options = sum(
            option.is_correct
            for option in options
        )

        if correct_options == 0:
            raise ValueError(
                "At least one option must be correct."
            )

        return options

    @model_validator(mode="after")
    def validate_question(self):

        if self.question_type == QuestionType.MCQ:

            if len(self.options) < 2:
                raise ValueError("MCQ requires at least 2 options.")

            if sum(option.is_correct for option in self.options) != 1:
                raise ValueError("MCQ must have exactly one correct option.")

        elif self.question_type == QuestionType.MULTI_SELECT:

            if len(self.options) < 2:
                raise ValueError("Multi Select requires at least 2 options.")

            if sum(option.is_correct for option in self.options) < 2:
                raise ValueError(
                    "Multi Select requires at least 2 correct options."
                )

        elif self.question_type == QuestionType.TRUE_FALSE:

            if len(self.options) != 2:
                raise ValueError(
                    "True/False must contain exactly 2 options."
                )

            if sum(option.is_correct for option in self.options) != 1:
                raise ValueError(
                    "True/False must have exactly one correct answer."
                )

        else:
            if self.options:
                raise ValueError(
                    "Subjective questions should not contain options."
                )

        return self

class QuestionUpdate(BaseModel):

    question_text: Optional[str] = Field(
        None,
        min_length=5
    )

    question_type: Optional[QuestionType] = None

    difficulty: Optional[DifficultyLevel] = None

    subject: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100
    )

    topic: Optional[str] = None

    marks: Optional[float] = Field(
        None,
        gt=0
    )

    negative_marks: Optional[float] = Field(
        None,
        ge=0
    )

    model_answer: Optional[str] = None

    explanation: Optional[str] = None

    image_path: Optional[str] = None

    language: Optional[str] = None

    is_active: Optional[bool] = None

    options: Optional[list[OptionCreate]] = None

class QuestionResponse(BaseModel):

    id: int

    public_id: str

    question_text: str

    question_type: QuestionType

    difficulty: DifficultyLevel

    subject: str

    topic: Optional[str]

    marks: float

    negative_marks: float

    model_answer: Optional[str]

    explanation: Optional[str]

    image_path: Optional[str]

    language: str

    is_active: bool

    created_by: int

    options: list[OptionResponse]

    model_config = ConfigDict(
        from_attributes=True
    )