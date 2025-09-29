#!/bin/bash

# Complete Installation and Verification Script
# This script installs everything and verifies the installation

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  AGI Agent Automation - Complete Setup & Verification     ║"
echo "║  This will install, build, and verify everything          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track success
SUCCESS=0
WARNINGS=0
ERRORS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}❌ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Check prerequisites
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking Prerequisites"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status 0 "Node.js installed: $NODE_VERSION"
    
    # Check if version is 20+
    MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
    if [ "$MAJOR_VERSION" -ge 20 ]; then
        print_status 0 "Node.js version is 20 or higher"
    else
        print_warning "Node.js version is below 20. Recommended: 20+"
    fi
else
    print_status 1 "Node.js not found"
    echo "Please install Node.js 20+ from https://nodejs.org"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_status 0 "npm installed: $NPM_VERSION"
else
    print_status 1 "npm not found"
    exit 1
fi

echo ""

# Step 2: Install dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Installing Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "Running npm clean install..."
if npm ci 2>&1 | tee /tmp/npm-install.log; then
    print_status 0 "Core dependencies installed"
else
    print_warning "npm ci failed, trying npm install..."
    if npm install; then
        print_status 0 "Dependencies installed with npm install"
    else
        print_status 1 "Failed to install dependencies"
        exit 1
    fi
fi

# Install enhanced chat dependencies
print_info "Installing enhanced chat dependencies..."
npm install react-syntax-highlighter @types/react-syntax-highlighter dompurify @types/dompurify
print_status $? "Enhanced chat dependencies installed"

echo ""

# Step 3: Check environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Checking Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f .env ]; then
    print_warning ".env file not found"
    if [ -f .env.example ]; then
        cp .env.example .env
        print_info "Created .env from .env.example"
    fi
else
    print_status 0 ".env file exists"
fi

# Check API keys
check_env_var() {
    if grep -q "$1=" .env 2>/dev/null && ! grep -q "$1=$" .env 2>/dev/null; then
        print_status 0 "$2 configured"
        return 0
    else
        print_warning "$2 not configured"
        return 1
    fi
}

check_env_var "VITE_OPENAI_API_KEY" "OpenAI API"
check_env_var "VITE_ANTHROPIC_API_KEY" "Anthropic API"
check_env_var "VITE_GOOGLE_API_KEY" "Google API"
check_env_var "VITE_PERPLEXITY_API_KEY" "Perplexity API"

echo ""

# Step 4: Type checking
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: TypeScript Type Checking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if npm run type-check; then
    print_status 0 "No TypeScript errors"
else
    print_warning "TypeScript errors found (may not block build)"
fi

echo ""

# Step 5: Build
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Building Project"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_info "Running production build..."
if npm run build; then
    print_status 0 "Build successful"
else
    print_status 1 "Build failed"
    echo ""
    echo "Check the error messages above and fix issues before deploying."
    exit 1
fi

# Check build output
if [ -f "dist/index.html" ]; then
    print_status 0 "dist/index.html created"
else
    print_status 1 "dist/index.html not found"
fi

if [ -d "dist/assets" ]; then
    print_status 0 "dist/assets directory created"
    ASSET_COUNT=$(find dist/assets -type f | wc -l)
    print_info "Found $ASSET_COUNT asset files"
else
    print_status 1 "dist/assets not found"
fi

echo ""

# Step 6: Verify files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Verifying Enhanced Chat Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

verify_file() {
    if [ -f "$1" ]; then
        print_status 0 "$2"
        return 0
    else
        print_status 1 "$2 (file not found: $1)"
        return 1
    fi
}

# Services
verify_file "src/services/streaming-service.ts" "Streaming Service"
verify_file "src/services/tool-executor-service.ts" "Tool Executor Service"
verify_file "src/services/artifact-service.ts" "Artifact Service"
verify_file "src/services/web-search-service.ts" "Web Search Service"

# Components
verify_file "src/components/chat/ArtifactRenderer.tsx" "Artifact Renderer"
verify_file "src/components/chat/ToolExecutionPanel.tsx" "Tool Execution Panel"
verify_file "src/components/chat/StreamingIndicator.tsx" "Streaming Indicator"

# Pages
verify_file "src/pages/chat/ChatPageEnhanced.tsx" "Enhanced Chat Page"
verify_file "src/pages/chat/ChatPage.tsx" "Legacy Chat Page"

# Documentation
verify_file "CHAT_ENHANCEMENT_COMPLETE.md" "Enhancement Documentation"
verify_file "QUICK_START_ENHANCED_CHAT.md" "Quick Start Guide"

echo ""

# Step 7: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: Installation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}✅ Successful: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Errors: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           🎉 INSTALLATION COMPLETE! 🎉                     ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Your enhanced chat interface is ready!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Next Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Start development server:"
    echo "   ${BLUE}npm run dev${NC}"
    echo ""
    echo "2. Open in browser:"
    echo "   ${BLUE}http://localhost:5173/chat${NC}"
    echo ""
    echo "3. Test features:"
    echo "   • Send a message (watch streaming)"
    echo "   • Enable Tools (⋮ button)"
    echo "   • Try web search"
    echo "   • Create artifacts"
    echo "   • Upload images"
    echo ""
    echo "4. Deploy to production:"
    echo "   ${BLUE}git add .${NC}"
    echo "   ${BLUE}git commit -m \"feat: enhanced chat\"${NC}"
    echo "   ${BLUE}git push origin main${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Documentation:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "• CHAT_ENHANCEMENT_COMPLETE.md - Full feature list"
    echo "• QUICK_START_ENHANCED_CHAT.md - Testing guide"
    echo "• Inline code comments - Implementation details"
    echo ""
    
    if [ $WARNINGS -gt 0 ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Warnings:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "You have $WARNINGS warning(s). Review them above."
        echo "The system will work, but some features may be limited."
        echo ""
    fi
    
    echo "🚀 Ready to chat with AI! Happy building!"
    echo ""
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ⚠️  INSTALLATION ISSUES ⚠️                     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "There were $ERRORS error(s) during installation."
    echo "Please review the messages above and fix the issues."
    echo ""
    echo "Common solutions:"
    echo "• Run: npm install"
    echo "• Check Node.js version (need 20+)"
    echo "• Verify all files exist"
    echo "• Check .env configuration"
    echo ""
    exit 1
fi
