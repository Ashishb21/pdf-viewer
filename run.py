#!/usr/bin/env python3
"""
PDF Viewer Development Server Launcher
Comprehensive cross-platform script to start both backend and frontend servers
"""

import os
import sys
import time
import signal
import subprocess
import threading
import socket
import webbrowser
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
    BOLD = '\033[1m'
    END = '\033[0m'
    
    @staticmethod
    def colorize(text, color):
        if os.name == 'nt' and not os.environ.get('ANSICON'):
            return text  # Windows without ANSI support
        return f"{color}{text}{Colors.END}"

def print_colored(text, color=Colors.WHITE):
    print(Colors.colorize(text, color))

def print_header(text):
    print()
    print_colored("=" * 60, Colors.CYAN)
    print_colored(text, Colors.BOLD + Colors.CYAN)
    print_colored("=" * 60, Colors.CYAN)
    print()

def check_port(port, timeout=1):
    """Check if a port is in use"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            return s.connect_ex(('localhost', port)) == 0
    except:
        return False

def kill_port(port):
    """Kill process running on a specific port"""
    try:
        if os.name == 'nt':  # Windows
            # Find and kill process on Windows
            result = subprocess.run(
                f'netstat -ano | findstr :{port}',
                shell=True, capture_output=True, text=True
            )
            if result.stdout:
                for line in result.stdout.strip().split('\n'):
                    if f':{port}' in line and 'LISTENING' in line:
                        pid = line.strip().split()[-1]
                        subprocess.run(f'taskkill /F /PID {pid}', shell=True, capture_output=True)
        else:  # Unix/Linux/macOS
            subprocess.run(f'lsof -ti:{port} | xargs kill -9', shell=True, capture_output=True)
        time.sleep(0.5)  # Give process time to die
    except Exception as e:
        print_colored(f"Warning: Could not kill process on port {port}: {e}", Colors.YELLOW)

def check_command(command):
    """Check if a command exists"""
    try:
        result = subprocess.run([command, '--version'], capture_output=True, check=True)
        return True
    except:
        return False

def install_backend_deps(backend_dir, python_venv):
    """Install backend dependencies"""
    print_colored("📦 Installing Python dependencies...", Colors.YELLOW)
    requirements_file = backend_dir / "requirements.txt"
    
    if not requirements_file.exists():
        print_colored("❌ requirements.txt not found in backend directory", Colors.RED)
        return False
    
    try:
        # Install requirements
        result = subprocess.run(
            [python_venv, "-m", "pip", "install", "-r", str(requirements_file), "--quiet"],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print_colored(f"❌ Failed to install backend dependencies: {e}", Colors.RED)
        if e.stderr:
            print_colored(f"Error: {e.stderr}", Colors.RED)
        return False

def install_frontend_deps(frontend_dir):
    """Install frontend dependencies"""
    print_colored("📦 Installing Node.js dependencies...", Colors.YELLOW)
    node_modules = frontend_dir / "node_modules"
    
    if node_modules.exists():
        print_colored("✅ Node modules already exist, skipping install", Colors.GREEN)
        return True
    
    try:
        os.chdir(frontend_dir)
        result = subprocess.run(
            ["npm", "install", "--silent"],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print_colored(f"❌ Failed to install frontend dependencies: {e}", Colors.RED)
        if e.stderr:
            print_colored(f"Error: {e.stderr}", Colors.RED)
        return False

def run_server(command, directory, name, color=Colors.GREEN):
    """Run a server and capture output"""
    def run():
        try:
            original_dir = os.getcwd()
            os.chdir(directory)
            
            print_colored(f"Starting {name}...", color)
            
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            # Store process for cleanup
            run_server.processes.append(process)
            
            for line in iter(process.stdout.readline, ''):
                if line.strip():
                    # Filter out some verbose logs
                    line_lower = line.lower()
                    if not any(skip in line_lower for skip in ['debug', 'info:', 'warning:']):
                        print_colored(f"[{name}] {line.strip()}", color)
            
            process.stdout.close()
            return_code = process.wait()
            
            if return_code != 0:
                print_colored(f"[{name}] Process exited with code {return_code}", Colors.RED)
            
        except Exception as e:
            print_colored(f"[{name}] Error: {e}", Colors.RED)
        finally:
            os.chdir(original_dir)
    
    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread

# Store processes for cleanup
run_server.processes = []

def main():
    print_header("🚀 PDF Viewer with Authentication System")
    
    # Get project root directory
    project_root = Path(__file__).parent.absolute()
    backend_dir = project_root / "backend"
    frontend_dir = project_root / "frontend"
    
    # Check if directories exist
    if not backend_dir.exists():
        print_colored("❌ Backend directory not found!", Colors.RED)
        sys.exit(1)
        
    if not frontend_dir.exists():
        print_colored("❌ Frontend directory not found!", Colors.RED)
        sys.exit(1)
    
    # Check prerequisites
    print_colored("🔍 Checking prerequisites...", Colors.BLUE)
    
    python_cmd = "python3" if check_command("python3") else "python"
    if not check_command(python_cmd):
        print_colored("❌ Python is not installed. Please install Python 3.8+ and try again.", Colors.RED)
        sys.exit(1)
    
    if not check_command("node"):
        print_colored("❌ Node.js is not installed. Please install Node.js 16+ and try again.", Colors.RED)
        sys.exit(1)
    
    if not check_command("npm"):
        print_colored("❌ npm is not installed. Please install npm and try again.", Colors.RED)
        sys.exit(1)
    
    print_colored("✅ Prerequisites check passed", Colors.GREEN)
    
    # Kill existing processes on our ports
    print_colored("🧹 Cleaning up existing processes...", Colors.YELLOW)
    kill_port(8000)  # Backend
    kill_port(3000)  # Frontend
    
    # Setup backend virtual environment
    print_colored("🔧 Setting up backend environment...", Colors.BLUE)
    venv_dir = backend_dir / "venv"
    
    if not venv_dir.exists():
        print_colored("📦 Creating backend virtual environment...", Colors.YELLOW)
        try:
            os.chdir(backend_dir)
            subprocess.run([python_cmd, "-m", "venv", "venv"], check=True)
        except subprocess.CalledProcessError as e:
            print_colored(f"❌ Failed to create virtual environment: {e}", Colors.RED)
            sys.exit(1)
    
    # Get virtual environment python executable
    if os.name == 'nt':  # Windows
        python_venv = str(venv_dir / "Scripts" / "python.exe")
    else:  # Unix/Linux/macOS
        python_venv = str(venv_dir / "bin" / "python")
    
    # Install backend dependencies
    if not install_backend_deps(backend_dir, python_venv):
        sys.exit(1)
    
    # Setup frontend
    print_colored("🔧 Setting up frontend environment...", Colors.BLUE)
    if not install_frontend_deps(frontend_dir):
        sys.exit(1)
    
    # Start servers
    print_header("🚀 Starting Development Servers")
    
    # Start backend
    print_colored("🔧 Starting backend server (FastAPI)...", Colors.BLUE)
    backend_thread = run_server(
        f'"{python_venv}" run.py',
        str(backend_dir),
        "API",
        Colors.BLUE
    )
    
    # Wait for backend to start
    print_colored("⏳ Waiting for backend to start...", Colors.YELLOW)
    for i in range(15):  # Wait up to 15 seconds
        if check_port(8000):
            break
        time.sleep(1)
        if i == 5:
            print_colored("⏳ Still starting backend...", Colors.YELLOW)
    
    if not check_port(8000):
        print_colored("❌ Backend failed to start on port 8000", Colors.RED)
        print_colored("Check backend logs above for errors", Colors.YELLOW)
        sys.exit(1)
    
    print_colored("✅ Backend started successfully on http://localhost:8000", Colors.GREEN)
    
    # Start frontend
    print_colored("🌐 Starting frontend server...", Colors.GREEN)
    frontend_thread = run_server(
        "npm start",
        str(frontend_dir),
        "WEB",
        Colors.GREEN
    )
    
    # Wait for frontend to start
    print_colored("⏳ Waiting for frontend to start...", Colors.YELLOW)
    for i in range(15):  # Wait up to 15 seconds
        if check_port(3000):
            break
        time.sleep(1)
        if i == 5:
            print_colored("⏳ Still starting frontend...", Colors.YELLOW)
    
    if not check_port(3000):
        print_colored("❌ Frontend failed to start on port 3000", Colors.RED)
        print_colored("Check frontend logs above for errors", Colors.YELLOW)
        sys.exit(1)
    
    print_colored("✅ Frontend started successfully on http://localhost:3000", Colors.GREEN)
    
    # Success message
    print_header("🎉 PDF Viewer is Running Successfully!")
    print_colored("🌐 Frontend Application: http://localhost:3000", Colors.WHITE)
    print_colored("🔧 Backend API: http://localhost:8000", Colors.WHITE)
    print_colored("📚 API Documentation: http://localhost:8000/docs", Colors.WHITE)
    print_colored("📖 Alternative Docs: http://localhost:8000/redoc", Colors.WHITE)
    print()
    
    print_colored("🧪 Test Accounts:", Colors.CYAN)
    print_colored("   👤 Regular User:", Colors.WHITE)
    print_colored("      Email: test@example.com", Colors.WHITE)
    print_colored("      Password: testpass123", Colors.WHITE)
    print_colored("      Credits: 95 free credits", Colors.WHITE)
    print()
    print_colored("   👑 Admin User:", Colors.WHITE)
    print_colored("      Email: admin@example.com", Colors.WHITE)
    print_colored("      Password: admin123", Colors.WHITE)
    print_colored("      Credits: 1000 subscription credits", Colors.WHITE)
    print()
    
    print_colored("💡 Usage Tips:", Colors.YELLOW)
    print_colored("   • Press Ctrl+C to stop all servers", Colors.WHITE)
    print_colored("   • Use Ctrl+D on login page for quick demo login", Colors.WHITE)
    print_colored("   • Watch your credits in the top-right corner", Colors.WHITE)
    print_colored("   • Select PDF text and ask AI questions", Colors.WHITE)
    print_colored("   • Try different AI operations (analyze, summarize, Q&A)", Colors.WHITE)
    print()
    
    # Open browser automatically (optional)
    try:
        print_colored("🌐 Opening browser...", Colors.CYAN)
        webbrowser.open("http://localhost:3000")
    except:
        print_colored("💡 Please open http://localhost:3000 in your browser", Colors.YELLOW)
    
    print_colored("📊 Monitoring servers... (Press Ctrl+C to stop)", Colors.BLUE)
    print_colored("-" * 60, Colors.BLUE)
    
    # Cleanup function
    def cleanup(signum=None, frame=None):
        print()
        print_colored("🛑 Shutting down servers...", Colors.YELLOW)
        
        # Kill all spawned processes
        for process in run_server.processes:
            try:
                process.terminate()
                process.wait(timeout=3)
            except:
                try:
                    process.kill()
                except:
                    pass
        
        # Kill processes on ports as backup
        kill_port(8000)
        kill_port(3000)
        
        print_colored("✅ Servers stopped successfully", Colors.GREEN)
        print_colored("👋 Thank you for using PDF Viewer!", Colors.CYAN)
        sys.exit(0)
    
    # Register signal handlers for graceful shutdown
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