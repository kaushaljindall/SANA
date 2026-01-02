from pydantic import BaseModel, Field, BeforeValidator
from typing import Optional, Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]

class DoctorModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = Field(...)
    specialization: str = Field(...)
    availability_status: str = "Available" # Available, Busy, Offline
    image_url: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
