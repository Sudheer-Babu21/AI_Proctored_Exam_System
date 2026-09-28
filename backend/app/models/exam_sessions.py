from datetime import datetime
from sqlalchemy import Enum as SqlEnum
from sqlalchemy import Integer, String, DateTime, ForeignKey
from app.core.enums import SessionStatus
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.mixins import UUIDMixin, TimestampMixin
from app.db.database import Base


class ExamSession(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "exam_sessions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    exam_id: Mapped[int] = mapped_column(
        ForeignKey("exams.id"),
        nullable=False
    )

    session_token: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    end_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )

    status: Mapped[SessionStatus] = mapped_column(
        SqlEnum(SessionStatus),
        default=SessionStatus.IN_PROGRESS,
        nullable=False
    )

    exam = relationship(
        "Exam",
        back_populates="exam_sessions"
    )

    student = relationship(
        "User",
        back_populates="exam_sessions"
    )

    answers = relationship(
        "Answer",
        back_populates="exam_session",
        cascade="all, delete-orphan"
    )

    result = relationship(
        "Result",
        back_populates="exam_session",
        uselist=False,
        cascade="all, delete-orphan"
    )

    proctor_events = relationship(
        "ProctorEvent",
        back_populates="exam_session",
        cascade="all, delete-orphan",
    )