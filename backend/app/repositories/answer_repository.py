from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.answers import Answer
from app.models.answer_options import AnswerOption


class AnswerRepository:

    def create_answer(
        self,
        db: Session,
        exam_session_id: int,
        question_id: int,
        answer_text: str | None = None,
        image_url: str | None = None,
    ):
        answer = Answer(
            exam_session_id=exam_session_id,
            question_id=question_id,
            answer_text=answer_text,
            image_url=image_url,
        )

        db.add(answer)
        db.commit()
        db.refresh(answer)

        return answer

    def get_answer(
        self,
        db: Session,
        exam_session_id: int,
        question_id: int,
    ):
        result = db.execute(
            select(Answer).where(
                Answer.exam_session_id == exam_session_id,
                Answer.question_id == question_id,
            )
        )

        return result.scalar_one_or_none()

    def update_answer(
        self,
        db: Session,
        answer: Answer,
        answer_text: str | None = None,
        image_url: str | None = None,
    ):
        answer.answer_text = answer_text
        answer.image_url = image_url

        db.commit()
        db.refresh(answer)

        return answer

    def update_image(
        self,
        db: Session,
        answer: Answer,
        image_url: str,
    ):
        answer.image_url = image_url

        db.commit()
        db.refresh(answer)

        return answer

    def get_answers_by_session(
        self,
        db: Session,
        exam_session_id: int,
    ):
        result = db.execute(
            select(Answer)
            .where(
                Answer.exam_session_id == exam_session_id
            )
            .options(
                joinedload(Answer.selected_options)
                .joinedload(AnswerOption.option)
            )
        )

        return result.unique().scalars().all()