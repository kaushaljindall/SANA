import bcrypt
from fastapi import HTTPException, status
from models.user import UserModel, UserSettings
from schemas.user import UserRegister, UserLogin
from db.database import get_database

async def create_user(user_data: UserRegister):
    db = get_database()
    
    # Check if user exists
    existing_user = await db["users"].find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())

    # Create user model
    new_user = UserModel(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password.decode('utf-8'),
        auth_provider="local"
    )

    # Insert into DB
    result = await db["users"].insert_one(new_user.model_dump(by_alias=True, exclude=["id"]))
    
    # Fetch created user
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    return UserModel(**created_user)

async def authenticate_user(login_data: UserLogin):
    db = get_database()
    user = await db["users"].find_one({"email": login_data.email})
    
    if not user:
        return None
        
    if not user.get("hashed_password"):
        # Google user trying to login with password
        return None

    if bcrypt.checkpw(login_data.password.encode('utf-8'), user["hashed_password"].encode('utf-8')):
        return UserModel(**user)
    
    return None

async def get_user_by_email(email: str):
    db = get_database()
    user = await db["users"].find_one({"email": email})
    if user:
        return UserModel(**user)
    return None

async def get_user_or_create_google(email: str, name: str, google_id: str):
    db = get_database()
    user = await db["users"].find_one({"email": email})
    
    if user:
        return UserModel(**user)
    
    # Create new Google user
    new_user = UserModel(
        name=name,
        email=email,
        auth_provider="google",
        google_id=google_id,
        settings=UserSettings()
    )
    
    result = await db["users"].insert_one(new_user.model_dump(by_alias=True, exclude=["id"]))
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    return UserModel(**created_user)

async def update_user(email: str, update_data: dict):
    db = get_database()
    result = await db["users"].update_one(
        {"email": email},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        return None
        
    updated_user = await db["users"].find_one({"email": email})
    return UserModel(**updated_user)

async def change_password(email: str, new_password: str):
    db = get_database()
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    
    await db["users"].update_one(
        {"email": email},
        {"$set": {"hashed_password": hashed_password.decode('utf-8')}}
    )
