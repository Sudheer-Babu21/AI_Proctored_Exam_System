from uuid import UUID
from sqlalchemy.orm import Session

from app.exceptions.exam import ExamNotFoundException
from app.repositories.exam_session_repository import ExamSessionRepository
from app.repositories.exam_repository import ExamRepository
from app.repositories.exam_question_repository import ExamQuestionRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.exam_session_schema import SessionListItemResponse
from app.repositories.result_repository import ResultRepository
from app.services.grading_service import GradingService


class ExamSessionService:

    def __init__(self):
        self.exam_repo = ExamRepository()
        self.session_repo = ExamSessionRepository()
        self.exam_question_repo = ExamQuestionRepository()
        self.question_repo = QuestionRepository()
        self.result_repo = ResultRepository()
        self.grading_service = GradingService()

    def start_exam(
        self,
        db: Session,
        student_id: int,
        exam_public_id,
    ):
        # Find Exam
        exam = self.exam_repo.get_exam_by_public_id(
            db,
            exam_public_id,
        )

        if not exam:
            raise ExamNotFoundException()

        # Check if student already has an active session
        existing_session = self.session_repo.get_active_session(
            db=db,
            student_id=student_id,
            exam_id=exam.id,
        )

        if existing_session:
            return {
                "session": existing_session,
                "exam": exam,
                "total_questions": self.exam_question_repo.count_exam_questions(
                    db=db,
                    exam_id=exam.id,
                ),
            }

        # Count assigned questions
        total_questions = self.exam_question_repo.count_exam_questions(
            db=db,
            exam_id=exam.id,
        )

        # Create new session
        session = self.session_repo.create_session(
            db=db,
            student_id=student_id,
            exam_id=exam.id,
            duration_minutes=exam.duration_minutes,
        )

        return {
            "session": session,
            "exam": exam,
            "total_questions": total_questions,
        }

    def get_exam_questions(
        self,
        db: Session,
        session_public_id: UUID,
    ):
        session = self.session_repo.get_session_by_public_id(
            db=db,
            session_public_id=session_public_id,
        )

        if not session:
            raise ExamNotFoundException()

        questions = self.question_repo.get_exam_questions(
            db=db,
            exam_id=session.exam_id,
        )

        return {
            "session": session,
            "questions": questions,
        }

    def submit_exam(
        self,
        db: Session,
        session_public_id,
    ):
        session = self.session_repo.get_session_by_public_id(
            db=db,
            session_public_id=session_public_id,
        )

        if session is None:
            raise ExamNotFoundException()

        self.session_repo.complete_session(
            db=db,
            session=session,
        )

        grading = self.grading_service.grade_exam(
            db=db,
            session=session,
        )

        return {
            "message": "Exam submitted successfully.",
            "result": grading,
        }

    def get_session_by_public_id(
        self,
        db: Session,
        session_public_id: UUID,
    ):
        return self.session_repo.get_session_by_public_id(
            db=db,
            session_public_id=session_public_id,
        )

    def get_all_sessions(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        exam_id: int | None = None,
        student_id: int | None = None,
    ) -> list[SessionListItemResponse]:
        sessions = self.session_repo.get_all_sessions(
            db=db,
            skip=skip,
            limit=limit,
            exam_id=exam_id,
            student_id=student_id,
        )

        items = []
        for s in sessions:
            events = s.proctor_events or []
            max_suspicion = max([e.suspicion_score or 0.0 for e in events], default=0.0)

            items.append(
                SessionListItemResponse(
                    public_id=s.public_id,
                    exam_id=s.exam_id,
                    exam_public_id=s.exam.public_id if s.exam else None,
                    exam_title=s.exam.title if s.exam else "Assessment",
                    subject=s.exam.subject if s.exam else "General",
                    student_id=s.student_id,
                    student_name=s.student.name if s.student else "Candidate",
                    student_email=s.student.email if s.student else None,
                    status=s.status,
                    start_time=s.start_time,
                    end_time=s.end_time,
                    total_marks=s.result.max_score if s.result else (s.exam.total_marks if s.exam else 0),
                    obtained_marks=s.result.final_score if s.result else 0.0,
                    percentage=s.result.percentage if s.result else 0.0,
                    result_status=s.result.status if s.result else None,
                    proctor_events_count=len(events),
                    max_suspicion_score=round(max_suspicion, 2),
                )
            )

        return items

    def disqualify_session(
        self,
        db: Session,
        session_public_id: UUID,
        reason: str,
    ):
        session = self.session_repo.get_session_by_public_id(
            db=db,
            session_public_id=session_public_id,
        )
        if not session:
            raise ExamNotFoundException()

        return self.session_repo.disqualify_session(
            db=db,
            session=session,
            reason=reason,
        )

    def publish_session(
        self,
        db: Session,
        session_public_id: UUID,
    ):
        session = self.session_repo.get_session_by_public_id(
            db=db,
            session_public_id=session_public_id,
        )
        if not session:
            raise ExamNotFoundException()

        # Grade or refresh score
        self.grading_service.grade_exam(db=db, session=session)
        return {
            "message": "Results published successfully.",
            "session_id": session.public_id,
        }