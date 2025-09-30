@echo off
setlocal enabledelayedexpansion

:: Quick Start Verification Script (Windows)
:: Checks if everything is set up correctly

echo.
echo ========================================
echo AI Agent Automation - Quick Start Check
echo ========================================
echo.

:: Check Node.js
echo Checking Node.js...
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo [32m✓[0m Node.js installed: !NODE_VERSION!
) else (
    echo [31m✗[0m Node.js not found. Please install Node.js 18+
    exit /b 1
)

:: Check npm
echo Checking npm...
where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo [32m✓[0m npm installed: !NPM_VERSION!
) else (
    echo [31m✗[0m npm not found
    exit /b 1
)

:: Check node_modules
echo Checking dependencies...
if exist "node_modules\" (
    echo [32m✓[0m node_modules found
) else (
    echo [33m⚠[0m node_modules not found. Running npm install...
    call npm install
)

:: Check .env file
echo Checking environment variables...
if exist ".env" (
    echo [32m✓[0m .env file found
    
    :: Check for required keys
    findstr /C:"VITE_SUPABASE_URL" .env >nul
    if %errorlevel% equ 0 (
        echo [32m✓[0m VITE_SUPABASE_URL configured
    ) else (
        echo [31m✗[0m VITE_SUPABASE_URL not found in .env
    )
    
    findstr /C:"VITE_SUPABASE_ANON_KEY" .env >nul
    if %errorlevel% equ 0 (
        echo [32m✓[0m VITE_SUPABASE_ANON_KEY configured
    ) else (
        echo [31m✗[0m VITE_SUPABASE_ANON_KEY not found in .env
    )
    
    :: Check for AI providers
    set AI_FOUND=0
    findstr /C:"VITE_ANTHROPIC_API_KEY=sk-" .env >nul
    if %errorlevel% equ 0 (
        echo [32m✓[0m Anthropic API key configured
        set AI_FOUND=1
    )
    findstr /C:"VITE_GOOGLE_API_KEY=AIza" .env >nul
    if %errorlevel% equ 0 (
        echo [32m✓[0m Google API key configured
        set AI_FOUND=1
    )
    findstr /C:"VITE_OPENAI_API_KEY=sk-" .env >nul
    if %errorlevel% equ 0 (
        echo [32m✓[0m OpenAI API key configured
        set AI_FOUND=1
    )
    
    if !AI_FOUND! equ 0 (
        echo [33m⚠[0m No AI provider API keys configured
    )
) else (
    echo [31m✗[0m .env file not found
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [32m✓[0m Created .env file. Please add your API keys.
    ) else (
        echo [31m✗[0m .env.example not found
    )
)

:: Check implementation files
echo.
echo Checking implementation files...

set FILES=supabase\migrations\005_analytics_tables.sql supabase\migrations\006_automation_tables.sql src\services\cache-service.ts src\services\analytics-service.ts src\services\automation-service.ts src\tools\filesystem-tools.ts find-mock-data.js IMPLEMENTATION_COMPLETE.md

set ALL_FOUND=1
for %%F in (%FILES%) do (
    if exist "%%F" (
        echo [32m✓[0m %%F
    ) else (
        echo [31m✗[0m %%F missing
        set ALL_FOUND=0
    )
)

:: Check required packages
echo.
echo Checking required packages...

call npm list @tanstack/react-query >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓[0m @tanstack/react-query installed
) else (
    echo [33m⚠[0m Installing @tanstack/react-query...
    call npm install @tanstack/react-query
)

call npm list zustand >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓[0m zustand installed
) else (
    echo [33m⚠[0m Installing zustand...
    call npm install zustand
)

call npm list framer-motion >nul 2>&1
if %errorlevel% equ 0 (
    echo [32m✓[0m framer-motion installed
) else (
    echo [33m⚠[0m Installing framer-motion...
    call npm install framer-motion
)

:: Summary
echo.
echo ========================================
echo Summary:
echo.

if !ALL_FOUND! equ 1 (
    echo [32m✓[0m All implementation files present
) else (
    echo [31m✗[0m Some implementation files missing
)

echo.
echo Next Steps:
echo.
echo 1. [33mRun database migrations[0m in Supabase SQL Editor
echo    - 005_analytics_tables.sql
echo    - 006_automation_tables.sql
echo.
echo 2. [33mFind and fix mock data[0m
echo    - Run: node find-mock-data.js
echo.
echo 3. [33mStart development server[0m
echo    - Run: npm run dev
echo.
echo 4. [33mVerify everything works[0m
echo    - Visit: http://localhost:5173/dashboard
echo.
echo 📚 For detailed instructions, see:
echo    - IMPLEMENTATION_COMPLETE.md
echo    - Check the artifacts in Claude
echo.
echo ========================================
echo.

pause
