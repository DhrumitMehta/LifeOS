#!/bin/bash
# WSL Build Script for LifeOS
# This script builds the app from WSL to avoid Windows permission issues

set -e  # Exit on error

echo "=== LifeOS WSL Build Script ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if we're in WSL
if [ ! -d "/mnt/c" ] && [ ! -d "/mnt/f" ]; then
    echo -e "${RED}[ERROR] This script must be run from WSL${NC}"
    echo "Please run this from a WSL terminal (Ubuntu, etc.)"
    exit 1
fi

# Get the project directory (assuming script is in project root)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${CYAN}Project directory: $PROJECT_DIR${NC}"
echo ""

# Step 1: Check Node.js
echo -e "${YELLOW}Step 1: Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed in WSL${NC}"
    echo "Please install Node.js:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}[OK] Node.js $NODE_VERSION found${NC}"
echo ""

# Step 2: Check npm
echo -e "${YELLOW}Step 2: Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}[OK] npm $NPM_VERSION found${NC}"
echo ""

# Step 3: Check EAS CLI
echo -e "${YELLOW}Step 3: Checking EAS CLI...${NC}"
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}[WARNING] EAS CLI not found globally, checking locally...${NC}"
    if [ ! -f "node_modules/.bin/eas" ]; then
        echo -e "${YELLOW}Installing EAS CLI locally...${NC}"
        npm install -g eas-cli
    else
        export PATH="$PROJECT_DIR/node_modules/.bin:$PATH"
    fi
fi
if command -v eas &> /dev/null; then
    EAS_VERSION=$(eas --version 2>/dev/null || echo "installed")
    echo -e "${GREEN}[OK] EAS CLI found ($EAS_VERSION)${NC}"
else
    echo -e "${RED}[ERROR] EAS CLI not found${NC}"
    echo "Please install: npm install -g eas-cli"
    exit 1
fi
echo ""

# Step 4: Check project files
echo -e "${YELLOW}Step 4: Checking project files...${NC}"
REQUIRED_FILES=(
    "package.json"
    "app.json"
    "eas.json"
    "assets/icon.png"
    "assets/splash.png"
    "assets/adaptive-icon.png"
    "assets/favicon.png"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}[ERROR] Missing required files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    exit 1
fi
echo -e "${GREEN}[OK] All required files found${NC}"
echo ""

# Step 5: Install dependencies (if needed)
echo -e "${YELLOW}Step 5: Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}[OK] Dependencies already installed${NC}"
fi
echo ""

# Step 6: Select build profile
echo -e "${YELLOW}Step 6: Select build profile${NC}"
echo "  1. Preview (APK for testing)"
echo "  2. Production (APK for production)"
read -p "Enter choice (1 or 2, default: 1): " profile

if [ "$profile" = "2" ]; then
    BUILD_PROFILE="production"
else
    BUILD_PROFILE="preview"
fi

echo ""

# Step 7: Confirm build
echo -e "${CYAN}Build Configuration:${NC}"
echo "  Profile: $BUILD_PROFILE"
echo "  Platform: android"
echo ""
read -p "Proceed with build? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Build cancelled."
    exit 0
fi

echo ""
echo -e "${CYAN}Starting EAS build...${NC}"
echo "This may take 15-20 minutes for the first build."
echo ""

# Step 8: Run the build
if eas build --platform android --profile "$BUILD_PROFILE"; then
    echo ""
    echo -e "${GREEN}[OK] Build completed successfully!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}[ERROR] Build failed. Check the error messages above.${NC}"
    exit 1
fi




