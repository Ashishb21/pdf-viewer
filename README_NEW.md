# 🔐 PDF Viewer with Authentication & Credit System

A secure PDF viewer application with user authentication, credit-based AI features, and subscription management.

## 🌟 Features

### Authentication System
- **User Registration & Login** with JWT tokens
- **Secure API** with Bearer token authentication
- **User session management** with automatic redirection

### Credit System
- **100 Free Credits** for new users
- **Subscription-based** premium plans
- **Real-time credit tracking** and usage monitoring
- **Pay-per-use** AI operations:
  - Text Analysis: 2 credits
  - Q&A with PDF: 3 credits
  - Summarization: 4 credits

### PDF Features
- **Interactive PDF viewing** with zoom and navigation
- **Text selection and highlighting**
- **AI-powered analysis** of selected text
- **Smart chat interface** with context awareness
- **Search functionality** within PDFs

## 🏗️ Project Structure

```
├── backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API routes (auth, credits, pdf)
│   │   ├── auth/           # Authentication middleware
│   │   ├── core/           # Configuration and security
│   │   ├── models/         # Data models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic and mock database
│   │   └── main.py         # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── run.py             # Development server
│
├── frontend/               # Frontend Application
│   ├── index.html         # Main PDF viewer
│   ├── auth.html          # Login/Registration page
│   ├── server.js          # Development server
│   └── package.json       # Node dependencies
│
└── README_NEW.md          # This file
```

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the FastAPI server:**
   ```bash
   python run.py
   ```
   
   The API will be available at: `http://localhost:8000`
   - API Documentation: `http://localhost:8000/docs`
   - Alternative Docs: `http://localhost:8000/redoc`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   
   The application will be available at: `http://localhost:3000`

### Alternative: Simple HTTP Server

If you prefer not to use Node.js, you can serve the frontend with Python:

```bash
cd frontend
python -m http.server 5500
```

Then visit: `http://localhost:5500`

## 🧪 Test Accounts

The system comes with pre-configured test accounts:

### Regular User
- **Email:** `test@example.com`
- **Password:** `testpass123`
- **Credits:** 95 free credits remaining

### Admin User
- **Email:** `admin@example.com`  
- **Password:** `admin123`
- **Status:** Active subscription with 1000 credits

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Credits & Subscription
- `GET /api/credits/status` - Get credit status
- `POST /api/credits/use` - Use credits for operations
- `GET /api/credits/transactions` - Get transaction history
- `POST /api/credits/subscribe` - Subscribe to premium
- `DELETE /api/credits/subscription` - Cancel subscription

### PDF Operations
- `POST /api/pdf/analyze` - Analyze PDF text (2 credits)
- `POST /api/pdf/ask` - Ask questions about PDF (3 credits)
- `POST /api/pdf/summarize` - Summarize content (4 credits)

## 💳 Credit System Details

### Free Tier
- **100 credits** for new users
- No expiration on free credits
- Access to all AI features

### Premium Subscription
- **1000 credits/month** for $9.99
- Credits reset monthly
- Priority support
- Advanced features

### Credit Usage
- **Text Analysis:** 2 credits - Explain selected text
- **Q&A:** 3 credits - Ask questions about PDF content  
- **Summarization:** 4 credits - Generate summaries

## 🛠️ Development Features

### Mock Database
- In-memory storage for development
- Pre-loaded with test data
- Easy to replace with real database

### Security
- JWT token authentication
- Password hashing with bcrypt
- CORS configured for development
- Request validation with Pydantic

### Error Handling
- Graceful degradation for API failures
- User-friendly error messages
- Automatic token refresh handling

## 🔧 Configuration

### Backend Configuration
Edit `backend/app/core/config.py`:
- JWT secret key
- Token expiration time
- Credit amounts
- CORS origins

### Frontend Configuration
Edit API base URL in `frontend/index.html` and `frontend/auth.html`:
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

## 📝 Usage Tips

1. **Demo Login:** Press `Ctrl+D` on the login page to fill demo credentials
2. **Credit Monitoring:** Watch the credit counter in the top-right corner
3. **Text Selection:** Select any text in the PDF to get AI analysis options
4. **Chat Interface:** Type questions naturally - the system detects intent
5. **Subscription:** Use the mock subscription system to test premium features

## 🚧 Future Enhancements

- Real database integration (PostgreSQL/MongoDB)
- Stripe payment integration
- Email verification system
- Admin dashboard
- Advanced PDF features (annotations, bookmarks)
- Mobile-responsive design
- Multi-language support

## 📄 License

This is a development/demonstration project. Adjust licensing as needed for production use.

---

**Ready to explore AI-powered PDF analysis with secure authentication! 🎉**