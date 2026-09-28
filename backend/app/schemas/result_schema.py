from pydantic import BaseModel
from uuid import UUID
from app.core.enums import ResultStatus


class ResultResponse(BaseModel):
    exam_session_public_id: UUID
    max_score: float
    total_score: float
    final_score: float
    percentage: float
    status: ResultStatus

    model_config = {
        "from_attributes": True
    }