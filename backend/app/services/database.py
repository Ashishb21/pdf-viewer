from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
from app.models.user import User, CreditTransaction, SubscriptionStatus, PasswordResetToken
from app.core.config import settings

class MockDatabase:
    """Mock database using in-memory storage"""
    
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.credit_transactions: List[CreditTransaction] = []
        self.users_by_email: Dict[str, str] = {}  # email -> user_id mapping
        self.password_reset_tokens: Dict[str, PasswordResetToken] = {}  # token -> reset_token mapping
        
    def create_user(self, user: User) -> User:
        self.users[user.id] = user
        self.users_by_email[user.email] = user.id
        return user
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self.users.get(user_id)
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        user_id = self.users_by_email.get(email)
        if user_id:
            return self.users.get(user_id)
        return None
    
    def update_user(self, user_id: str, user_data: dict) -> Optional[User]:
        user = self.users.get(user_id)
        if user:
            for key, value in user_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            user.updated_at = datetime.utcnow()
            return user
        return None
    
    def delete_user(self, user_id: str) -> bool:
        user = self.users.get(user_id)
        if user:
            del self.users[user_id]
            del self.users_by_email[user.email]
            return True
        return False
    
    def add_credit_transaction(self, transaction: CreditTransaction) -> CreditTransaction:
        self.credit_transactions.append(transaction)
        return transaction
    
    def get_user_transactions(self, user_id: str, limit: int = 100) -> List[CreditTransaction]:
        transactions = [t for t in self.credit_transactions if t.user_id == user_id]
        return sorted(transactions, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def get_daily_credit_usage(self, user_id: str) -> int:
        today = datetime.utcnow().date()
        daily_transactions = [
            t for t in self.credit_transactions 
            if t.user_id == user_id and t.timestamp.date() == today
        ]
        return sum(t.credits_used for t in daily_transactions)
    
    def activate_subscription(self, user_id: str, plan_type: str = "monthly") -> bool:
        user = self.get_user_by_id(user_id)
        if user:
            user.subscription_status = SubscriptionStatus.ACTIVE
            user.subscription_credits_remaining = settings.subscription_credits_monthly
            
            # Set expiration date based on plan type
            if plan_type == "monthly":
                user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
            elif plan_type == "yearly":
                user.subscription_expires_at = datetime.utcnow() + timedelta(days=365)
            
            user.last_credit_reset = datetime.utcnow()
            return True
        return False
    
    def deduct_credits(self, user_id: str, credits_to_deduct: int, operation: str, metadata: dict = None) -> bool:
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        total_available = user.free_credits_remaining + user.subscription_credits_remaining
        
        if total_available < credits_to_deduct:
            return False  # Insufficient credits
        
        # Create transaction record
        transaction = CreditTransaction(
            user_id=user_id,
            credits_used=credits_to_deduct,
            operation=operation,
            metadata=metadata or {}
        )
        self.add_credit_transaction(transaction)
        
        # Deduct from subscription credits first, then free credits
        if user.subscription_credits_remaining >= credits_to_deduct:
            user.subscription_credits_remaining -= credits_to_deduct
        else:
            remaining_to_deduct = credits_to_deduct - user.subscription_credits_remaining
            user.subscription_credits_remaining = 0
            user.free_credits_remaining -= remaining_to_deduct
        
        user.credits_used += credits_to_deduct
        return True
    
    def check_and_update_subscription_status(self, user_id: str) -> Optional[User]:
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        # Check if subscription has expired
        if (user.subscription_status == SubscriptionStatus.ACTIVE and 
            user.subscription_expires_at and 
            datetime.utcnow() > user.subscription_expires_at):
            user.subscription_status = SubscriptionStatus.EXPIRED
            user.subscription_credits_remaining = 0
        
        return user
    
    def create_password_reset_token(self, user_id: str, token: str) -> PasswordResetToken:
        """Create a new password reset token"""
        # Invalidate any existing tokens for this user
        existing_tokens = [t for t in self.password_reset_tokens.values() if t.user_id == user_id]
        for existing_token in existing_tokens:
            existing_token.used = True
        
        # Create new token
        reset_token = PasswordResetToken(
            user_id=user_id,
            token=token
        )
        self.password_reset_tokens[token] = reset_token
        return reset_token
    
    def get_password_reset_token(self, token: str) -> Optional[PasswordResetToken]:
        """Get password reset token by token string"""
        return self.password_reset_tokens.get(token)
    
    def use_password_reset_token(self, token: str) -> bool:
        """Mark password reset token as used"""
        reset_token = self.password_reset_tokens.get(token)
        if reset_token and not reset_token.used and datetime.utcnow() < reset_token.expires_at:
            reset_token.used = True
            return True
        return False
    
    def cleanup_expired_tokens(self):
        """Remove expired password reset tokens"""
        current_time = datetime.utcnow()
        expired_tokens = [
            token for token, reset_token in self.password_reset_tokens.items()
            if current_time > reset_token.expires_at or reset_token.used
        ]
        for token in expired_tokens:
            del self.password_reset_tokens[token]

# Global database instance
db = MockDatabase()

# Initialize with some test data
def init_test_data():
    from app.core.security import get_password_hash
    
    # Create test user
    test_user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        free_credits_remaining=95,  # Used 5 credits
        credits_used=5
    )
    db.create_user(test_user)
    
    # Create admin user
    admin_user = User(
        email="admin@example.com",
        hashed_password=get_password_hash("admin123"),
        full_name="Admin User",
        role="admin",
        subscription_status=SubscriptionStatus.ACTIVE,
        subscription_credits_remaining=1000,
        subscription_expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.create_user(admin_user)

# Initialize test data when module is imported
init_test_data()