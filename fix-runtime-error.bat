@echo off
echo ====================================================
echo Fixing Netlify Runtime Error - Cannot access T before initialization
echo ====================================================
echo.

REM Step 1: Clear all caches
echo Step 1: Clearing build caches...
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite
echo Caches cleared
echo.

REM Step 2: Reinstall dependencies  
echo Step 2: Reinstalling dependencies...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install
echo Dependencies reinstalled
echo.

REM Step 3: Build the application
echo Step 3: Building application...
npm run build

if %errorlevel% equ 0 (
    echo.
    echo Build successful!
    echo.
    echo Step 4: Test locally
    echo Run: npm run preview
    echo Then visit: http://localhost:8080
    echo.
    echo If the error persists locally, try:
    echo 1. Check browser console for the exact error location
    echo 2. Clear browser cache and localStorage
    echo 3. Try in incognito/private browsing mode
    echo.
    echo Step 5: Deploy to Netlify
    echo If local testing works:
    echo git add .
    echo git commit -m "Fix: Runtime initialization error in vendor bundle"
    echo git push origin main
) else (
    echo.
    echo Build failed!
    echo Check the error messages above
)

pause
