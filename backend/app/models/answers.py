from datetime import datetime

from sqlalchemy import Integer, Float, Text, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.mixins import UUIDMixin, TimestampMixin
from app.db.database import Base


class Answer(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    exam_session_id: Mapped[int] = mapped_column(
        ForeignKey("exam_sessions.id"),
        nullable=False
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey("question_bank.id"),
        nullable=False
    )

    answer_text: Mapped[str] = mapped_column(
        Text,
        nullable=True
    )

    image_url: Mapped[str] = mapped_column(
        String(500),
        nullable=True
    )

    marks_awarded: Mapped[float] = mapped_column(
        Float,
        default=0
    )


    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )


    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    exam_session = relationship(
        "ExamSession",
        back_populates="answers"
    )

    question = relationship(
        "QuestionBank",
        back_populates="answers"
    )

    selected_options = relationship(
        "AnswerOption",
        back_populates="answer",
        cascade="all, delete-orphan"
    )