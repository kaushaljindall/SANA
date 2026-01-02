import os
from fastapi import APIRouter, HTTPException, Depends
from schemas.user import UserRegister, UserLogin, UserResponse, PasswordChange
from services.auth_service import create_user, authenticate_user, get_user_by_email, get_user_or_create_google
from utils.security import create_access_token, verify_token, get_current_user_email
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google/callback")

@router.post("/register", response_model=dict)
async def register(user: UserRegister):
    new_user = await create_user(user)
    token = create_access_token({"sub": new_user.email, "id": str(new_user.id)})
    
    return {
        "token": token,
        "user": {
            "id": str(new_user.id),
            "name": new_user.name,
            "email": new_user.email
        }
    }

@router.post("/login", response_model=dict)
async def login(user: UserLogin):
    authenticated_user = await authenticate_user(user)
    if not authenticated_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": authenticated_user.email, "id": str(authenticated_user.id)})
    
    return {
        "token": token,
        "user": {
            "id": str(authenticated_user.id),
            "name": authenticated_user.name,
            "email": authenticated_user.email
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user(email: str = Depends(get_current_user_email)):
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        created_at=user.created_at,
        auth_provider=user.auth_provider,
        settings=user.settings.model_dump()
    )

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
        
        if "error" in tokens:
             raise HTTPException(status_code=400, detail=tokens.get("error_description"))

        # Get user info
        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"}
        )
        
        user_info = user_info_response.json()
        
        # Get or Create User
        user = await get_user_or_create_google(
            email=user_info['email'],
            name=user_info.get('name', user_info['email'].split('@')[0]),
            google_id=user_info['id']
        )
        
        token = create_access_token({"sub": user.email, "id": str(user.id)})
        
        # Redirect to frontend with token
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return {
            "redirect": f"{frontend_url}/?token={token}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
