from uuid import UUID
from pydantic import BaseModel


class SubmitAnswerRequest(BaseModel):
    question_public_id: UUID
    selected_option_ids: list[int] | None = None
    answer_text: str | None = None


class SubmitAnswerResponse(BaseModel):
    message: str


class UploadImageAnswerResponse(BaseModel):
    message: str
    image_url: str