from uuid import UUID

from sqlalchemy.orm import Session

from app.models.question_bank import QuestionBank
from app.repositories.question_repository import QuestionRepository
from app.schemas.question_schema import (
    QuestionCreate,
    QuestionUpdate,
)
from uuid import UUID
from app.exceptions.question import QuestionNotFoundException

class QuestionService:

    def __init__(self):
        self.repository = QuestionRepository()

    def create_question(
        self,
        db: Session,
        question_data: QuestionCreate,
        created_by: int
    ) -> QuestionBank:

        return self.repository.create_question(
            db=db,
            question_data=question_data,
            created_by=created_by
        )
    
    def get_question_by_id(
        self,
        db: Session,
        question_id: int
    ) -> QuestionBank:

        question = self.repository.get_question_by_id(
            db=db,
            question_id=question_id
        )

        if question is None:
            raise QuestionNotFoundException()

        return question

    def get_question_by_public_id(
        self,
        db: Session,
        public_id: UUID
    ) -> QuestionBank:

        question = self.repository.get_question_by_public_id(
            db=db,
            public_id=public_id
        )

        if question is None:
            raise QuestionNotFoundException()

        return question

    def get_all_questions(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 10,
        is_active: bool | None = None
    ) -> list[QuestionBank]:

        return self.repository.get_all_questions(
            db=db,
            skip=skip,
            limit=limit,
            is_active=is_active
        )

    def update_question(
        self,
        db: Session,
        public_id: UUID,
        question_data: QuestionUpdate
    ) -> QuestionBank:

        question = self.repository.get_question_by_public_id(
            db=db,
            public_id=public_id
        )


        if question is None:
            raise QuestionNotFoundException()

        return self.repository.update_question(
            db=db,
            question=question,
            question_data=question_data
        )

    def delete_question(
        self,
        db: Session,
        public_id: UUID
    ) -> QuestionBank:

        question = self.repository.get_question_by_public_id(
            db=db,
            public_id=public_id
        )

        if question is None:
            raise QuestionNotFoundException()

        return self.repository.delete_question(
            db=db,
            question=question
        )
    
    def search_questions(
        self,
        db: Session,
        subject: str | None = None,
        topic: str | None = None,
        difficulty: str | None = None,
        question_type: str | None = None,
        is_active: bool | None = True,
        skip: int = 0,
        limit: int = 10
    ) -> list[QuestionBank]:

        return self.repository.search_questions(
            db=db,
            subject=subject,
            topic=topic,
            difficulty=difficulty,
            question_type=question_type,
            is_active=is_active,
            skip=skip,
            limit=limit
        )