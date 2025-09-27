@echo off
echo =========================================================
echo FIXING: Cannot access 'g' before initialization error
echo =========================================================
echo.

echo [1/5] Clearing all caches and build artifacts...
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist .parcel-cache rmdir /s /q .parcel-cache
echo Caches cleared!
echo.

echo [2/5] Removing node_modules and package-lock...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
echo Cleaned!
echo.

echo [3/5] Installing dependencies with terser...
npm install
npm install --save-dev terser
echo Dependencies installed!
echo.

echo [4/5] Building with new configuration...
npm run build:clean

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo [5/5] Next steps:
    echo.
    echo 1. Test locally:
    echo    npm run preview
    echo    Open: http://localhost:8080
    echo.
    echo 2. If working locally, deploy to Netlify:
    echo    git add .
    echo    git commit -m "Fix: Variable initialization error with improved build config"
    echo    git push origin main
    echo.
    echo 3. Clear Netlify cache:
    echo    Go to Netlify Dashboard
    echo    Deploys - Trigger Deploy - Clear cache and deploy
    echo.
) else (
    echo.
    echo ========================================
    echo BUILD FAILED - Trying alternative fix...
    echo ========================================
    echo.
    echo Attempting build without optimization...
    npm run build:dev
    
    if %errorlevel% equ 0 (
        echo.
        echo Development build successful!
        echo This is a temporary fix - please contact support.
    ) else (
        echo.
        echo Both builds failed. Please check:
        echo 1. All TypeScript files compile: npx tsc --noEmit
        echo 2. No circular dependencies: npx madge --circular src
    )
)

pause
