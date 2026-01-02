from fastapi import APIRouter, Depends, HTTPException
from typing import List
from schemas.appointment import AppointmentCreate, AppointmentResponse
from services.appointment_service import book_appointment, get_patient_appointments, update_appointment_status
from utils.security import get_current_user_id

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentResponse)
async def create_appointment(appt: AppointmentCreate, user_id: str = Depends(get_current_user_id)):
    new_appt = await book_appointment(user_id, appt.model_dump())
    return AppointmentResponse(
        id=str(new_appt.id),
        doctor_id=new_appt.doctor_id,
        type=new_appt.type,
        scheduled_time=new_appt.scheduled_time,
        status=new_appt.status,
        created_at=new_appt.created_at
    )

@router.get("/patient", response_model=List[AppointmentResponse])
async def list_my_appointments(user_id: str = Depends(get_current_user_id)):
    appts = await get_patient_appointments(user_id)
    return [
        AppointmentResponse(
            id=str(a.id),
            doctor_id=a.doctor_id,
            type=a.type,
            scheduled_time=a.scheduled_time,
            status=a.status,
            created_at=a.created_at
        ) for a in appts
    ]

@router.get("/{id}", response_model=AppointmentResponse)
async def get_appointment_details(id: str, user_id: str = Depends(get_current_user_id)):
    from services.appointment_service import get_appointment
    appt = await get_appointment(id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Optional: Check if user is authorized (patient or doctor linked to this appointment)
    # if appt.user_id != user_id and appt.doctor_id != user_id: ...
    
    return AppointmentResponse(
        id=str(appt.id),
        doctor_id=appt.doctor_id,
        type=appt.type,
        scheduled_time=appt.scheduled_time,
        status=appt.status,
        created_at=appt.created_at
    )

@router.post("/{id}/start", response_model=AppointmentResponse)
async def start_appointment(id: str, user_id: str = Depends(get_current_user_id)):
    # In real app, verify user is doctor or patient involved
    updated = await update_appointment_status(id, "live")
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return AppointmentResponse(
        id=str(updated.id),
        doctor_id=updated.doctor_id,
        type=updated.type,
        scheduled_time=updated.scheduled_time,
        status=updated.status,
        created_at=updated.created_at
    )

@router.post("/{id}/complete", response_model=AppointmentResponse)
async def complete_appointment(id: str, user_id: str = Depends(get_current_user_id)):
    updated = await update_appointment_status(id, "completed")
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return AppointmentResponse(
        id=str(updated.id),
        doctor_id=updated.doctor_id,
        type=updated.type,
        scheduled_time=updated.scheduled_time,
        status=updated.status,
        created_at=updated.created_at
    )

@router.post("/{id}/cancel", response_model=AppointmentResponse)
async def cancel_appointment(id: str, user_id: str = Depends(get_current_user_id)):
    updated = await update_appointment_status(id, "cancelled")
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    return AppointmentResponse(
        id=str(updated.id),
        doctor_id=updated.doctor_id,
        type=updated.type,
        scheduled_time=updated.scheduled_time,
        status=updated.status,
        created_at=updated.created_at
    )
