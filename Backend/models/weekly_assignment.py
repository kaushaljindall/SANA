from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List, Dict, Annotated, Any
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class WeeklyResponseItem(BaseModel):
    date: datetime = Field(default_factory=datetime.utcnow)
    question_id: str
    question_text: str
    user_audio_text: str
    validation_status: str # "valid", "invalid", "skipped"
    internal_score: float = 0.0 # Hidden from user
    ai_feedback: Optional[str] = None

class WeeklySession(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    week_id: str # e.g., "2024-W01"
    status: str = "in_progress" # pending, in_progress, completed
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    responses: List[WeeklyResponseItem] = []
    current_question_index: int = 0
    
    # Hidden aggregated scores
    internal_metrics: Dict[str, Any] = {}

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
