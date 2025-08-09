from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, SubscriptionStatus

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    role: UserRole
    created_at: datetime
    credits_used: int
    free_credits_remaining: int
    subscription_status: SubscriptionStatus
    subscription_credits_remaining: int
    subscription_expires_at: Optional[datetime]

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

class CreditStatus(BaseModel):
    total_credits_available: int
    free_credits_remaining: int
    subscription_credits_remaining: int
    credits_used_today: int
    subscription_status: SubscriptionStatus
    subscription_expires_at: Optional[datetime]

class CreditUsage(BaseModel):
    credits_to_use: int
    operation: str
    metadata: Optional[dict] = None

class SubscriptionCreate(BaseModel):
    plan_type: str = "monthly"  # monthly, yearly
    
class SubscriptionResponse(BaseModel):
    status: SubscriptionStatus
    expires_at: Optional[datetime]
    credits_remaining: int
    plan_type: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class MessageResponse(BaseModel):
    message: str