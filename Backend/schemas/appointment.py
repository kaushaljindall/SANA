from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AppointmentCreate(BaseModel):
    doctor_id: str
    type: str = "normal"
    scheduled_time: Optional[datetime] = None

class AppointmentResponse(BaseModel):
    id: str
    doctor_id: str
    type: str
    scheduled_time: Optional[datetime]
    status: str
    created_at: datetime
