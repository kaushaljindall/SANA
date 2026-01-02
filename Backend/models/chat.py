from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, Annotated
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class ChatMessageModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str = Field(...)
    session_id: str = "default"
    role: str = Field(...) # user, assistant
    content: str = Field(...)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
