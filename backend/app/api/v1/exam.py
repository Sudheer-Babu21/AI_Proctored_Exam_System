from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_examiner,require_student
from app.models.users import User
from app.schemas.exam_schema import (
    ExamCreate,
    ExamResponse,
    ExamUpdate,
)
from app.services.exam_service import ExamService

from app.schemas.exam_question_schema import (
    AssignQuestionsRequest,
    AssignQuestionsResponse,
)
from app.services.exam_question_service import ExamQuestionService
from app.schemas.exam_session_schema import (
    StartExamRequest,
    StartExamResponse,
)
from app.services.exam_session_service import ExamSessionService

router = APIRouter(
    prefix="/exams",
    tags=["Exams"],
)

exam_service = ExamService()
exam_question_service = ExamQuestionService()
exam_session_service = ExamSessionService()

@router.post(
    "",
    response_model=ExamResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_exam(
    exam_data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_examiner),
):
    return exam_service.create_exam(
        db=db,
        exam_data=exam_data,
        created_by=current_user.id,
    )

@router.get(
    "",
    response_model=list[ExamResponse],
)
def get_all_exams(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return exam_service.get_all_exams(
        db=db,
        skip=skip,
        limit=limit,
    )

@router.get(
    "/{public_id}",
    response_model=ExamResponse,
)
def get_exam(
    public_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return exam_service.get_exam_by_public_id(
        db=db,
        public_id=public_id,
    )

@router.patch(
    "/{public_id}",
    response_model=ExamResponse,
)
def update_exam(
    public_id: UUID,
    exam_data: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_examiner),
):
    return exam_service.update_exam(
        db=db,
        public_id=public_id,
        exam_data=exam_data,
    )

@router.delete(
    "/{public_id}",
    response_model=ExamResponse,
)
def delete_exam(
    public_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_examiner),
):
    return exam_service.delete_exam(
        db=db,
        public_id=public_id,
    )

@router.post(
    "/{public_id}/assign-random-questions",
    response_model=AssignQuestionsResponse,
)
def assign_random_questions(
    public_id: UUID,
    request: AssignQuestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_examiner),
):
    assigned = exam_question_service.assign_random_questions(
        db=db,
        exam_public_id=public_id,
        subject=request.subject,
        difficulty=request.difficulty,
        question_count=request.question_count,
    )

    return AssignQuestionsResponse(
        exam_id=assigned[0].exam_id if assigned else 0,
        assigned_questions=len(assigned),
        message="Questions assigned successfully.",
    )

@router.post(
    "/{public_id}/start",
    response_model=StartExamResponse,
)
def start_exam(
    public_id: UUID,
    request: StartExamRequest | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):

    result = exam_session_service.start_exam(
        db=db,
        student_id=current_user.id,
        exam_public_id=public_id,
    )

    session = result["session"]
    exam = result["exam"]

    return StartExamResponse(
        session_id=session.public_id,
        exam_id=exam.public_id,
        duration_minutes=exam.duration_minutes,
        total_questions=result["total_questions"],
        message="Exam started successfully.",
    )