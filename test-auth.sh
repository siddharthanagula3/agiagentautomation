#!/bin/bash

echo "🔐 Testing Authentication Flow Fix..."
echo "=================================="

# Build and test locally first
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix build errors first."
    exit 1
fi

echo "✅ Build successful!"

# Start preview server
echo "🚀 Starting preview server..."
echo "📋 Testing steps:"
echo "1. Open http://localhost:8080"
echo "2. Go to login page"
echo "3. Enter credentials and click Sign In"
echo "4. Check if it redirects to dashboard (not back to login)"
echo "5. Look for Auth Debug Monitor in top-left corner (dev build)"
echo "6. Check browser console for authentication logs"

echo ""
echo "🎯 What should happen:"
echo "✅ Login → Loading spinner → Dashboard redirect"
echo "❌ Should NOT return to login page"

echo ""
echo "🐛 If issues persist:"
echo "1. Check the Auth Debug Monitor logs"
echo "2. Open browser DevTools → Console"
echo "3. Look for authentication error messages"
echo "4. Verify environment variables are correct"

npm run preview
