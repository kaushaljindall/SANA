from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    settings: Optional[dict] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    auth_provider: str
    settings: dict = {}
