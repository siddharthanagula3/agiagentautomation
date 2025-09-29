#!/bin/bash

echo "🔧 Fixing production build issues..."

# Clear all caches and build artifacts
echo "🧹 Clearing caches..."
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite

# Clean node_modules to ensure fresh dependencies
echo "📦 Reinstalling dependencies..."
rm -rf node_modules
rm -f package-lock.json
npm install

# Clear Vite cache
echo "🔄 Clearing Vite cache..."
npx vite --clearCache

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build complete! Check the dist folder."
echo "📋 Next steps:"
echo "1. Test the build locally: npm run preview"
echo "2. Deploy to your hosting provider"
echo "3. Check the Network tab in DevTools for any 404s"
