#!/bin/bash

echo "🔧 Fixing Netlify Runtime Error - 'Cannot access T before initialization'"
echo "================================================================"
echo ""

# Step 1: Clear all caches
echo "📦 Step 1: Clearing build caches..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf .parcel-cache
echo "✅ Caches cleared"
echo ""

# Step 2: Reinstall dependencies
echo "📦 Step 2: Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install
echo "✅ Dependencies reinstalled"
echo ""

# Step 3: Build the application
echo "🏗️  Step 3: Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    
    # Step 4: Test locally
    echo "🧪 Step 4: Testing locally..."
    echo "Run: npm run preview"
    echo "Then visit: http://localhost:8080"
    echo ""
    echo "If the error persists locally, try:"
    echo "1. Check browser console for the exact error location"
    echo "2. Clear browser cache and localStorage"
    echo "3. Try in incognito/private browsing mode"
    echo ""
    echo "📤 Step 5: Deploy to Netlify"
    echo "If local testing works:"
    echo "git add ."
    echo "git commit -m 'Fix: Runtime initialization error in vendor bundle'"
    echo "git push origin main"
else
    echo "❌ Build failed!"
    echo "Check the error messages above"
fi
