from fastapi import APIRouter, Depends
from typing import List
from schemas.doctor import DoctorResponse
from services.doctor_service import get_all_doctors, seed_doctors

router = APIRouter(prefix="/doctors", tags=["Doctors"])

@router.get("/", response_model=List[DoctorResponse])
async def list_doctors():
    doctors = await get_all_doctors()
    return [
        DoctorResponse(
            id=str(d.id),
            name=d.name,
            specialization=d.specialization,
            availability_status=d.availability_status,
            image_url=d.image_url
        ) for d in doctors
    ]
