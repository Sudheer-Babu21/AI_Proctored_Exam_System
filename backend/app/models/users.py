from sqlalchemy import String
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.db.mixins import UUIDMixin, TimestampMixin, SoftDeleteMixin
from app.core.enums import UserRole


class User(
    Base,
    UUIDMixin,
    TimestampMixin,
    SoftDeleteMixin
):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole),
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False
    )

    is_verified: Mapped[bool] = mapped_column(
        default=False,
        nullable=False
    )

    exam_sessions = relationship(
        "ExamSession",
        back_populates="student",
        cascade="all, delete-orphan"
    )

    created_exams = relationship(
        "Exam",
        back_populates="creator"
    )

    created_questions = relationship(
        "QuestionBank",
        back_populates="creator"
    )