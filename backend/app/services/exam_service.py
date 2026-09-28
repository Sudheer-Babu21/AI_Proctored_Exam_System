from uuid import UUID
from sqlalchemy.orm import Session

from app.models.exams import Exam
from app.repositories.exam_repository import ExamRepository
from app.schemas.exam_schema import (
    ExamCreate,
    ExamUpdate,
)
from app.exceptions.exam import ExamNotFoundException


class ExamService:

    def __init__(self):
        self.repository = ExamRepository()

    def create_exam(
        self,
        db: Session,
        exam_data: ExamCreate,
        created_by: int,
    ) -> Exam:
        return self.repository.create_exam(
            db=db,
            exam_data=exam_data,
            created_by=created_by,
        )

    def get_exam_by_public_id(
        self,
        db: Session,
        public_id: UUID,
    ) -> Exam:
        exam = self.repository.get_exam_by_public_id(
            db=db,
            public_id=public_id,
        )

        if exam is None:
            raise ExamNotFoundException()

        return exam

    def get_all_exams(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 10,
    ):
        return self.repository.get_all_exams(
            db=db,
            skip=skip,
            limit=limit,
        )

    def update_exam(
        self,
        db: Session,
        public_id: UUID,
        exam_data: ExamUpdate,
    ) -> Exam:
        exam = self.repository.get_exam_by_public_id(
            db=db,
            public_id=public_id,
        )

        if exam is None:
            raise ExamNotFoundException()

        return self.repository.update_exam(
            db=db,
            exam=exam,
            exam_data=exam_data,
        )

    def delete_exam(
        self,
        db: Session,
        public_id: UUID,
    ) -> Exam:
        exam = self.repository.get_exam_by_public_id(
            db=db,
            public_id=public_id,
        )

        if exam is None:
            raise ExamNotFoundException()

        return self.repository.delete_exam(
            db=db,
            exam=exam,
        )