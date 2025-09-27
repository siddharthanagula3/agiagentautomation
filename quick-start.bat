@echo off
echo =====================================
echo AGI Agent Automation - Quick Start
echo =====================================
echo.

echo Checking Node.js version...
node -v >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('node -v') do echo Node.js version: %%i
) else (
    echo ERROR: Node.js is not installed
    pause
    exit /b 1
)
echo.

echo Checking npm version...
npm -v >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('npm -v') do echo npm version: %%i
) else (
    echo ERROR: npm is not installed
    pause
    exit /b 1
)
echo.

echo Checking dependencies...
if exist "node_modules\" (
    echo Dependencies installed
) else (
    echo Dependencies not installed
    echo Installing dependencies...
    npm install
)
echo.

echo Testing Supabase configuration...
node test-supabase-connection.js
echo.

echo =====================================
echo QUICK START INSTRUCTIONS
echo =====================================
echo.
echo 1. Start Development Server:
echo    npm run dev
echo.
echo 2. Open Browser:
echo    http://localhost:5173
echo.
echo 3. Demo Login Credentials:
echo    Email: demo@example.com
echo    Password: demo123
echo.
echo 4. Check Console:
echo    Press F12 to open browser console
echo    Look for auth status messages
echo.
echo 5. Production Setup:
echo    - Create Supabase account
echo    - Update .env file
echo    - Run database migrations
echo.
echo =====================================
echo Ready to start? Run: npm run dev
echo =====================================
echo.
pause
