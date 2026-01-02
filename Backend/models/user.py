from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import Optional, Annotated
from datetime import datetime

# Helper for MongoDB ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserSettings(BaseModel):
    voice_storage_enabled: bool = False
    personalization_enabled: bool = True
    language_preference: str = "en"
    privacy_flags: dict = {}

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = Field(...)
    email: EmailStr = Field(...)
    role: str = "patient" # patient, doctor
    hashed_password: Optional[str] = None
    auth_provider: str = "local" # local, google
    created_at: datetime = Field(default_factory=datetime.utcnow)
    settings: UserSettings = Field(default_factory=UserSettings)
    google_id: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
