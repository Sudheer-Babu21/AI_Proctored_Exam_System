from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.dependencies import get_db

from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_examiner, require_student
from app.models.users import User

from app.schemas.student_exam_schema import (
    StudentExamResponse,
    StudentQuestionResponse,
    StudentOptionResponse,
)
from app.schemas.exam_submit_schema import SubmitExamResponse
from app.schemas.exam_session_schema import (
    SessionListItemResponse,
    DisqualifySessionRequest,
)
from app.services.exam_session_service import ExamSessionService

router = APIRouter(
    prefix="/exam-sessions",
    tags=["Exam Sessions"],
)

exam_session_service = ExamSessionService()


@router.get(
    "",
    response_model=list[SessionListItemResponse],
)
def get_all_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    exam_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_examiner),
):
    return exam_session_service.get_all_sessions(
        db=db,
        skip=skip,
        limit=limit,
        exam_id=exam_id,
    )


@router.get(
    "/my-sessions",
    response_model=list[SessionListItemResponse],
)
def get_my_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    return exam_session_service.get_all_sessions(
        db=db,
        skip=skip,
        limit=limit,
        student_id=current_user.id,
    )


@router.get(
    "/{session_public_id}/questions",
    response_model=StudentExamResponse,
)
def get_exam_questions(
    session_public_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    result = exam_session_service.get_exam_questions(
        db=db,
        session_public_id=session_public_id,
    )

    session = result["session"]
    questions = []

    for question in result["questions"]:
        options = [
            StudentOptionResponse(
                id=option.id,
                option_text=option.option_text,
            )
            for option in question.options
        ]

        questions.append(
            StudentQuestionResponse(
                public_id=question.public_id,
                question_text=question.question_text,
                question_type=question.question_type.value,
                marks=question.marks,
                options=options,
            )
        )

    # Calculate remaining time in seconds against session.end_time
    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    remaining_secs = 3600
    if session.end_time:
        diff = (session.end_time - now_utc).total_seconds()
        remaining_secs = max(0, int(diff))
    elif session.exam and session.exam.duration_minutes:
        remaining_secs = session.exam.duration_minutes * 60

    return StudentExamResponse(
        session_id=session.public_id,
        exam_id=session.exam.public_id if session.exam else session.exam_id,
        exam_title=session.exam.title if session.exam else "Assessment",
        duration_minutes=session.exam.duration_minutes if session.exam else 60,
        remaining_seconds=remaining_secs,
        questions=questions,
    )


@router.get(
    "/{session_public_id}",
    response_model=SessionListItemResponse,
)
def get_session_details(
    session_public_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = exam_session_service.get_session_by_public_id(
        db=db,
        session_public_id=session_public_id,
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam session not found.",
        )

    # Permission check: must be the student or an examiner/admin
    if current_user.role == "STUDENT" and session.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden to this session.",
        )

    events = session.proctor_events or []
    max_suspicion = max([e.suspicion_score or 0.0 for e in events], default=0.0)

    return SessionListItemResponse(
        public_id=session.public_id,
        exam_id=session.exam_id,
        exam_public_id=session.exam.public_id if session.exam else None,
        exam_title=session.exam.title if session.exam else "Assessment",
        subject=session.exam.subject if session.exam else "General",
        student_id=session.student_id,
        student_name=session.student.name if session.student else "Candidate",
        student_email=session.student.email if session.student else None,
        status=session.status,
        start_time=session.start_time,
        end_time=session.end_time,
        total_marks=session.result.max_score if session.result else (session.exam.total_marks if session.exam else 0),
        obtained_marks=session.result.final_score if session.result else 0.0,
        percentage=session.result.percentage if session.result else 0.0,
        result_status=session.result.status if session.result else None,
        proctor_events_count=len(events),
        max_suspicion_score=round(max_suspicion, 2),
    )


@router.post(
    "/{session_public_id}/submit",
    response_model=SubmitExamResponse,
)
def submit_exam(
    session_public_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_student),
):
    return exam_session_service.submit_exam(
        db=db,
        session_public_id=session_public_id,
    )


@router.post(
    "/{session_public_id}/disqualify",
)
def disqualify_session(
    session_public_id: UUID,
    request: DisqualifySessionRequest | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_examiner),
):
    reason = request.reason if request else "Session disqualified for proctoring integrity violations."
    exam_session_service.disqualify_session(
        db=db,
        session_public_id=session_public_id,
        reason=reason,
    )
    return {
        "message": "Candidate session has been disqualified.",
        "status": "CANCELLED",
    }


@router.post(
    "/{session_public_id}/publish",
)
def publish_session(
    session_public_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_examiner),
):
    return exam_session_service.publish_session(
        db=db,
        session_public_id=session_public_id,
    )