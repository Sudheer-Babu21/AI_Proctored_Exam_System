import base64
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.enums import ProctorEventType
from app.repositories.exam_session_repository import ExamSessionRepository
from app.repositories.proctor_event_repository import ProctorEventRepository

BASE_DIR = Path(__file__).resolve().parent.parent
SNAPSHOTS_DIR = BASE_DIR / "uploads" / "snapshots"
SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)


class ProctorEventService:

    def __init__(self):
        self.proctor_repository = ProctorEventRepository()
        self.session_repository = ExamSessionRepository()

    def _save_snapshot(self, session_id: UUID, base64_data: str) -> str:
        try:
            if "," in base64_data:
                base64_data = base64_data.split(",", 1)[1]

            image_bytes = base64.b64decode(base64_data)
            filename = f"snap_{session_id}_{uuid4().hex[:8]}.jpg"
            file_path = SNAPSHOTS_DIR / filename

            with open(file_path, "wb") as f:
                f.write(image_bytes)

            return f"/uploads/snapshots/{filename}"
        except Exception as e:
            print("Failed to save snapshot evidence:", e)
            return ""

    def create_event(
        self,
        db: Session,
        session_public_id: UUID,
        event_type: ProctorEventType,
        suspicion_score: float = 0.0,
        confidence: float = 0.0,
        evidence_path: str | None = None,
        remarks: str | None = None,
        snapshot_base64: str | None = None,
    ):
        session = self.session_repository.get_session_by_public_id(
            db=db,
            session_public_id=session_public_id,
        )

        if session is None:
            raise ValueError("Exam session not found.")

        final_evidence = evidence_path
        if snapshot_base64 and len(snapshot_base64) > 50:
            saved_path = self._save_snapshot(session_public_id, snapshot_base64)
            if saved_path:
                final_evidence = saved_path

        return self.proctor_repository.create_event(
            db=db,
            exam_session_id=session.id,
            event_type=event_type,
            suspicion_score=suspicion_score,
            confidence=confidence,
            evidence_path=final_evidence,
            remarks=remarks,
        )

    def get_session_events(
        self,
        db: Session,
        session_public_id: UUID,
    ):
        session = self.session_repository.get_session_by_public_id(
            db=db,
            session_public_id=session_public_id,
        )

        if session is None:
            raise ValueError("Exam session not found.")

        return self.proctor_repository.get_events_by_session(
            db=db,
            exam_session_id=session.id,
        )

    def resolve_event(
        self,
        db: Session,
        event_public_id: UUID,
    ):
        event = self.proctor_repository.get_event_by_public_id(
            db=db,
            public_id=event_public_id,
        )

        if event is None:
            raise ValueError("Proctor event not found.")

        return self.proctor_repository.mark_resolved(
            db=db,
            event=event,
        )