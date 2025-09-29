#!/bin/bash

echo "🔍 AGI Agent Automation - Production Fix Verification"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Check if fixes are applied
echo "🔧 Checking if fixes are applied..."

# Check vite.config.ts
if grep -q "Complex banner" vite.config.ts 2>/dev/null; then
    error "vite.config.ts still contains complex optimizations"
    echo "   Run: Replace vite.config.ts with the simplified version"
else
    success "vite.config.ts has been simplified"
fi

# Check index.html
if grep -q "window._a" index.html 2>/dev/null; then
    error "index.html still contains complex scripts"
    echo "   Run: Replace index.html with the clean version"
else
    success "index.html has been cleaned"
fi

# Check environment variables
echo ""
echo "🌍 Checking environment variables..."

if [ -f .env ]; then
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        success "Environment variables are configured"
    else
        error "Missing required environment variables"
    fi
else
    warning ".env file not found - make sure environment variables are set in your hosting provider"
fi

# Check dependencies
echo ""
echo "📦 Checking dependencies..."

if [ -d "node_modules" ]; then
    success "node_modules exists"
else
    warning "node_modules not found - run: npm install"
fi

# Check if build artifacts exist
echo ""
echo "🏗️ Checking build status..."

if [ -d "dist" ]; then
    if [ -f "dist/index.html" ]; then
        success "Build artifacts exist"
        
        # Check if main JS file exists
        if ls dist/assets/*.js 1> /dev/null 2>&1; then
            success "JavaScript bundles created"
        else
            error "No JavaScript bundles found"
        fi
    else
        error "dist/index.html not found"
    fi
else
    warning "No build artifacts found - run: npm run build"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. If any errors above, fix them first"
echo "2. Run: npm run build"
echo "3. Test: npm run preview"
echo "4. Deploy: git push origin main"

echo ""
echo "🌐 For Netlify deployment:"
echo "1. Check build logs in Netlify dashboard"
echo "2. Verify environment variables in Site Settings"
echo "3. Ensure domain is pointing correctly"

echo ""
echo "📞 If you need more help:"
echo "1. Share the build logs"
echo "2. Check browser DevTools console"
echo "3. Verify network requests in DevTools"
