from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.user import CreditStatus, CreditUsage, SubscriptionCreate, SubscriptionResponse
from app.models.user import User, CreditTransaction, SubscriptionStatus
from app.services.database import db
from app.auth.dependencies import get_current_active_user, check_credits
from app.core.config import settings

router = APIRouter()

@router.get("/status", response_model=CreditStatus)
async def get_credit_status(current_user: User = Depends(get_current_active_user)):
    """Get current user's credit status"""
    # Update subscription status first
    current_user = db.check_and_update_subscription_status(current_user.id)
    
    credits_used_today = db.get_daily_credit_usage(current_user.id)
    total_available = current_user.free_credits_remaining + current_user.subscription_credits_remaining
    
    return CreditStatus(
        total_credits_available=total_available,
        free_credits_remaining=current_user.free_credits_remaining,
        subscription_credits_remaining=current_user.subscription_credits_remaining,
        credits_used_today=credits_used_today,
        subscription_status=current_user.subscription_status,
        subscription_expires_at=current_user.subscription_expires_at
    )

@router.post("/use")
async def use_credits(
    usage: CreditUsage,
    current_user: User = Depends(check_credits(1))  # Will be overridden by actual usage
):
    """Use credits for an operation"""
    # Check if user has enough credits
    total_available = current_user.free_credits_remaining + current_user.subscription_credits_remaining
    
    if total_available < usage.credits_to_use:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient credits. Required: {usage.credits_to_use}, Available: {total_available}"
        )
    
    # Deduct credits
    success = db.deduct_credits(
        user_id=current_user.id,
        credits_to_deduct=usage.credits_to_use,
        operation=usage.operation,
        metadata=usage.metadata
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to deduct credits"
        )
    
    # Get updated user info
    updated_user = db.get_user_by_id(current_user.id)
    
    return {
        "message": f"Successfully used {usage.credits_to_use} credits for {usage.operation}",
        "credits_remaining": {
            "free": updated_user.free_credits_remaining,
            "subscription": updated_user.subscription_credits_remaining,
            "total": updated_user.free_credits_remaining + updated_user.subscription_credits_remaining
        }
    }

@router.get("/transactions")
async def get_credit_transactions(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user)
) -> List[CreditTransaction]:
    """Get user's credit transaction history"""
    transactions = db.get_user_transactions(current_user.id, limit=limit)
    return transactions

@router.post("/subscribe", response_model=SubscriptionResponse)
async def subscribe(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Subscribe to premium plan (mock implementation)"""
    
    # In a real implementation, this would integrate with Stripe or similar
    # For now, we'll just activate the subscription
    
    success = db.activate_subscription(current_user.id, subscription_data.plan_type)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to activate subscription"
        )
    
    updated_user = db.get_user_by_id(current_user.id)
    
    return SubscriptionResponse(
        status=updated_user.subscription_status,
        expires_at=updated_user.subscription_expires_at,
        credits_remaining=updated_user.subscription_credits_remaining,
        plan_type=subscription_data.plan_type
    )

@router.delete("/subscription")
async def cancel_subscription(current_user: User = Depends(get_current_active_user)):
    """Cancel current subscription"""
    
    if current_user.subscription_status not in [SubscriptionStatus.ACTIVE]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active subscription to cancel"
        )
    
    # Update subscription status
    db.update_user(current_user.id, {
        "subscription_status": SubscriptionStatus.CANCELLED
    })
    
    return {"message": "Subscription cancelled successfully"}

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription_info(current_user: User = Depends(get_current_active_user)):
    """Get current subscription information"""
    
    # Update subscription status first
    current_user = db.check_and_update_subscription_status(current_user.id)
    
    plan_type = "free"
    if current_user.subscription_status in [SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED]:
        plan_type = "monthly"  # Default, could be stored in user model
    
    return SubscriptionResponse(
        status=current_user.subscription_status,
        expires_at=current_user.subscription_expires_at,
        credits_remaining=current_user.subscription_credits_remaining,
        plan_type=plan_type
    )