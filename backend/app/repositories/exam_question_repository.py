from sqlalchemy.orm import Session
from sqlalchemy import delete, select, func

from app.models.exam_questions import ExamQuestion


class ExamQuestionRepository:

    def assign_questions(
        self,
        db: Session,
        exam_id: int,
        questions: list,
    ):
        exam_questions = []

        for index, question in enumerate(questions, start=1):
            exam_questions.append(
                ExamQuestion(
                    exam_id=exam_id,
                    question_id=question.id,
                    question_order=index
                )
            )

        db.add_all(exam_questions)
        db.commit()

        return exam_questions

    def delete_existing_questions(
        self,
        db: Session,
        exam_id: int,
    ):
        db.execute(
            delete(ExamQuestion).where(
                ExamQuestion.exam_id == exam_id
            )
        )
        db.commit()

    def count_exam_questions(
        self,
        db: Session,
        exam_id: int,
    ):
        result = db.execute(
            select(func.count())
            .select_from(ExamQuestion)
            .where(
                ExamQuestion.exam_id == exam_id
            )
        )

        return result.scalar_one()