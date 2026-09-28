from io import BytesIO
from app.repositories.result_repository import ResultRepository
from app.repositories.proctor_event_repository import ProctorEventRepository
from app.services.pdf_service import generate_exam_pdf_report


class ResultService:

    def __init__(self):
        self.result_repo = ResultRepository()
        self.proctor_repo = ProctorEventRepository()

    def get_result(
        self,
        db,
        session,
    ):
        return self.result_repo.get_result_by_session(
            db=db,
            exam_session_id=session.id,
        )

    def get_pdf_report(
        self,
        db,
        session,
    ) -> BytesIO:
        result = self.get_result(db=db, session=session)
        events = self.proctor_repo.get_events_by_session(
            db=db,
            exam_session_id=session.id,
        )
        return generate_exam_pdf_report(
            session=session,
            result=result,
            proctor_events=events,
        )