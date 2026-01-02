from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ReplyCreate(BaseModel):
    content: str

class Reply(BaseModel):
    id: str
    content: str
    user_id: str
    username: str # For anonymity, might default to "Anonymous"
    created_at: datetime

class PostCreate(BaseModel):
    content: str
    color: Optional[str] = "from-blue-500/20 to-purple-500/20"

class PostResponse(BaseModel):
    id: str
    content: str
    user_id: str
    username: str
    likes: int
    color: str
    replies: List[Reply] = []
    created_at: datetime
