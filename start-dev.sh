#!/bin/bash

# PDF Viewer Development Startup Script
# This script starts both backend (FastAPI) and frontend (Node.js) servers

echo "🚀 Starting PDF Viewer with Authentication System..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -ti:$1 >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    if port_in_use $1; then
        echo -e "${YELLOW}⚠️  Port $1 is in use. Killing existing process...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command_exists python3 && ! command_exists python; then
    echo -e "${RED}❌ Python is not installed. Please install Python 3.7+ and try again.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 14+ and try again.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm and try again.${NC}"
    exit 1
fi

# Get Python command
PYTHON_CMD="python3"
if ! command_exists python3; then
    PYTHON_CMD="python"
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Kill any existing processes on our ports
kill_port 8000  # Backend
kill_port 3000  # Frontend

# Setup and start backend
echo -e "${BLUE}🔧 Setting up backend (FastAPI)...${NC}"
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}📦 Activating virtual environment...${NC}"
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

# Install backend dependencies
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
pip install -r requirements.txt --quiet

# Start backend in background
echo -e "${GREEN}🚀 Starting backend server on http://localhost:8000${NC}"
$PYTHON_CMD run.py &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Check if backend started successfully
if ! port_in_use 8000; then
    echo -e "${RED}❌ Backend failed to start on port 8000${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Setup and start frontend
echo -e "${BLUE}🔧 Setting up frontend (Node.js)...${NC}"
cd ../frontend

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    npm install --silent
fi

# Start frontend in background
echo -e "${GREEN}🚀 Starting frontend server on http://localhost:3000${NC}"
npm start &
FRONTEND_PID=$!

# Give frontend time to start
sleep 3

# Check if frontend started successfully
if ! port_in_use 3000; then
    echo -e "${RED}❌ Frontend failed to start on port 3000${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Success message
echo ""
echo -e "${GREEN}🎉 PDF Viewer is now running!${NC}"
echo "================================================"
echo -e "${GREEN}🌐 Frontend:${NC} http://localhost:3000"
echo -e "${GREEN}🔧 Backend API:${NC} http://localhost:8000"
echo -e "${GREEN}📚 API Docs:${NC} http://localhost:8000/docs"
echo ""
echo -e "${BLUE}🧪 Test Accounts:${NC}"
echo -e "   User: test@example.com / testpass123"
echo -e "   Admin: admin@example.com / admin123"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   • Press Ctrl+C to stop all servers"
echo -e "   • Use Ctrl+D on login page for demo credentials"
echo -e "   • Watch your credits in the top-right corner"
echo ""
echo -e "${BLUE}🔍 Logs:${NC}"
echo -e "   Backend PID: $BACKEND_PID"
echo -e "   Frontend PID: $FRONTEND_PID"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    
    # Kill any remaining processes on our ports
    kill_port 8000
    kill_port 3000
    
    echo -e "${GREEN}✅ Servers stopped successfully${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM EXIT

# Keep script running and show logs
echo -e "${BLUE}📊 Monitoring servers (Press Ctrl+C to stop)...${NC}"
echo "================================================"

# Wait for user interrupt
wait