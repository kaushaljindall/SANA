from fastapi import APIRouter, HTTPException, Depends
from schemas.user import UserResponse, UserUpdate, PasswordChange
from services.auth_service import get_user_by_email, update_user, change_password
from utils.security import get_current_user_email
import bcrypt

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def read_users_me(email: str = Depends(get_current_user_email)):
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/me", response_model=UserResponse)
async def update_user_me(user_update: UserUpdate, email: str = Depends(get_current_user_email)):
    update_data = user_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided")
        
    updated_user = await update_user(email, update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found or no changes made")
        
    return updated_user

@router.post("/change-password")
async def update_password(pwd_data: PasswordChange, email: str = Depends(get_current_user_email)):
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.hashed_password:
        raise HTTPException(status_code=400, detail="Account uses external auth provider")
        
    if not bcrypt.checkpw(pwd_data.current_password.encode('utf-8'), user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    await change_password(email, pwd_data.new_password)
    return {"message": "Password updated successfully"}
