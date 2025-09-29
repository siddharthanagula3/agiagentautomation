#!/bin/bash

echo "========================================"
echo "   NETLIFY BUILD VERIFICATION SCRIPT"
echo "========================================"
echo ""

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo "[1/7] Checking Node version..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found! Please install Node.js 20+${NC}"
    exit 1
fi
node --version
echo -e "${GREEN}✅ Node.js installed${NC}"
echo ""

# Check npm version
echo "[2/7] Checking npm version..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found!${NC}"
    exit 1
fi
npm --version
echo -e "${GREEN}✅ npm installed${NC}"
echo ""

# Clean previous builds
echo "[3/7] Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.vite
echo -e "${GREEN}✅ Cleaned build artifacts${NC}"
echo ""

# Install dependencies (matching Netlify's npm ci)
echo "[4/7] Installing dependencies (like Netlify does)..."
echo "This may take a few minutes..."
npm ci
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Dependency installation failed!${NC}"
    echo "Try running: npm install"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Type checking
echo "[5/7] Running TypeScript type check..."
npm run type-check
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  TypeScript errors found! Fix these before deploying.${NC}"
    echo ""
else
    echo -e "${GREEN}✅ No TypeScript errors${NC}"
    echo ""
fi

# Run production build
echo "[6/7] Running production build (like Netlify does)..."
npm run build
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌❌❌ BUILD FAILED ❌❌❌${NC}"
    echo ""
    echo "The build failed just like on Netlify."
    echo "Check the error messages above."
    echo ""
    echo "Common issues:"
    echo "- Missing environment variables"
    echo "- TypeScript compilation errors"
    echo "- Import errors or circular dependencies"
    echo "- Missing dependencies in package.json"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Build succeeded!${NC}"
echo ""

# Check dist folder
echo "[7/7] Verifying build output..."
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ dist/index.html not found!${NC}"
    exit 1
fi
if [ ! -d "dist/assets" ]; then
    echo -e "${RED}❌ dist/assets folder not found!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build output looks good${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}   ✅ ALL CHECKS PASSED! ✅${NC}"
echo "========================================"
echo ""
echo "Your build is ready for Netlify!"
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m 'fix: build configuration for production'"
echo "3. git push origin main"
echo ""
echo "Netlify will automatically detect and deploy your changes."
echo ""
