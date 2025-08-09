#!/bin/bash

# PDF Viewer Full-Stack Application Startup Script
# This script starts both backend (FastAPI) and frontend with authentication system

echo "🚀 Starting PDF Viewer Full-Stack Application..."
echo "================================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment. Please ensure Python 3.8+ is installed."
        exit 1
    fi
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Install any missing dependencies in the virtual environment
echo "📦 Installing project dependencies..."
pip install --upgrade pip --quiet

# Check if we need to install any additional packages for the launcher
pip install --quiet requests psutil 2>/dev/null || true

# Run the main application launcher
echo "🎯 Starting full-stack application..."
echo ""
python run.py

# Deactivate virtual environment when done
deactivate