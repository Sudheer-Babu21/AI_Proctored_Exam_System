from uuid import UUID
from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.options import Option
from app.models.question_bank import QuestionBank
from sqlalchemy.orm import joinedload
from app.models.exam_questions import ExamQuestion
from app.schemas.question_schema import QuestionCreate, QuestionUpdate

class QuestionRepository:

    def create_question(
        self,
        db: Session,
        question_data: QuestionCreate,
        created_by: int,
    ) -> QuestionBank:

        question = QuestionBank(
            question_text=question_data.question_text,
            question_type=question_data.question_type,
            difficulty=question_data.difficulty,
            subject=question_data.subject,
            topic=question_data.topic,
            marks=question_data.marks,
            negative_marks=question_data.negative_marks,
            model_answer=question_data.model_answer,
            explanation=question_data.explanation,
            image_path=question_data.image_path,
            language=question_data.language,
            created_by=created_by,
        )

        db.add(question)
        db.flush()      # Question ID generate avuthundi (commit kakunda)

        if question_data.options:
            for option in question_data.options:
                db_option = Option(
                    question_id=question.id,
                    option_text=option.option_text,
                    is_correct=option.is_correct,
                )
                db.add(db_option)

        db.commit()
        db.refresh(question)

        return question
    
    def get_question_by_id(
        self,
        db: Session,
        question_id: int
    ) -> QuestionBank | None:

        statement = select(QuestionBank).where(
            QuestionBank.id == question_id
        )
        result = db.execute(statement)
        return result.scalar_one_or_none()

    def get_question_by_public_id(
        self,
        db: Session,
        public_id: UUID
    ) -> QuestionBank | None:

        statement = (
            select(QuestionBank)
            .where(
                QuestionBank.public_id == str(public_id)
            )
            .options(
                joinedload(QuestionBank.options)
            )
        )
        result = db.execute(statement)

        return result.unique().scalar_one_or_none()

    def get_all_questions(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 10,
        is_active: bool | None = None
    ) -> list[QuestionBank]:

        statement = select(QuestionBank)
        if is_active is not None:
            statement = statement.where(
                QuestionBank.is_active == is_active
            )

        statement = (
            statement
            .offset(skip)
            .limit(limit)
        )

        result = db.execute(statement)

        return list(result.scalars().all())

    def update_question(
        self,
        db: Session,
        question: QuestionBank,
        question_data: QuestionUpdate
    ) -> QuestionBank:

        update_data = question_data.model_dump(
            exclude_unset=True
        )

        for field, value in update_data.items():

            # Relationship ni direct setattr cheyyakudadhu
            if field == "options":
                continue

            setattr(
                question,
                field,
                value
            )

        db.commit()
        db.refresh(question)

        return question
    
    def delete_question(
        self,
        db: Session,
        question: QuestionBank
    ) -> QuestionBank:

        question.is_active = False

        db.commit()
        db.refresh(question)

        return question
    
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

        statement = select(QuestionBank)

        if subject:
            statement = statement.where(
                QuestionBank.subject.ilike(f"%{subject}%")
            )

        if topic:
            statement = statement.where(
                QuestionBank.topic.ilike(f"%{topic}%")
            )

        if difficulty:
            statement = statement.where(
                QuestionBank.difficulty == difficulty
            )

        if question_type:
            statement = statement.where(
                QuestionBank.question_type == question_type
            )

        if is_active is not None:
            statement = statement.where(
                QuestionBank.is_active == is_active
            )

        statement = (
            statement
            .offset(skip)
            .limit(limit)
        )

        result = db.execute(statement)

        return list(result.scalars().all())

    def get_random_questions(
        self,
        db: Session,
        subject: str,
        difficulty: str,
        limit: int,
    ):
        result = db.execute(
            select(QuestionBank)
            .where(
                QuestionBank.subject == subject,
                QuestionBank.difficulty == difficulty,
                QuestionBank.is_active == True,
            )
            .order_by(func.random())
            .limit(limit)
        )

        return list(result.scalars().all())

    def get_exam_questions(
        self,
        db: Session,
        exam_id: int,
    ):
        result = db.execute(
            select(QuestionBank)
            .join(
                ExamQuestion,
                ExamQuestion.question_id == QuestionBank.id,
            )
            .where(
                ExamQuestion.exam_id == exam_id,
                QuestionBank.is_active == True,
            )
            .options(
                joinedload(QuestionBank.options)
            )
        )

        return result.unique().scalars().all()
