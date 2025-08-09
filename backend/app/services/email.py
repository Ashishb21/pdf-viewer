from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings
import secrets

# Email configuration - only create if email settings are provided
try:
    conf = ConnectionConfig(
        MAIL_USERNAME=settings.mail_username,
        MAIL_PASSWORD=settings.mail_password,
        MAIL_FROM=settings.mail_from,
        MAIL_PORT=settings.mail_port,
        MAIL_SERVER=settings.mail_server,
        MAIL_STARTTLS=settings.mail_starttls,
        MAIL_SSL_TLS=settings.mail_ssl_tls,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True
    )
    
    fastmail = FastMail(conf)
except Exception as e:
    print(f"Email configuration error: {e}")
    fastmail = None

def generate_reset_token() -> str:
    """Generate a secure random token for password reset"""
    return secrets.token_urlsafe(32)

async def send_password_reset_email(email: str, reset_token: str, user_name: str = ""):
    """Send password reset email to user"""
    
    reset_link = f"{settings.frontend_url}/reset-password?token={reset_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - PDF Viewer</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }}
            .container {{
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f0f0f0;
            }}
            .logo {{
                font-size: 24px;
                color: #667eea;
                margin-bottom: 10px;
            }}
            .reset-button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 500;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #f0f0f0;
                color: #666;
                font-size: 14px;
                text-align: center;
            }}
            .warning {{
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 PDF Viewer</div>
                <h1>Password Reset Request</h1>
            </div>
            
            <p>Hello{" " + user_name if user_name else ""},</p>
            
            <p>We received a request to reset your password for your PDF Viewer account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
                <a href="{reset_link}" class="reset-button">Reset My Password</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                    <li>This reset link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
                </ul>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">
                {reset_link}
            </p>
            
            <div class="footer">
                <p>This email was sent from PDF Viewer App</p>
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    PDF Viewer - Password Reset Request
    
    Hello{" " + user_name if user_name else ""},
    
    We received a request to reset your password for your PDF Viewer account.
    
    To reset your password, please click on this link:
    {reset_link}
    
    Important:
    - This reset link will expire in 1 hour for security reasons
    - If you didn't request this reset, please ignore this email
    - Your password will remain unchanged until you create a new one
    
    If you have any questions, please contact our support team.
    
    Best regards,
    PDF Viewer Team
    """
    
    message = MessageSchema(
        subject="Reset Your PDF Viewer Password",
        recipients=[email],
        body=text_content,
        html=html_content,
        subtype=MessageType.html
    )
    
    try:
        if fastmail:
            await fastmail.send_message(message)
            return True
        else:
            print("Email service not configured. Reset email not sent.")
            return False
    except Exception as e:
        print(f"Failed to send password reset email: {str(e)}")
        return False

async def send_password_changed_notification(email: str, user_name: str = ""):
    """Send notification email when password is successfully changed"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed - PDF Viewer</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }}
            .container {{
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f0f0f0;
            }}
            .logo {{
                font-size: 24px;
                color: #667eea;
                margin-bottom: 10px;
            }}
            .success {{
                background: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #155724;
                text-align: center;
            }}
            .footer {{
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #f0f0f0;
                color: #666;
                font-size: 14px;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🔐 PDF Viewer</div>
                <h1>Password Successfully Changed</h1>
            </div>
            
            <div class="success">
                <strong>✅ Password Updated Successfully</strong>
            </div>
            
            <p>Hello{" " + user_name if user_name else ""},</p>
            
            <p>Your PDF Viewer account password has been successfully changed. You can now use your new password to sign in to your account.</p>
            
            <p><strong>If you didn't make this change:</strong></p>
            <ul>
                <li>Please contact our support team immediately</li>
                <li>Someone may have unauthorized access to your account</li>
                <li>Consider changing your password again as a precaution</li>
            </ul>
            
            <div class="footer">
                <p>This email was sent from PDF Viewer App</p>
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    PDF Viewer - Password Successfully Changed
    
    Hello{" " + user_name if user_name else ""},
    
    Your PDF Viewer account password has been successfully changed. You can now use your new password to sign in to your account.
    
    If you didn't make this change:
    - Please contact our support team immediately
    - Someone may have unauthorized access to your account
    - Consider changing your password again as a precaution
    
    Best regards,
    PDF Viewer Team
    """
    
    message = MessageSchema(
        subject="PDF Viewer Password Changed",
        recipients=[email],
        body=text_content,
        html=html_content,
        subtype=MessageType.html
    )
    
    try:
        if fastmail:
            await fastmail.send_message(message)
            return True
        else:
            print("Email service not configured. Password change notification not sent.")
            return False
    except Exception as e:
        print(f"Failed to send password changed notification: {str(e)}")
        return False