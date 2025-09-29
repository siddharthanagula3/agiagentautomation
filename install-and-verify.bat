@echo off
setlocal enabledelayedexpansion

:: Complete Installation and Verification Script for Windows
echo ╔════════════════════════════════════════════════════════════╗
echo ║  AGI Agent Automation - Complete Setup ^& Verification     ║
echo ║  This will install, build, and verify everything          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set SUCCESS=0
set WARNINGS=0
set ERRORS=0

:: Step 1: Check prerequisites
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 1: Checking Prerequisites
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo ✅ Node.js installed: !NODE_VERSION!
    set /a SUCCESS+=1
) else (
    echo ❌ Node.js not found
    echo Please install Node.js 20+ from https://nodejs.org
    set /a ERRORS+=1
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo ✅ npm installed: !NPM_VERSION!
    set /a SUCCESS+=1
) else (
    echo ❌ npm not found
    set /a ERRORS+=1
    pause
    exit /b 1
)

echo.

:: Step 2: Install dependencies
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 2: Installing Dependencies
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo ℹ️  Running npm clean install...
call npm ci
if %errorlevel% equ 0 (
    echo ✅ Core dependencies installed
    set /a SUCCESS+=1
) else (
    echo ⚠️  npm ci failed, trying npm install...
    call npm install
    if %errorlevel% equ 0 (
        echo ✅ Dependencies installed with npm install
        set /a SUCCESS+=1
    ) else (
        echo ❌ Failed to install dependencies
        set /a ERRORS+=1
        pause
        exit /b 1
    )
)

echo ℹ️  Installing enhanced chat dependencies...
call npm install react-syntax-highlighter @types/react-syntax-highlighter dompurify @types/dompurify
if %errorlevel% equ 0 (
    echo ✅ Enhanced chat dependencies installed
    set /a SUCCESS+=1
) else (
    echo ❌ Failed to install enhanced chat dependencies
    set /a ERRORS+=1
)

echo.

:: Step 3: Check environment variables
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 3: Checking Environment Variables
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

if not exist .env (
    echo ⚠️  .env file not found
    set /a WARNINGS+=1
    if exist .env.example (
        copy .env.example .env >nul
        echo ℹ️  Created .env from .env.example
    )
) else (
    echo ✅ .env file exists
    set /a SUCCESS+=1
)

findstr /C:"VITE_OPENAI_API_KEY=" .env >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ OpenAI API configured
    set /a SUCCESS+=1
) else (
    echo ⚠️  OpenAI API not configured
    set /a WARNINGS+=1
)

findstr /C:"VITE_ANTHROPIC_API_KEY=" .env >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Anthropic API configured
    set /a SUCCESS+=1
) else (
    echo ⚠️  Anthropic API not configured
    set /a WARNINGS+=1
)

findstr /C:"VITE_GOOGLE_API_KEY=" .env >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Google API configured
    set /a SUCCESS+=1
) else (
    echo ⚠️  Google API not configured
    set /a WARNINGS+=1
)

findstr /C:"VITE_PERPLEXITY_API_KEY=" .env >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Perplexity API configured
    set /a SUCCESS+=1
) else (
    echo ⚠️  Perplexity API not configured
    set /a WARNINGS+=1
)

echo.

:: Step 4: Type checking
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 4: TypeScript Type Checking
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

call npm run type-check
if %errorlevel% equ 0 (
    echo ✅ No TypeScript errors
    set /a SUCCESS+=1
) else (
    echo ⚠️  TypeScript errors found ^(may not block build^)
    set /a WARNINGS+=1
)

echo.

:: Step 5: Build
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 5: Building Project
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo ℹ️  Running production build...
call npm run build
if %errorlevel% equ 0 (
    echo ✅ Build successful
    set /a SUCCESS+=1
) else (
    echo ❌ Build failed
    echo.
    echo Check the error messages above and fix issues before deploying.
    set /a ERRORS+=1
    pause
    exit /b 1
)

if exist "dist\index.html" (
    echo ✅ dist/index.html created
    set /a SUCCESS+=1
) else (
    echo ❌ dist/index.html not found
    set /a ERRORS+=1
)

if exist "dist\assets" (
    echo ✅ dist/assets directory created
    set /a SUCCESS+=1
) else (
    echo ❌ dist/assets not found
    set /a ERRORS+=1
)

echo.

:: Step 6: Verify files
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 6: Verifying Enhanced Chat Files
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

if exist "src\services\streaming-service.ts" (
    echo ✅ Streaming Service
    set /a SUCCESS+=1
) else (
    echo ❌ Streaming Service not found
    set /a ERRORS+=1
)

if exist "src\services\tool-executor-service.ts" (
    echo ✅ Tool Executor Service
    set /a SUCCESS+=1
) else (
    echo ❌ Tool Executor Service not found
    set /a ERRORS+=1
)

if exist "src\services\artifact-service.ts" (
    echo ✅ Artifact Service
    set /a SUCCESS+=1
) else (
    echo ❌ Artifact Service not found
    set /a ERRORS+=1
)

if exist "src\services\web-search-service.ts" (
    echo ✅ Web Search Service
    set /a SUCCESS+=1
) else (
    echo ❌ Web Search Service not found
    set /a ERRORS+=1
)

if exist "src\components\chat\ArtifactRenderer.tsx" (
    echo ✅ Artifact Renderer
    set /a SUCCESS+=1
) else (
    echo ❌ Artifact Renderer not found
    set /a ERRORS+=1
)

if exist "src\components\chat\ToolExecutionPanel.tsx" (
    echo ✅ Tool Execution Panel
    set /a SUCCESS+=1
) else (
    echo ❌ Tool Execution Panel not found
    set /a ERRORS+=1
)

if exist "src\pages\chat\ChatPageEnhanced.tsx" (
    echo ✅ Enhanced Chat Page
    set /a SUCCESS+=1
) else (
    echo ❌ Enhanced Chat Page not found
    set /a ERRORS+=1
)

echo.

:: Step 7: Summary
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Step 7: Installation Summary
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo ✅ Successful: %SUCCESS%
echo ⚠️  Warnings: %WARNINGS%
echo ❌ Errors: %ERRORS%
echo.

if %ERRORS% equ 0 (
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║           🎉 INSTALLATION COMPLETE! 🎉                     ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo Your enhanced chat interface is ready!
    echo.
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo Next Steps:
    echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    echo.
    echo 1. Start development server:
    echo    npm run dev
    echo.
    echo 2. Open in browser:
    echo    http://localhost:5173/chat
    echo.
    echo 3. Test features:
    echo    • Send a message ^(watch streaming^)
    echo    • Enable Tools ^(⋮ button^)
    echo    • Try web search
    echo    • Create artifacts
    echo    • Upload images
    echo.
    echo 4. Deploy to production:
    echo    git add .
    echo    git commit -m "feat: enhanced chat"
    echo    git push origin main
    echo.
    echo 🚀 Ready to chat with AI! Happy building!
    echo.
) else (
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║              ⚠️  INSTALLATION ISSUES ⚠️                     ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo There were %ERRORS% error^(s^) during installation.
    echo Please review the messages above and fix the issues.
    echo.
)

pause
