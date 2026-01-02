from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatMessageCreate(BaseModel):
    role: str
    content: str
    session_id: str = "default"

class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    timestamp: datetime

class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageResponse]
