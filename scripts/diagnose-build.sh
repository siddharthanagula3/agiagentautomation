#!/bin/bash

echo "🔍 AGI Agent Automation - Build Diagnostics"
echo "=========================================="
echo ""

# Check Node version
echo "📦 Node Version:"
node -v
echo ""

# Check npm version
echo "📦 NPM Version:"
npm -v
echo ""

# Check if .env file exists
echo "🔑 Environment Variables Check:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "   Variables found:"
    grep "^VITE_" .env | sed 's/=.*/=***/' || echo "   No VITE_ variables found"
else
    echo "❌ .env file not found"
fi
echo ""

# Check if node_modules exists
echo "📚 Dependencies Check:"
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "❌ node_modules not found - run 'npm install'"
fi
echo ""

# Check critical files
echo "📄 Critical Files Check:"
files=(
    "src/App.tsx"
    "src/main.tsx"
    "src/pages/LandingPage.tsx"
    "src/integrations/supabase/client.ts"
    "src/services/complete-mcp-service.ts"
    "vite.config.ts"
    "netlify.toml"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING!"
    fi
done
echo ""

# Try to build
echo "🏗️  Attempting Build:"
echo "Running: npm run build"
echo ""
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build succeeded!"
    echo ""
    echo "📦 Build output:"
    ls -lh dist/ | head -10
else
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "💡 Troubleshooting tips:"
    echo "1. Check that all environment variables are set"
    echo "2. Try: rm -rf node_modules package-lock.json && npm install"
    echo "3. Check for TypeScript errors: npm run lint"
    echo "4. Review BUILD_FIXES.md for known issues"
fi
