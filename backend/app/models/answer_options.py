from sqlalchemy import Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class AnswerOption(Base):
    __tablename__ = "answer_options"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    answer_id: Mapped[int] = mapped_column(
        ForeignKey("answers.id"),
        nullable=False
    )

    option_id: Mapped[int] = mapped_column(
        ForeignKey("options.id"),
        nullable=False
    )

    answer = relationship(
        "Answer",
        back_populates="selected_options"
    )

    option = relationship(
        "Option"
    )

    __table_args__ = (
        UniqueConstraint(
            "answer_id",
            "option_id",
            name="uq_answer_option"
        ),
    )