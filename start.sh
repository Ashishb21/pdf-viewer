#!/bin/bash

# PDF Viewer Server Startup Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting PDF Viewer Server...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 14+ to continue.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="14.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old. Please install Node.js 14+ to continue.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed successfully.${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed.${NC}"
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo -e "${YELLOW}📁 Creating uploads directory...${NC}"
    mkdir -p uploads
    echo -e "${GREEN}✅ Uploads directory created.${NC}"
fi

# Copy environment file if it doesn't exist
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo -e "${YELLOW}⚙️  Creating environment configuration...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Environment file created from .env.example${NC}"
    echo -e "${YELLOW}💡 You can modify .env file to customize server settings.${NC}"
fi

# Start the server
echo -e "${GREEN}🌟 Starting server...${NC}"
echo -e "${YELLOW}📄 PDF Viewer will be available at: http://localhost:3000${NC}"
echo -e "${YELLOW}🛑 Press Ctrl+C to stop the server${NC}"
echo ""

# Check if we should run in development mode
if [ "$1" = "dev" ]; then
    if command -v nodemon &> /dev/null; then
        npm run dev
    else
        echo -e "${YELLOW}⚠️  nodemon not found, installing...${NC}"
        npm install -g nodemon
        npm run dev
    fi
else
    npm start
fi