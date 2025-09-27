#!/bin/bash
# Fix Netlify Build Issues
echo "🔧 Starting Netlify build fix process..."

# Clear everything
echo "🧹 Cleaning project..."
rm -rf node_modules dist package-lock.json .parcel-cache

# Fresh install
echo "📦 Installing dependencies..."
npm install

# Test TypeScript
echo "🔍 Checking TypeScript compilation..."
npx tsc --noEmit

# Try build
echo "🏗️ Running build..."
npm run build

# Check result
if [ $? -eq 0 ]; then
  echo "✅ Build successful! Ready to deploy."
  echo "🚀 You can now commit and push to trigger Netlify deployment."
else
  echo "❌ Build failed. Check the error above."
  echo "💡 Common fixes:"
  echo "   - Check environment variables in Netlify dashboard"
  echo "   - Verify all imports are correct"
  echo "   - Check for TypeScript errors"
fi
