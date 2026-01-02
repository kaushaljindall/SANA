from models.doctor import DoctorModel
from db.database import get_database
from typing import List

async def get_all_doctors() -> List[DoctorModel]:
    db = get_database()
    cursor = db["doctors"].find({})
    doctors = await cursor.to_list(length=100)
    return [DoctorModel(**doc) for doc in doctors]

async def seed_doctors():
    db = get_database()
    # Check if we already have data
    count = await db["doctors"].count_documents({})
    
    # If we have less than the full set, let's clear and re-seed to ensure fresh data
    # OR you can just append. For dev, ensuring consistent state is often better.
    if count < 8:
        # Optional: Clear existing to avoid duplicates if you want a clean slate
        # await db["doctors"].delete_many({}) 
        
        # We'll use upsert-like logic or just add missing names if we wanted to be fancy.
        # For simple dummy data, let's just add the ones that might be missing or just reset if empty.
        # Simplest for this request: If empty, add all. If not empty but small, maybe add more?
        # Let's just define the full list.
        
        doctors_data = [
            {"name": "Dr. Sarah Mitchell", "specialization": "Clinical Psychologist", "availability_status": "Available", "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"},
            {"name": "Dr. David Chen", "specialization": "Psychiatrist", "availability_status": "Busy", "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=David"},
            {"name": "Dr. Emily Wilson", "specialization": "Therapist", "availability_status": "Available", "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"},
            {"name": "Dr. James Carter", "specialization": "Anxiety Specialist", "availability_status": "Offline", "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=James"},
            {"name": "Dr. Anita Patel", "specialization": "Child Psychologist", "availability_status": "Available", "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita"},
            {"name": "Dr. Robert Fox", "specialization": "Addiction Specialist", "availability_status": "Available", "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert"},
            {"name": "Dr. Lisa Wong", "specialization": "Couples Therapist", "availability_status": "Busy", "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa"},
            {"name": "Dr. Michael Brown", "specialization": "Trauma Specialist", "availability_status": "Offline", "image_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"},
        ]
        
        # Only insert if collection is empty to avoid duplicates on every restart
        if count == 0:
            await db["doctors"].insert_many(doctors_data)
            print(f"✅ Seeded {len(doctors_data)} doctors.")
        else:
            print("Doctors already exist, skipping seed.")
