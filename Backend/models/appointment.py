from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, Annotated
from datetime import datetime

PyObjectId = Annotated[str, BeforeValidator(str)]

class AppointmentModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str = Field(...)
    doctor_id: str = Field(...)
    type: str = "normal" # normal, emergency
    scheduled_time: Optional[datetime] = None # Nullable for emergency
    status: str = "booked" # requested, booked, live, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
