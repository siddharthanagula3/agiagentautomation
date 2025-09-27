@echo off
echo 🚀 Starting Simple Deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm ci

REM Run linting
echo 🔍 Running linting...
npm run lint

REM Build the application
echo 🏗️  Building application...
npm run build

REM Check if build was successful
if not exist "dist" (
    echo ❌ Build failed - dist directory not found
    exit /b 1
)

echo ✅ Build completed successfully!
echo 📁 Build artifacts are in the 'dist' directory
echo 🌐 Ready for deployment to Netlify, Vercel, or any static hosting service
