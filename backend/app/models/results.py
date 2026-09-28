from datetime import datetime, timezone
from sqlalchemy import Integer, Float, DateTime, ForeignKey
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.mixins import UUIDMixin, TimestampMixin
from app.core.enums import ResultStatus
from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Result(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "results"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    exam_session_id: Mapped[int] = mapped_column(
        ForeignKey("exam_sessions.id"),
        unique=True,
        nullable=False,
    )

    total_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    percentage: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    status: Mapped[ResultStatus] = mapped_column(
        SqlEnum(ResultStatus),
        nullable=False,
    )

    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
    )

    exam_session = relationship(
        "ExamSession",
        back_populates="result",
    )

    max_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    ai_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    examiner_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    final_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )