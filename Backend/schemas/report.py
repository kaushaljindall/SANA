from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ReportCreate(BaseModel):
    emotion_summary: str
    report_metadata: Dict[str, Any] = {}
    file_reference: Optional[str] = None

class ReportResponse(BaseModel):
    id: str
    generated_at: datetime
    emotion_summary: str
    file_reference: Optional[str]
