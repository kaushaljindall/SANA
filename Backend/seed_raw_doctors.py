import os
import pymongo
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "sana_db")

def seed_raw():
    print(f"Connecting to {MONGO_DETAILS}...")
    client = pymongo.MongoClient(MONGO_DETAILS)
    db = client[DB_NAME]
    
    # Raw Data
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

    # Clear existing
    print("Clearing existing doctors...")
    db.doctors.delete_many({})
    
    # Insert
    print(f"Inserting {len(doctors_data)} doctors...")
    db.doctors.insert_many(doctors_data)
    
    print("✅ Doctors seeded successfully!")
    
    # Verify
    count = db.doctors.count_documents({})
    print(f"Total doctors in DB: {count}")

if __name__ == "__main__":
    seed_raw()
