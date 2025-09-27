#!/bin/bash

echo "🚀 AGI Agent Automation - Quick Start & Verification"
echo "===================================================="
echo ""

# Check Node version
echo "📦 Checking Node.js version..."
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js version: $node_version"
else
    echo "❌ Node.js is not installed"
    exit 1
fi
echo ""

# Check npm version
echo "📦 Checking npm version..."
npm_version=$(npm -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ npm version: $npm_version"
else
    echo "❌ npm is not installed"
    exit 1
fi
echo ""

# Check if node_modules exists
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependencies not installed"
    echo "📦 Installing dependencies..."
    npm install
fi
echo ""

# Test Supabase configuration
echo "🔍 Testing Supabase configuration..."
node test-supabase-connection.js
echo ""

# Build check
echo "🔨 Checking if build works..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - check for errors"
fi
echo ""

echo "===================================================="
echo "✨ QUICK START INSTRUCTIONS"
echo "===================================================="
echo ""
echo "1. Start Development Server:"
echo "   npm run dev"
echo ""
echo "2. Open Browser:"
echo "   http://localhost:5173"
echo ""
echo "3. Demo Login Credentials:"
echo "   Email: demo@example.com"
echo "   Password: demo123"
echo ""
echo "4. Check Auth Status:"
echo "   Look for debug panel in bottom-right corner"
echo ""
echo "5. Production Setup:"
echo "   - Create Supabase account"
echo "   - Update .env file"
echo "   - Run database migrations"
echo ""
echo "===================================================="
echo "📚 For more help, see:"
echo "   - INFINITE_LOADING_RESOLVED.md"
echo "   - INFINITE_LOADING_FIX.md"
echo "   - README.md"
echo "===================================================="
