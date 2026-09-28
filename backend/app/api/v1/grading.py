from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_examiner
from app.schemas.grading_schema import (
    EvaluateAnswerRequest,
    AnswerResponse,
)
from app.services.grading_service import GradingService

router = APIRouter(
    prefix="/grading",
    tags=["Examiner Grading"],
)

service = GradingService()


@router.get(
    "/pending",
    response_model=list[AnswerResponse],
)
def get_pending_answers(
    db: Session = Depends(get_db),
    current_user=Depends(require_examiner),
):
    return service.get_pending_answers(db)


@router.get(
    "/reviewed",
    response_model=list[AnswerResponse],
)
def get_reviewed_answers(
    db: Session = Depends(get_db),
    current_user=Depends(require_examiner),
):
    return service.get_reviewed_answers(db)


@router.patch(
    "/{answer_public_id}",
    response_model=AnswerResponse,
)
def evaluate_answer(
    answer_public_id: UUID,
    request: EvaluateAnswerRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_examiner),
):
    try:
        return service.evaluate_answer(
            db=db,
            answer_public_id=answer_public_id,
            marks_awarded=request.marks_awarded,
            feedback=request.feedback,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )