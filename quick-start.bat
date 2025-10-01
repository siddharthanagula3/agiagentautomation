@echo off
echo.
echo ========================================
echo   AGI AGENT AUTOMATION - QUICK START
echo ========================================
echo.

REM Run pre-flight check
echo [1/3] Running pre-flight check...
echo.
node preflight-check.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Pre-flight check failed!
    echo.
    echo Please fix the issues above before continuing.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ PRE-FLIGHT CHECK PASSED
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [2/3] Installing dependencies...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Dependencies already installed ✅
)

echo.
echo ========================================
echo   🗄️  DATABASE SETUP REQUIRED
echo ========================================
echo.
echo Before starting the server, you need to:
echo.
echo 1. Open DATABASE_SETUP_COMPLETE.md
echo 2. Follow the SQL migration steps
echo 3. Run all 5 migrations in Supabase
echo.
echo Press any key when database setup is complete...
pause >nul

echo.
echo [3/3] Starting development server...
echo.
echo 🚀 Server will start at: http://localhost:5173
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev
