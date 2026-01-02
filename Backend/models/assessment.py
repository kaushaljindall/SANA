from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, List, Dict, Annotated
from datetime import datetime

# Helper for MongoDB ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

class AssessmentQuestion(BaseModel):
    id: str
    text: str
    dimension_focus: str
    depth: int # 1 (Shallow) - 3 (Deep)
    tone: str

class AssessmentResponseItem(BaseModel):
    question_id: str
    question_text: str
    user_response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    analysis: Dict[str, float] # e.g. {"stress_marker": 0.8, "sentiment": -0.5}

class AssessmentSession(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    status: str = "in_progress" # in_progress, completed, paused
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    # State tracking
    current_depth: int = 1
    questions_answered: int = 0
    history: List[AssessmentResponseItem] = []
    
    # The evolving profile
    dimensions: Dict[str, float] = {
        "emotional_regulation": 0.5,
        "stress_resilience": 0.5,
        "self_awareness": 0.5,
        "social_support": 0.5,
        "coping_confidence": 0.5
    }

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
