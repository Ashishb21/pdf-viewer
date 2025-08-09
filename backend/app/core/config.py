from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    app_name: str = "PDF Viewer Auth API"
    debug: bool = True
    
    # JWT Settings
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS Settings
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500"
    
    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated origins into a list"""
        return [origin.strip() for origin in self.allowed_origins.split(',')]
    
    # Credit System Settings
    free_credits_per_user: int = 100
    subscription_credits_monthly: int = 1000
    subscription_price_monthly: float = 9.99
    
    # Google OAuth Settings
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"
    
    # Email Settings for Password Reset
    mail_username: str = "your-email@gmail.com"
    mail_password: str = "your-app-password"
    mail_from: str = "your-email@gmail.com"
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_starttls: bool = True
    mail_ssl_tls: bool = False
    
    # Frontend URL for password reset links
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"

settings = Settings()