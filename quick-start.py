#!/usr/bin/env python3
"""
Quick Start Script for PDF Viewer with Authentication
Simple launcher that handles all setup and starts both servers
"""

import os
import sys
import time
import subprocess
import threading
import socket
import webbrowser
from pathlib import Path

def print_status(message, status="info"):
    colors = {
        "info": "\033[0;34m",  # Blue
        "success": "\033[0;32m",  # Green  
        "warning": "\033[1;33m",  # Yellow
        "error": "\033[0;31m",  # Red
        "reset": "\033[0m"
    }
    
    icons = {
        "info": "ℹ️",
        "success": "✅",
        "warning": "⚠️", 
        "error": "❌"
    }
    
    color = colors.get(status, colors["info"])
    icon = icons.get(status, "")
    reset = colors["reset"]
    
    print(f"{color}{icon} {message}{reset}")

def check_port(port):
    """Check if port is available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) == 0
    except:
        return False

def run_command(cmd, cwd=None):
    """Run command and return success status"""
    try:
        result = subprocess.run(
            cmd, 
            shell=True, 
            cwd=cwd, 
            capture_output=True, 
            text=True
        )
        return result.returncode == 0
    except:
        return False

def start_server(cmd, cwd, name):
    """Start server in background"""
    def run():
        try:
            subprocess.run(cmd, shell=True, cwd=cwd)
        except:
            pass
    
    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread

def main():
    print_status("PDF Viewer Quick Start", "info")
    print("=" * 50)
    
    # Check Python
    if sys.version_info < (3, 8):
        print_status("Python 3.8+ required", "error")
        sys.exit(1)
    
    print_status("Python version OK", "success")
    
    # Get directories
    root_dir = Path(__file__).parent
    backend_dir = root_dir / "backend"
    frontend_dir = root_dir / "frontend"
    
    # Setup backend
    print_status("Setting up backend...", "info")
    
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print_status("Creating backend virtual environment...", "warning")
        if not run_command("python3 -m venv venv", backend_dir):
            print_status("Failed to create virtual environment", "error")
            sys.exit(1)
    
    # Install backend dependencies
    print_status("Installing backend dependencies...", "info")
    pip_cmd = str(venv_dir / ("Scripts/pip.exe" if os.name == 'nt' else "bin/pip"))
    if not run_command(f'"{pip_cmd}" install -r requirements.txt -q', backend_dir):
        print_status("Failed to install backend dependencies", "error")
        sys.exit(1)
    
    # Setup frontend
    print_status("Setting up frontend...", "info")
    if not (frontend_dir / "node_modules").exists():
        print_status("Installing frontend dependencies...", "warning")
        if not run_command("npm install --silent", frontend_dir):
            print_status("Failed to install frontend dependencies", "error")
            sys.exit(1)
    
    # Start backend
    print_status("Starting backend server...", "info")
    python_cmd = str(venv_dir / ("Scripts/python.exe" if os.name == 'nt' else "bin/python"))
    start_server(f'"{python_cmd}" run.py', backend_dir, "backend")
    
    # Wait for backend
    for i in range(30):
        if check_port(8000):
            break
        time.sleep(1)
    else:
        print_status("Backend failed to start", "error")
        sys.exit(1)
    
    print_status("Backend running on http://localhost:8000", "success")
    
    # Start frontend
    print_status("Starting frontend server...", "info")
    start_server("npm start", frontend_dir, "frontend")
    
    # Wait for frontend
    for i in range(30):
        if check_port(3000):
            break
        time.sleep(1)
    else:
        print_status("Frontend failed to start", "error")
        sys.exit(1)
    
    print_status("Frontend running on http://localhost:3000", "success")
    
    # Success message
    print()
    print_status("🎉 PDF Viewer is ready!", "success")
    print("=" * 50)
    print("🌐 Application: http://localhost:3000")
    print("🔧 API: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print()
    print("🧪 Test Accounts:")
    print("   👤 User: test@example.com / testpass123")
    print("   👑 Admin: admin@example.com / admin123")
    print()
    print("💡 Press Ctrl+C to stop servers")
    
    # Open browser
    try:
        webbrowser.open("http://localhost:3000")
    except:
        pass
    
    # Keep running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print_status("Shutting down...", "warning")
        sys.exit(0)

if __name__ == "__main__":
    main()