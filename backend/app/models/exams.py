from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.db.mixins import UUIDMixin, TimestampMixin, SoftDeleteMixin


class Exam(
    Base,
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin,
):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    subject: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    total_marks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    pass_marks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    negative_marking: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    shuffle_questions: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    shuffle_options: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    end_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    creator = relationship(
        "User",
        back_populates="created_exams",
    )

    exam_questions = relationship(
        "ExamQuestion",
        back_populates="exam",
        cascade="all, delete-orphan",
    )

    exam_sessions = relationship(
        "ExamSession",
        back_populates="exam",
        cascade="all, delete-orphan",
    )