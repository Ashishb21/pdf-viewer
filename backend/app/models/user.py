from typing import Optional, List
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, field
from uuid import uuid4

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class SubscriptionStatus(str, Enum):
    FREE = "free"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

@dataclass
class User:
    id: str = field(default_factory=lambda: str(uuid4()))
    email: str = ""
    hashed_password: str = ""
    full_name: str = ""
    is_active: bool = True
    role: UserRole = UserRole.USER
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    # OAuth fields
    google_id: Optional[str] = None
    
    # Credit system
    credits_used: int = 0
    free_credits_remaining: int = 100
    subscription_status: SubscriptionStatus = SubscriptionStatus.FREE
    subscription_credits_remaining: int = 0
    subscription_expires_at: Optional[datetime] = None
    last_credit_reset: Optional[datetime] = None

@dataclass
class UserCreate:
    email: str
    password: str
    full_name: str

@dataclass
class UserLogin:
    email: str
    password: str

@dataclass
class CreditTransaction:
    id: str = field(default_factory=lambda: str(uuid4()))
    user_id: str = ""
    credits_used: int = 0
    operation: str = ""  # "llm_query", "pdf_analysis", etc.
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: dict = field(default_factory=dict)

@dataclass
class PasswordResetToken:
    id: str = field(default_factory=lambda: str(uuid4()))
    user_id: str = ""
    token: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(hours=1))  # 1 hour expiry
    used: bool = False