import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "sana_db")

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    try:
        # Using AsyncIOMotorClient with params requested by user
        # Note: We must use AsyncIOMotorClient to support FastAPI async routes
        db.client = AsyncIOMotorClient(
            MONGO_DETAILS,
            maxPoolSize=10,
            tlsAllowInvalidCertificates=True
        )
        
        # Ping the server to verify connection and catch errors early
        await db.client.admin.command('ping')
        db.db = db.client[DB_NAME]
        print(f"✅ Connected to MongoDB at {MONGO_DETAILS}")
    except Exception as e:
        print(f"❌ MongoDB Connection Error: {e}")
        raise e

async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("Closed MongoDB connection")

def get_database():
    return db.db
