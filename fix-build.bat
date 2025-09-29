@echo off
echo 🔧 Fixing production build issues...

REM Clear all caches and build artifacts
echo 🧹 Clearing caches...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist dist rmdir /s /q dist
if exist .vite rmdir /s /q .vite

REM Clean node_modules to ensure fresh dependencies
echo 📦 Reinstalling dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install

REM Build the application
echo 🏗️ Building application...
npm run build

echo ✅ Build complete! Check the dist folder.
echo 📋 Next steps:
echo 1. Test the build locally: npm run preview
echo 2. Deploy to your hosting provider
echo 3. Check the Network tab in DevTools for any 404s
pause
