from sqlalchemy.orm import Session

from app.repositories.exam_question_repository import ExamQuestionRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.exam_repository import ExamRepository
from app.exceptions.exam import ExamNotFoundException
from app.exceptions.exam_question import NotEnoughQuestionsException


class ExamQuestionService:

    def __init__(self):
        self.question_repo = QuestionRepository()
        self.exam_repo = ExamRepository()
        self.exam_question_repo = ExamQuestionRepository()

    def assign_random_questions(
        self,
        db: Session,
        exam_public_id,
        subject,
        difficulty,
        question_count,
    ):
        exam = self.exam_repo.get_exam_by_public_id(
            db,
            exam_public_id,
        )

        if exam is None:
            raise ExamNotFoundException()

        questions = self.question_repo.get_random_questions(
            db=db,
            subject=subject,
            difficulty=difficulty,
            limit=question_count,
        )

        if len(questions) < question_count:
            raise NotEnoughQuestionsException(
                requested=question_count,
                available=len(questions),
            )

        self.exam_question_repo.delete_existing_questions(
            db=db,
            exam_id=exam.id,
        )

        return self.exam_question_repo.assign_questions(
            db=db,
            exam_id=exam.id,
            questions=questions,
        )