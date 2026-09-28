from datetime import datetime, timedelta, timezone
import secrets
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.enums import SessionStatus, ResultStatus
from app.models.exam_sessions import ExamSession


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ExamSessionRepository:

    def get_active_session(
        self,
        db: Session,
        student_id: int,
        exam_id: int,
    ):
        result = db.execute(
            select(ExamSession).where(
                ExamSession.student_id == student_id,
                ExamSession.exam_id == exam_id,
                ExamSession.status == SessionStatus.IN_PROGRESS,
            )
        )

        return result.scalar_one_or_none()

    def create_session(
        self,
        db: Session,
        student_id: int,
        exam_id: int,
        duration_minutes: int,
    ):
        start_time = utc_now()
        end_time = start_time + timedelta(minutes=duration_minutes)

        session = ExamSession(
            student_id=student_id,
            exam_id=exam_id,
            session_token=secrets.token_urlsafe(32),
            start_time=start_time,
            end_time=end_time,
            status=SessionStatus.IN_PROGRESS,
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return session

    def get_session_by_public_id(
        self,
        db: Session,
        session_public_id: UUID,
    ):
        result = db.execute(
            select(ExamSession)
            .options(
                joinedload(ExamSession.student),
                joinedload(ExamSession.exam),
                joinedload(ExamSession.result),
                joinedload(ExamSession.proctor_events),
            )
            .where(
                ExamSession.public_id == str(session_public_id)
            )
        )

        return result.unique().scalar_one_or_none()

    def get_all_sessions(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        exam_id: int | None = None,
        student_id: int | None = None,
    ):
        query = (
            select(ExamSession)
            .options(
                joinedload(ExamSession.student),
                joinedload(ExamSession.exam),
                joinedload(ExamSession.result),
                joinedload(ExamSession.proctor_events),
            )
            .order_by(ExamSession.created_at.desc())
        )

        if exam_id is not None:
            query = query.where(ExamSession.exam_id == exam_id)
        if student_id is not None:
            query = query.where(ExamSession.student_id == student_id)

        query = query.offset(skip).limit(limit)
        result = db.execute(query)
        return result.unique().scalars().all()

    def complete_session(
        self,
        db: Session,
        session: ExamSession,
    ):
        session.status = SessionStatus.SUBMITTED
        session.end_time = utc_now()

        db.commit()
        db.refresh(session)

        return session

    def disqualify_session(
        self,
        db: Session,
        session: ExamSession,
        reason: str = "Disqualified for exam integrity violations by examiner.",
    ):
        session.status = SessionStatus.CANCELLED
        session.end_time = utc_now()

        if session.result:
            session.result.status = ResultStatus.FAIL
            session.result.final_score = 0.0
            session.result.percentage = 0.0

        db.commit()
        db.refresh(session)
        return session