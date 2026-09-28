from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.users import User
from app.repositories.exam_session_repository import ExamSessionRepository
from app.services.result_service import ResultService
from app.schemas.result_schema import ResultResponse

router = APIRouter(
    prefix="/results",
    tags=["Results"],
)

result_service = ResultService()
session_repo = ExamSessionRepository()


@router.get(
    "/{session_public_id}",
    response_model=ResultResponse,
)
def get_result(
    session_public_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = session_repo.get_session_by_public_id(
        db=db,
        session_public_id=session_public_id,
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Security Check: Student can only view their own; Examiner/Admin can view any
    if current_user.role == "STUDENT" and session.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this result.",
        )

    result = result_service.get_result(
        db=db,
        session=session,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not calculated yet. Session may still be processing.",
        )

    return ResultResponse(
        exam_session_public_id=session.public_id,
        max_score=result.max_score,
        total_score=result.total_score,
        final_score=result.final_score,
        percentage=result.percentage,
        status=result.status,
    )


@router.get(
    "/{session_public_id}/pdf",
)
def download_result_pdf(
    session_public_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = session_repo.get_session_by_public_id(
        db=db,
        session_public_id=session_public_id,
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    if current_user.role == "STUDENT" and session.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to download this report.",
        )

    try:
        pdf_buffer = result_service.get_pdf_report(
            db=db,
            session=session,
        )

        filename = f"Exam_Report_{str(session.public_id)[:8]}.pdf"
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        print("PDF Generation error:", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(e)}",
        )