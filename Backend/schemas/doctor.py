from pydantic import BaseModel
from typing import Optional

class DoctorResponse(BaseModel):
    id: str
    name: str
    specialization: str
    availability_status: str
    image_url: Optional[str] = None
