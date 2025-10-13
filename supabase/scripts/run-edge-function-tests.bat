@echo off
REM ================================================================
REM Supabase Edge Functions Test Runner (Windows)
REM ================================================================
REM This script runs the edge functions test suite
REM ================================================================

echo 🧪 Starting Supabase Edge Functions Test Suite...

REM Check if Supabase is running
supabase status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase is not running. Please start it first:
    echo    supabase start
    exit /b 1
)

echo ✅ Supabase is running

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo ✅ Node.js is available

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        exit /b 1
    )
)

REM Start Supabase functions if not already running
echo 🚀 Starting Supabase functions...
start /B supabase functions serve

REM Wait a moment for functions to start
timeout /t 3 /nobreak >nul

REM Run the tests
echo 🔍 Running edge function tests...
node test-edge-functions.js

echo ✅ Edge Functions Test Suite completed!

pause
