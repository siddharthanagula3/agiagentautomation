#!/bin/bash

# Quick Start Verification Script
# Checks if everything is set up correctly

echo "🚀 AI Agent Automation - Quick Start Verification"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check if node_modules exists
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules found"
else
    echo -e "${YELLOW}⚠${NC} node_modules not found. Running npm install..."
    npm install
fi

# Check for .env file
echo "Checking environment variables..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file found"
    
    # Check for required keys
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_URL configured"
    else
        echo -e "${RED}✗${NC} VITE_SUPABASE_URL not found in .env"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY configured"
    else
        echo -e "${RED}✗${NC} VITE_SUPABASE_ANON_KEY not found in .env"
    fi
    
    # Check for at least one AI provider
    AI_PROVIDER_FOUND=0
    if grep -q "VITE_ANTHROPIC_API_KEY" .env && ! grep -q "VITE_ANTHROPIC_API_KEY=$" .env; then
        echo -e "${GREEN}✓${NC} Anthropic API key configured"
        AI_PROVIDER_FOUND=1
    fi
    if grep -q "VITE_GOOGLE_API_KEY" .env && ! grep -q "VITE_GOOGLE_API_KEY=$" .env; then
        echo -e "${GREEN}✓${NC} Google API key configured"
        AI_PROVIDER_FOUND=1
    fi
    if grep -q "VITE_OPENAI_API_KEY" .env && ! grep -q "VITE_OPENAI_API_KEY=$" .env; then
        echo -e "${GREEN}✓${NC} OpenAI API key configured"
        AI_PROVIDER_FOUND=1
    fi
    
    if [ $AI_PROVIDER_FOUND -eq 0 ]; then
        echo -e "${YELLOW}⚠${NC} No AI provider API keys configured (app will use mock data)"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    echo "  Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} Created .env file. Please add your API keys."
    else
        echo -e "${RED}✗${NC} .env.example not found"
    fi
fi

# Check for key files
echo ""
echo "Checking implementation files..."

FILES_TO_CHECK=(
    "supabase/migrations/005_analytics_tables.sql"
    "supabase/migrations/006_automation_tables.sql"
    "src/services/cache-service.ts"
    "src/services/analytics-service.ts"
    "src/services/automation-service.ts"
    "src/tools/filesystem-tools.ts"
    "find-mock-data.js"
    "IMPLEMENTATION_COMPLETE.md"
)

ALL_FILES_FOUND=1
for FILE in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$FILE" ]; then
        echo -e "${GREEN}✓${NC} $FILE"
    else
        echo -e "${RED}✗${NC} $FILE missing"
        ALL_FILES_FOUND=0
    fi
done

# Check required packages
echo ""
echo "Checking required packages..."

PACKAGES=(
    "@tanstack/react-query"
    "zustand"
    "framer-motion"
)

for PACKAGE in "${PACKAGES[@]}"; do
    if npm list "$PACKAGE" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $PACKAGE installed"
    else
        echo -e "${YELLOW}⚠${NC} $PACKAGE not found. Installing..."
        npm install "$PACKAGE"
    fi
done

# Summary
echo ""
echo "=================================================="
echo "Summary:"
echo ""

if [ $ALL_FILES_FOUND -eq 1 ]; then
    echo -e "${GREEN}✓${NC} All implementation files present"
else
    echo -e "${RED}✗${NC} Some implementation files missing"
fi

echo ""
echo "Next Steps:"
echo "1. ${YELLOW}Run database migrations${NC} in Supabase SQL Editor"
echo "   - 005_analytics_tables.sql"
echo "   - 006_automation_tables.sql"
echo ""
echo "2. ${YELLOW}Find and fix mock data${NC}"
echo "   - Run: node find-mock-data.js"
echo ""
echo "3. ${YELLOW}Start development server${NC}"
echo "   - Run: npm run dev"
echo ""
echo "4. ${YELLOW}Verify everything works${NC}"
echo "   - Visit: http://localhost:5173/dashboard"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - IMPLEMENTATION_COMPLETE.md"
echo "   - Check the artifacts in Claude"
echo ""
echo "=================================================="
