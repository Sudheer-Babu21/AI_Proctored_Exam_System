from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.enums import ProctorEventType


class CreateProctorEventRequest(BaseModel):
    session_public_id: UUID
    event_type: ProctorEventType
    suspicion_score: float = 0.0
    confidence: float = 0.0
    evidence_path: str | None = None
    remarks: str | None = None
    snapshot_base64: str | None = None



class ResolveProctorEventResponse(BaseModel):
    message: str


class ProctorEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    public_id: UUID
    event_type: ProctorEventType
    suspicion_score: float
    confidence: float
    evidence_path: str | None
    remarks: str | None
    is_resolved: bool
    event_time: datetime