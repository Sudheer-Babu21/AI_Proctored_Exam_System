from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.enums import QuestionType
from app.models.answers import Answer
from app.models.exam_sessions import ExamSession
from app.models.question_bank import QuestionBank


class GradingRepository:

    def get_pending_answers(
        self,
        db: Session,
    ):
        result = db.execute(
            select(Answer)
            .join(QuestionBank)
            .options(
                joinedload(Answer.question),
                joinedload(Answer.exam_session).joinedload(ExamSession.student),
            )
            .where(
                QuestionBank.question_type.in_(
                    [
                        QuestionType.SHORT_ANSWER,
                        QuestionType.LONG_ANSWER,
                        QuestionType.IMAGE_UPLOAD,
                    ]
                ),
                (Answer.feedback.is_(None)) | (Answer.feedback.like("[AI Draft]%")),
            )
            .order_by(
                Answer.submitted_at.asc()
            )
        )

        return result.unique().scalars().all()

    def get_answer_by_public_id(
        self,
        db: Session,
        public_id,
    ):
        result = db.execute(
            select(Answer)
            .options(
                joinedload(Answer.question),
                joinedload(Answer.exam_session).joinedload(ExamSession.student),
            )
            .where(
                Answer.public_id == str(public_id)
            )
        )

        return result.scalar_one_or_none()

    def evaluate_answer(
        self,
        db: Session,
        answer: Answer,
        marks_awarded: float,
        feedback: str | None = None,
    ):
        answer.marks_awarded = marks_awarded
        answer.feedback = f"[Examiner Reviewed]: {feedback.strip()}" if feedback else "[Examiner Reviewed]: Evaluation completed."

        db.commit()
        db.refresh(answer)

        return answer

    def get_reviewed_answers(
        self,
        db: Session,
    ):
        result = db.execute(
            select(Answer)
            .join(QuestionBank)
            .options(
                joinedload(Answer.question),
                joinedload(Answer.exam_session).joinedload(ExamSession.student),
            )
            .where(
                QuestionBank.question_type.in_(
                    [
                        QuestionType.SHORT_ANSWER,
                        QuestionType.LONG_ANSWER,
                        QuestionType.IMAGE_UPLOAD,
                    ]
                ),
                Answer.feedback.isnot(None),
                ~Answer.feedback.like("[AI Draft]%"),
            )
            .order_by(
                Answer.submitted_at.desc()
            )
        )

        return result.unique().scalars().all()