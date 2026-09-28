from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    exam_id: Mapped[int] = mapped_column(
        ForeignKey("exams.id"),
        nullable=False
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey("question_bank.id"),
        nullable=False
    )

    question_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    exam = relationship(
        "Exam",
        back_populates="exam_questions"
    )

    question = relationship(
        "QuestionBank",
        back_populates="exam_questions"
    )