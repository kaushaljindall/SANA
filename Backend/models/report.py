from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, Annotated, Dict, Any
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class ReportModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str = Field(...)
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    emotion_summary: str = Field(...)
    report_metadata: Dict[str, Any] = {}
    file_reference: Optional[str] = None # Path to PDF or ID

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
