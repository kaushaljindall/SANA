from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import jwt
import bcrypt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")

# In-memory user database (replace with actual database in production)
users_db = {}

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register")
async def register(user: UserRegister):
    # Check if user already exists
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_id = str(len(users_db) + 1)
    users_db[user.email] = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    # Create token
    token = create_access_token({"sub": user.email, "id": user_id})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": user.name,
            "email": user.email
        }
    }

@router.post("/login")
async def login(user: UserLogin):
    # Check if user exists
    if user.email not in users_db:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    stored_user = users_db[user.email]
    
    # Verify password
    if not bcrypt.checkpw(user.password.encode('utf-8'), stored_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = create_access_token({"sub": user.email, "id": stored_user["id"]})
    
    return {
        "token": token,
        "user": {
            "id": stored_user["id"],
            "name": stored_user["name"],
            "email": stored_user["email"]
        }
    }

@router.get("/me")
async def get_current_user(payload: dict = Depends(verify_token)):
    email = payload.get("sub")
    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[email]
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"]
    }

@router.put("/me")
async def update_user(user_update: UserUpdate, payload: dict = Depends(verify_token)):
    email = payload.get("sub")
    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[email]
    
    if user_update.name:
        user["name"] = user_update.name
        
    # Note: Email update is skipped for simplicity in this file-based DB mock
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"]
    }

@router.post("/change-password")
async def change_password(pwd_data: PasswordChange, payload: dict = Depends(verify_token)):
    email = payload.get("sub")
    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
        
    user = users_db[email]
    
    # Check current password
    if not user["password"]:
        raise HTTPException(status_code=400, detail="Account uses Google Login, cannot change password")
        
    if not bcrypt.checkpw(pwd_data.current_password.encode('utf-8'), user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    # Set new password
    hashed_password = bcrypt.hashpw(pwd_data.new_password.encode('utf-8'), bcrypt.gensalt())
    user["password"] = hashed_password
    
    return {"message": "Password updated successfully"}

@router.get("/google")
async def google_login():
    """Redirect to Google OAuth"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid%20email%20profile&"
        f"access_type=offline"
    )
    
    return {"url": google_auth_url}

@router.get("/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth callback"""
    try:
        import requests
        
        # Exchange code for tokens
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code"
            }
        )
        
        tokens = token_response.json()
        
        # Get user info
        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        
        user_info = user_info_response.json()
        
        # Check if user exists, create if not
        email = user_info['email']
        if email not in users_db:
            user_id = str(len(users_db) + 1)
            users_db[email] = {
                "id": user_id,
                "name": user_info.get('name', email.split('@')[0]),
                "email": email,
                "password": None,  # OAuth users don't have passwords
                "google_id": user_info['id'],
                "created_at": datetime.utcnow()
            }
        
        stored_user = users_db[email]
        
        # Create JWT token
        token = create_access_token({"sub": email, "id": stored_user["id"]})
        
        # Redirect to frontend with token
        return {
            "redirect": f"http://localhost:5173/?token={token}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
