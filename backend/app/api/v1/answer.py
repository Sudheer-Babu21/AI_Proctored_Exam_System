from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.dependencies.roles import require_student
from app.schemas.answer_schema import (
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    UploadImageAnswerResponse,
)
from app.services.answer_service import AnswerService

router = APIRouter(
    prefix="/exam-sessions",
    tags=["Answers"],
)

answer_service = AnswerService()


@router.post(
    "/{session_public_id}/submit-answer",
    response_model=SubmitAnswerResponse,
)
def submit_answer(
    session_public_id: UUID,
    request: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_student),
):
    return answer_service.submit_answer(
        db=db,
        session_public_id=session_public_id,
        request=request,
    )


@router.post(
    "/{session_public_id}/upload-image-answer",
    response_model=UploadImageAnswerResponse,
)
def upload_image_answer(
    session_public_id: UUID,
    question_public_id: UUID = Query(..., description="Target question UUID"),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_student),
):
    return answer_service.upload_image_answer(
        db=db,
        session_public_id=session_public_id,
        question_public_id=question_public_id,
        image=image,
    )