from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.exams import Exam
from app.schemas.exam_schema import (
    ExamCreate,
    ExamUpdate,
)

class ExamRepository:
    def create_exam(
        self,
        db: Session,
        exam_data: ExamCreate,
        created_by: int,
    ) -> Exam:

        exam = Exam(
            title=exam_data.title,
            description=exam_data.description,
            subject=exam_data.subject,
            duration_minutes=exam_data.duration_minutes,
            total_marks=exam_data.total_marks,
            pass_marks=exam_data.pass_marks,
            negative_marking=exam_data.negative_marking,
            shuffle_questions=exam_data.shuffle_questions,
            shuffle_options=exam_data.shuffle_options,
            start_time=exam_data.start_time,
            end_time=exam_data.end_time,
            created_by=created_by,
        )

        db.add(exam)
        db.commit()
        db.refresh(exam)

        return exam


    def get_exam_by_public_id(
        self,
        db: Session,
        public_id: UUID,
    ) -> Exam | None:

        result = db.execute(
            select(Exam).where(
                Exam.public_id == str(public_id)
            )
        )
        return result.scalar_one_or_none()

        
    def get_all_exams(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 10,
    ):

        result = db.execute(
            select(Exam)
            .offset(skip)
            .limit(limit)
        )

        return list(result.scalars().all())

    def update_exam(
        self,
        db: Session,
        exam: Exam,
        exam_data: ExamUpdate,
    ) -> Exam:

        update_data = exam_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(exam, field, value)

        db.commit()
        db.refresh(exam)

        return exam

    def delete_exam(
        self,
        db: Session,
        exam: Exam,
    ) -> Exam:

        exam.is_active = False

        db.commit()
        db.refresh(exam)

        return exam