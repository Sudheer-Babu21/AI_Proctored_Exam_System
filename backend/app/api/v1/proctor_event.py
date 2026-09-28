from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.roles import require_examiner
from app.schemas.proctor_event_schema import (
    CreateProctorEventRequest,
    ProctorEventResponse,
    ResolveProctorEventResponse,
)
from app.services.proctor_event_service import ProctorEventService

router = APIRouter(
    prefix="/proctor-events",
    tags=["Proctor Events"],
)

service = ProctorEventService()


@router.post(
    "",
    response_model=ProctorEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    request: CreateProctorEventRequest,
    db: Session = Depends(get_db),
):
    try:
        return service.create_event(
            db=db,
            session_public_id=request.session_public_id,
            event_type=request.event_type,
            suspicion_score=request.suspicion_score,
            confidence=request.confidence,
            evidence_path=request.evidence_path,
            remarks=request.remarks,
            snapshot_base64=request.snapshot_base64,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/{session_public_id}",
    response_model=list[ProctorEventResponse],
)
def get_session_events(
    session_public_id: UUID,
    db: Session =Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return service.get_session_events(
            db=db,
            session_public_id=session_public_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.patch(
    "/{event_public_id}/resolve",
    response_model=ResolveProctorEventResponse,
)
def resolve_event(
    event_public_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_examiner),
):
    try:
        service.resolve_event(
            db=db,
            event_public_id=event_public_id,
        )

        return {
            "message": "Proctor event resolved successfully."
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )