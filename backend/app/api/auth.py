from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from app.schemas.user import UserCreate, UserLogin, Token, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, MessageResponse
from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.services.database import db
from app.auth.dependencies import get_current_active_user
from app.services.email import send_password_reset_email, send_password_changed_notification, generate_reset_token
import httpx
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from urllib.parse import urlencode
import secrets

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = db.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        free_credits_remaining=settings.free_credits_per_user
    )
    
    created_user = db.create_user(new_user)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=created_user.email, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=created_user.id,
        email=created_user.email,
        full_name=created_user.full_name,
        is_active=created_user.is_active,
        role=created_user.role,
        created_at=created_user.created_at,
        credits_used=created_user.credits_used,
        free_credits_remaining=created_user.free_credits_remaining,
        subscription_status=created_user.subscription_status,
        subscription_credits_remaining=created_user.subscription_credits_remaining,
        subscription_expires_at=created_user.subscription_expires_at
    )
    
    return Token(access_token=access_token, user=user_response)

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    user = db.get_user_by_email(login_data.email)
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Update subscription status
    user = db.check_and_update_subscription_status(user.id)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        role=user.role,
        created_at=user.created_at,
        credits_used=user.credits_used,
        free_credits_remaining=user.free_credits_remaining,
        subscription_status=user.subscription_status,
        subscription_credits_remaining=user.subscription_credits_remaining,
        subscription_expires_at=user.subscription_expires_at
    )
    
    return Token(access_token=access_token, user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        role=current_user.role,
        created_at=current_user.created_at,
        credits_used=current_user.credits_used,
        free_credits_remaining=current_user.free_credits_remaining,
        subscription_status=current_user.subscription_status,
        subscription_credits_remaining=current_user.subscription_credits_remaining,
        subscription_expires_at=current_user.subscription_expires_at
    )

# Store state for OAuth flow (in production, use Redis or database)
oauth_states = {}

@router.get("/google")
async def google_login():
    """Initiate Google OAuth flow"""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
    
    # Generate state parameter for security
    state = secrets.token_urlsafe(32)
    oauth_states[state] = True  # Store state
    
    # Build Google OAuth URL
    params = {
        'client_id': settings.google_client_id,
        'redirect_uri': settings.google_redirect_uri,
        'scope': 'openid email profile',
        'response_type': 'code',
        'state': state,
        'access_type': 'offline',
        'prompt': 'select_account'
    }
    
    google_auth_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"
    return {"auth_url": google_auth_url}

@router.get("/google/callback")
async def google_callback(code: str = None, state: str = None, error: str = None):
    """Handle Google OAuth callback"""
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth error: {error}"
        )
    
    if not code or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing authorization code or state"
        )
    
    # Verify state parameter
    if state not in oauth_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter"
        )
    
    # Remove used state
    del oauth_states[state]
    
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    'client_id': settings.google_client_id,
                    'client_secret': settings.google_client_secret,
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': settings.google_redirect_uri,
                }
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to exchange code for tokens"
                )
            
            tokens = token_response.json()
            id_token_jwt = tokens.get('id_token')
            
            if not id_token_jwt:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No ID token received"
                )
            
            # Verify and decode ID token
            try:
                idinfo = id_token.verify_oauth2_token(
                    id_token_jwt, 
                    google_requests.Request(), 
                    settings.google_client_id
                )
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid ID token: {str(e)}"
                )
            
            # Extract user info
            google_user_id = idinfo.get('sub')
            email = idinfo.get('email')
            full_name = idinfo.get('name', '')
            
            if not email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No email provided by Google"
                )
            
            # Check if user exists
            existing_user = db.get_user_by_email(email)
            
            if existing_user:
                # User exists, log them in
                user = existing_user
                # Update subscription status
                user = db.check_and_update_subscription_status(user.id)
            else:
                # Create new user
                new_user = User(
                    email=email,
                    hashed_password="",  # No password for Google users
                    full_name=full_name,
                    free_credits_remaining=settings.free_credits_per_user,
                    google_id=google_user_id
                )
                user = db.create_user(new_user)
            
            # Create access token
            access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
            access_token = create_access_token(
                subject=user.email, expires_delta=access_token_expires
            )
            
            user_response = UserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
                role=user.role,
                created_at=user.created_at,
                credits_used=user.credits_used,
                free_credits_remaining=user.free_credits_remaining,
                subscription_status=user.subscription_status,
                subscription_credits_remaining=user.subscription_credits_remaining,
                subscription_expires_at=user.subscription_expires_at
            )
            
            # Redirect to frontend with token
            frontend_url = f"http://localhost:3000/auth/callback?token={access_token}&user={user_response.model_dump_json()}"
            return RedirectResponse(url=frontend_url)
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth flow failed: {str(e)}"
        )

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email to user"""
    
    # Check if user exists
    user = db.get_user_by_email(request.email)
    
    # Always return success message for security (don't reveal if email exists)
    success_message = "If an account with that email exists, we've sent a password reset link."
    
    if user:
        try:
            # Generate reset token
            reset_token = generate_reset_token()
            
            # Store token in database
            db.create_password_reset_token(user.id, reset_token)
            
            # Send email
            email_sent = await send_password_reset_email(
                email=user.email,
                reset_token=reset_token,
                user_name=user.full_name
            )
            
            if not email_sent:
                print(f"Failed to send password reset email to {user.email}")
                # Still return success for security
                
        except Exception as e:
            print(f"Error in forgot password flow: {str(e)}")
            # Still return success for security
    
    return MessageResponse(message=success_message)

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest):
    """Reset user password using reset token"""
    
    # Validate token
    reset_token_obj = db.get_password_reset_token(request.token)
    
    if not reset_token_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    if reset_token_obj.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has already been used"
        )
    
    from datetime import datetime
    if datetime.utcnow() > reset_token_obj.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Get user
    user = db.get_user_by_id(reset_token_obj.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    # Validate password strength
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    try:
        # Update password
        hashed_password = get_password_hash(request.new_password)
        db.update_user(user.id, {"hashed_password": hashed_password})
        
        # Mark token as used
        db.use_password_reset_token(request.token)
        
        # Send confirmation email
        await send_password_changed_notification(
            email=user.email,
            user_name=user.full_name
        )
        
        # Clean up expired tokens
        db.cleanup_expired_tokens()
        
        return MessageResponse(message="Password has been successfully reset. You can now login with your new password.")
        
    except Exception as e:
        print(f"Error resetting password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )