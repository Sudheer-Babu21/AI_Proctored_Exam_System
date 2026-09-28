from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.proctor_events import ProctorEvent


class ProctorEventRepository:

    def create_event(
        self,
        db: Session,
        exam_session_id: int,
        event_type,
        suspicion_score: float = 0.0,
        confidence: float = 0.0,
        evidence_path: str | None = None,
        remarks: str | None = None,
    ):
        event = ProctorEvent(
            exam_session_id=exam_session_id,
            event_type=event_type,
            suspicion_score=suspicion_score,
            confidence=confidence,
            evidence_path=evidence_path,
            remarks=remarks,
            event_time=datetime.now(timezone.utc),
        )

        db.add(event)
        db.commit()
        db.refresh(event)

        return event

    def get_event_by_public_id(
        self,
        db: Session,
        public_id,
    ):
        result = db.execute(
            select(ProctorEvent).where(
                ProctorEvent.public_id == str(public_id)
            )
        )

        return result.scalar_one_or_none()

    def get_events_by_session(
        self,
        db: Session,
        exam_session_id: int,
    ):
        result = db.execute(
            select(ProctorEvent)
            .where(
                ProctorEvent.exam_session_id == exam_session_id
            )
            .order_by(
                ProctorEvent.event_time.desc()
            )
        )

        return result.scalars().all()

    def mark_resolved(
        self,
        db: Session,
        event: ProctorEvent,
    ):
        event.is_resolved = True

        db.commit()
        db.refresh(event)

        return event

    def delete_event(
        self,
        db: Session,
        event: ProctorEvent,
    ):
        db.delete(event)
        db.commit()