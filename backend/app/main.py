from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.core.config import settings
from app.api import auth, credits, pdf

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(credits.router, prefix="/api/credits", tags=["Credits & Subscription"])
app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF Operations"])

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html>
        <head>
            <title>PDF Viewer API</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; text-align: center; }
                .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; }
                .method { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
                .post { background: #28a745; color: white; }
                .get { background: #17a2b8; color: white; }
                .delete { background: #dc3545; color: white; }
                code { background: #e9ecef; padding: 2px 4px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔐 PDF Viewer Authentication API</h1>
                <p>Welcome to the PDF Viewer API with authentication and credit system!</p>
                
                <h2>🚀 Authentication Endpoints</h2>
                <div class="endpoint">
                    <span class="method post">POST</span> <code>/api/auth/register</code><br>
                    Register a new user account
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span> <code>/api/auth/login</code><br>
                    Login with email and password
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/auth/me</code><br>
                    Get current user information
                </div>
                
                <h2>💳 Credit System Endpoints</h2>
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/credits/status</code><br>
                    Get current credit status and subscription info
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span> <code>/api/credits/use</code><br>
                    Use credits for operations
                </div>
                <div class="endpoint">
                    <span class="method get">GET</span> <code>/api/credits/transactions</code><br>
                    Get credit transaction history
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span> <code>/api/credits/subscribe</code><br>
                    Subscribe to premium plan
                </div>
                
                <h2>📄 PDF Operations Endpoints</h2>
                <div class="endpoint">
                    <span class="method post">POST</span> <code>/api/pdf/analyze</code><br>
                    Analyze PDF text (2 credits)
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span> <code>/api/pdf/ask</code><br>
                    Ask questions about PDF content (3 credits)
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span> <code>/api/pdf/summarize</code><br>
                    Summarize PDF content (4 credits)
                </div>
                <div class="endpoint">
                    <span class="method post">POST</span> <code>/api/pdf/chat</code><br>
                    General chat with Anthropic AI (2 credits) - Currently with dummy responses
                </div>
                
                <h2>📚 Documentation</h2>
                <p>
                    • <a href="/docs" target="_blank">Interactive API Documentation (Swagger)</a><br>
                    • <a href="/redoc" target="_blank">Alternative Documentation (ReDoc)</a>
                </p>
                
                <h2>🧪 Test Accounts</h2>
                <div style="background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <strong>Regular User:</strong><br>
                    Email: <code>test@example.com</code><br>
                    Password: <code>testpass123</code><br>
                    Credits: 95 free credits remaining
                </div>
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px;">
                    <strong>Admin User:</strong><br>
                    Email: <code>admin@example.com</code><br>
                    Password: <code>admin123</code><br>
                    Status: Active subscription with 1000 credits
                </div>
            </div>
        </body>
    </html>
    """

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "PDF Viewer API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)