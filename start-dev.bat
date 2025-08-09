@echo off
REM PDF Viewer Development Startup Script for Windows
REM This script starts both backend (FastAPI) and frontend (Node.js) servers

echo 🚀 Starting PDF Viewer with Authentication System...
echo ================================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.7+ and try again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 14+ and try again.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

REM Kill any existing processes on our ports (Windows)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1

REM Setup and start backend
echo 🔧 Setting up backend (FastAPI)...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 📦 Activating virtual environment...
call venv\Scripts\activate

REM Install backend dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt --quiet

REM Start backend in background
echo 🚀 Starting backend server on http://localhost:8000
start /b python run.py
timeout /t 3 >nul

REM Setup and start frontend
echo 🔧 Setting up frontend (Node.js)...
cd ..\frontend

REM Install frontend dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    call npm install --silent
)

REM Start frontend in background
echo 🚀 Starting frontend server on http://localhost:3000
start /b npm start
timeout /t 3 >nul

REM Success message
echo.
echo 🎉 PDF Viewer is now running!
echo ================================================
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📚 API Docs: http://localhost:8000/docs
echo.
echo 🧪 Test Accounts:
echo    User: test@example.com / testpass123
echo    Admin: admin@example.com / admin123
echo.
echo 💡 Tips:
echo    • Press Ctrl+C to stop all servers
echo    • Use Ctrl+D on login page for demo credentials
echo    • Watch your credits in the top-right corner
echo.

REM Open browser automatically
timeout /t 2 >nul
start http://localhost:3000

echo 📊 Servers are running in background...
echo Press any key to stop all servers and exit...
pause >nul

REM Cleanup - kill processes on our ports
echo.
echo 🛑 Shutting down servers...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000"') do taskkill /f /pid %%a >nul 2>&1

echo ✅ Servers stopped successfully
pause