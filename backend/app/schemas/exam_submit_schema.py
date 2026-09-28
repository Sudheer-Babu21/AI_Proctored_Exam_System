from pydantic import BaseModel


class SubmitExamResponse(BaseModel):
    message: str