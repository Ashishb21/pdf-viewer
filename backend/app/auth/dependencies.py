from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_token
from app.services.database import db
from app.models.user import User
from typing import Optional

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    user_email = verify_token(token)
    
    if user_email is None:
        raise credentials_exception
    
    user = db.get_user_by_email(user_email)
    if user is None:
        raise credentials_exception
    
    # Check and update subscription status
    user = db.check_and_update_subscription_status(user.id)
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def check_credits(required_credits: int = 1):
    async def _check_credits(current_user: User = Depends(get_current_active_user)) -> User:
        # Update subscription status first
        current_user = db.check_and_update_subscription_status(current_user.id)
        
        total_available = current_user.free_credits_remaining + current_user.subscription_credits_remaining
        
        if total_available < required_credits:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Insufficient credits. Required: {required_credits}, Available: {total_available}. Please upgrade your subscription."
            )
        
        return current_user
    
    return _check_credits