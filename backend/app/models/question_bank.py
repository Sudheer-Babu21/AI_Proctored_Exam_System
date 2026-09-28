from sqlalchemy import (
    Float,
    ForeignKey,
    Integer,
    String,
    Text
)
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.mixins import UUIDMixin, TimestampMixin, SoftDeleteMixin
from app.core.enums import QuestionType, DifficultyLevel


class QuestionBank(
    Base,
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin
):
    __tablename__ = "question_bank"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    question_type: Mapped[QuestionType] = mapped_column(
        SqlEnum(QuestionType),
        nullable=False,
        index=True
    )

    difficulty: Mapped[DifficultyLevel] = mapped_column(
        SqlEnum(DifficultyLevel),
        nullable=False,
        index=True
    )

    subject: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    topic: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True
    )

    marks: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    negative_marks: Mapped[float] = mapped_column(
        Float,
        default=0
    )

    model_answer: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    image_path: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        default=True
    )

    language: Mapped[str] = mapped_column(
        String(20),
        default="English"
    ) 

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    options = relationship(
        "Option",
        back_populates="question",
        cascade="all, delete-orphan"
    )

    exam_questions = relationship(
        "ExamQuestion",
        back_populates="question",
        cascade="all, delete-orphan"
    )

    answers = relationship(
        "Answer",
        back_populates="question"
    )

    creator = relationship(
        "User",
        back_populates="created_questions"
    )

    

