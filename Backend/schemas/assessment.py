from pydantic import BaseModel
from typing import Optional, Dict, List

class StartAssessmentRequest(BaseModel):
    context: Optional[str] = None # Optional user context (e.g., "I'm feeling stressed about work")

class SubmitResponseRequest(BaseModel):
    session_id: str
    response_text: str

class AssessmentResponse(BaseModel):
    session_id: str
    next_question: Optional[str]
    progress: int
    should_stop: bool = False
    feedback: Optional[str] = None # Only if should_stop is True
    audio_url: Optional[str] = None # Base64 audio

class AssessmentHistoryResponse(BaseModel):
    sessions: List[Dict]
