from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_admin, require_examiner
from app.models.users import User
from app.schemas.question_schema import (
    QuestionCreate,
    QuestionResponse,
    QuestionUpdate,
)
from app.services.question_service import QuestionService

router = APIRouter(
    prefix="/questions",
    tags=["Question Bank"]
)

question_service = QuestionService()

@router.post(
    "",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_question(
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_examiner),
):
    return question_service.create_question(
        db=db,
        question_data=question_data,
        created_by=current_user.id,
    )

@router.get(
    "",
    response_model=list[QuestionResponse],
)
def get_all_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    is_active: bool | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return question_service.get_all_questions(
        db=db,
        skip=skip,
        limit=limit,
        is_active=is_active,
    )

@router.get(
    "/{public_id}",
    response_model=QuestionResponse,
)
def get_question(
    public_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return question_service.get_question_by_public_id(
        db=db,
        public_id=public_id,
    )

@router.patch(
    "/{public_id}",
    response_model=QuestionResponse,
)
def update_question(
    public_id: UUID,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_examiner),
):
    return question_service.update_question(
        db=db,
        public_id=public_id,
        question_data=question_data,
    )

@router.delete(
    "/{public_id}",
    response_model=QuestionResponse,
)
def delete_question(
    public_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_examiner),
):
    return question_service.delete_question(
        db=db,
        public_id=public_id,
    )

@router.get(
    "/search/",
    response_model=list[QuestionResponse],
)
def search_questions(
    subject: str | None = Query(None),
    topic: str | None = Query(None),
    difficulty: str | None = Query(None),
    question_type: str | None = Query(None),
    is_active: bool | None = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return question_service.search_questions(
        db=db,
        subject=subject,
        topic=topic,
        difficulty=difficulty,
        question_type=question_type,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )