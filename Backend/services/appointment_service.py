from models.appointment import AppointmentModel
from db.database import get_database
from typing import List
from datetime import datetime
from bson import ObjectId

async def book_appointment(user_id: str, appointment_data: dict):
    db = get_database()
    
    # Emergency logic
    if appointment_data.get("type") == "emergency":
        appointment_data["status"] = "requested"
        appointment_data["scheduled_time"] = None # Immediate
    else:
        appointment_data["status"] = "booked"

    appointment = AppointmentModel(user_id=user_id, **appointment_data)
    result = await db["appointments"].insert_one(appointment.model_dump(by_alias=True, exclude=["id"]))
    created_appt = await db["appointments"].find_one({"_id": result.inserted_id})
    return AppointmentModel(**created_appt)

async def get_patient_appointments(user_id: str) -> List[AppointmentModel]:
    db = get_database()
    cursor = db["appointments"].find({"user_id": user_id}).sort("created_at", -1)
    appts = await cursor.to_list(length=100)
    return [AppointmentModel(**a) for a in appts]

async def get_doctor_appointments(doctor_id: str) -> List[AppointmentModel]:
    db = get_database()
    # In a real app, doctor_id would come from the logged-in user's profile.
    # For now, we might receive it or filter by it.
    cursor = db["appointments"].find({"doctor_id": doctor_id}).sort("created_at", -1)
    appts = await cursor.to_list(length=100)
    return [AppointmentModel(**a) for a in appts]

async def update_appointment_status(appointment_id: str, status: str):
    db = get_database()
    await db["appointments"].update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": status}}
    )
    updated_appt = await db["appointments"].find_one({"_id": ObjectId(appointment_id)})
    if updated_appt:
        return AppointmentModel(**updated_appt)
    return None

async def get_appointment(appointment_id: str):
    db = get_database()
    try:
        appt = await db["appointments"].find_one({"_id": ObjectId(appointment_id)})
        return AppointmentModel(**appt) if appt else None
    except:
        return None
