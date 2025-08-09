#!/usr/bin/env python3
"""
PDF Viewer Development Server Launcher
Cross-platform Python script to start both backend and frontend servers
"""

import os
import sys
import time
import signal
import subprocess
import threading
import socket
from pathlib import Path

# Colors for terminal output
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    PURPLE = '\033[0;35m'
    CYAN = '\033[0;36m'
    WHITE = '\033[1;37m'
    END = '\033[0m'
    
    @staticmethod
    def colorize(text, color):
        return f"{color}{text}{Colors.END}"

def print_colored(text, color=Colors.WHITE):
    print(Colors.colorize(text, color))

def check_port(port):
    """Check if a port is in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def kill_port(port):
    """Kill process running on a specific port"""
    try:
        if os.name == 'nt':  # Windows
            subprocess.run(f'for /f "tokens=5" %a in (\'netstat -aon ^| find ":{port}"\') do taskkill /f /pid %a', 
                         shell=True, capture_output=True)
        else:  # Unix/Linux/macOS
            subprocess.run(f'lsof -ti:{port} | xargs kill -9', shell=True, capture_output=True)
    except:
        pass

def check_command(command):
    """Check if a command exists"""
    try:
        subprocess.run([command, '--version'], capture_output=True, check=True)
        return True
    except:
        return False

def run_command_in_directory(command, directory, name, color=Colors.GREEN):
    """Run a command in a specific directory and stream output"""
    def run():
        try:
            os.chdir(directory)
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            for line in iter(process.stdout.readline, ''):
                if line.strip():
                    print_colored(f"[{name}] {line.strip()}", color)
            
            process.stdout.close()
            return process.wait()
        except Exception as e:
            print_colored(f"[{name}] Error: {e}", Colors.RED)
    
    thread = threading.Thread(target=run)
    thread.daemon = True
    thread.start()
    return thread

def main():
    print_colored("🚀 Starting PDF Viewer with Authentication System...", Colors.CYAN)
    print_colored("=" * 50, Colors.CYAN)
    
    # Get project root directory
    project_root = Path(__file__).parent.absolute()
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    # Check prerequisites
    print_colored("🔍 Checking prerequisites...", Colors.BLUE)
    
    python_cmd = "python3" if check_command("python3") else "python"
    if not check_command(python_cmd):
        print_colored("❌ Python is not installed. Please install Python 3.7+ and try again.", Colors.RED)
        sys.exit(1)
    
    if not check_command("node"):
        print_colored("❌ Node.js is not installed. Please install Node.js 14+ and try again.", Colors.RED)
        sys.exit(1)
    
    if not check_command("npm"):
        print_colored("❌ npm is not installed. Please install npm and try again.", Colors.RED)
        sys.exit(1)
    
    print_colored("✅ Prerequisites check passed", Colors.GREEN)
    print()
    
    # Kill existing processes on our ports
    print_colored("🧹 Cleaning up existing processes...", Colors.YELLOW)
    kill_port(8000)  # Backend
    kill_port(3000)  # Frontend
    time.sleep(1)
    
    # Setup backend
    print_colored("🔧 Setting up backend (FastAPI)...", Colors.BLUE)
    os.chdir(backend_dir)
    
    # Create virtual environment if it doesn't exist
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print_colored("📦 Creating virtual environment...", Colors.YELLOW)
        subprocess.run([python_cmd, "-m", "venv", "venv"], check=True)
    
    # Activate virtual environment and install dependencies
    if os.name == 'nt':  # Windows
        activate_script = venv_dir / "Scripts" / "activate.bat"
        pip_cmd = str(venv_dir / "Scripts" / "pip.exe")
        python_venv = str(venv_dir / "Scripts" / "python.exe")
    else:  # Unix/Linux/macOS
        activate_script = venv_dir / "bin" / "activate"
        pip_cmd = str(venv_dir / "bin" / "pip")
        python_venv = str(venv_dir / "bin" / "python")
    
    print_colored("📦 Installing Python dependencies...", Colors.YELLOW)
    subprocess.run([pip_cmd, "install", "-r", "requirements.txt", "--quiet"], check=True)
    
    # Setup frontend
    print_colored("🔧 Setting up frontend (Node.js)...", Colors.BLUE)
    os.chdir(frontend_dir)
    
    if not (frontend_dir / "node_modules").exists():
        print_colored("📦 Installing Node.js dependencies...", Colors.YELLOW)
        subprocess.run(["npm", "install", "--silent"], check=True)
    
    # Start servers
    print_colored("🚀 Starting servers...", Colors.GREEN)
    print()
    
    processes = []
    
    # Start backend
    print_colored("🔧 Starting backend server on http://localhost:8000", Colors.GREEN)
    backend_thread = run_command_in_directory(
        f"{python_venv} run.py",
        str(backend_dir),
        "BACKEND",
        Colors.BLUE
    )
    
    # Wait for backend to start
    time.sleep(3)
    if not check_port(8000):
        print_colored("❌ Backend failed to start on port 8000", Colors.RED)
        sys.exit(1)
    
    # Start frontend
    print_colored("🌐 Starting frontend server on http://localhost:3000", Colors.GREEN)
    frontend_thread = run_command_in_directory(
        "npm start",
        str(frontend_dir),
        "FRONTEND",
        Colors.GREEN
    )
    
    # Wait for frontend to start
    time.sleep(3)
    if not check_port(3000):
        print_colored("❌ Frontend failed to start on port 3000", Colors.RED)
        sys.exit(1)
    
    # Success message
    print()
    print_colored("🎉 PDF Viewer is now running!", Colors.GREEN)
    print_colored("=" * 50, Colors.GREEN)
    print_colored("🌐 Frontend: http://localhost:3000", Colors.WHITE)
    print_colored("🔧 Backend API: http://localhost:8000", Colors.WHITE)
    print_colored("📚 API Docs: http://localhost:8000/docs", Colors.WHITE)
    print()
    print_colored("🧪 Test Accounts:", Colors.YELLOW)
    print_colored("   User: test@example.com / testpass123", Colors.WHITE)
    print_colored("   Admin: admin@example.com / admin123", Colors.WHITE)
    print()
    print_colored("💡 Tips:", Colors.CYAN)
    print_colored("   • Press Ctrl+C to stop all servers", Colors.WHITE)
    print_colored("   • Use Ctrl+D on login page for demo credentials", Colors.WHITE)
    print_colored("   • Watch your credits in the top-right corner", Colors.WHITE)
    print()
    print_colored("📊 Monitoring servers (Press Ctrl+C to stop)...", Colors.BLUE)
    print_colored("=" * 50, Colors.BLUE)
    
    # Cleanup function
    def cleanup(signum=None, frame=None):
        print()
        print_colored("🛑 Shutting down servers...", Colors.YELLOW)
        kill_port(8000)
        kill_port(3000)
        print_colored("✅ Servers stopped successfully", Colors.GREEN)
        sys.exit(0)
    
    # Register signal handlers
    signal.signal(signal.SIGINT, cleanup)
    signal.signal(signal.SIGTERM, cleanup)
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()