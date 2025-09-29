@echo off
setlocal enabledelayedexpansion

echo ╔═══════════════════════════════════════════════════════╗
echo ║   AGI Agent Automation - Enhanced Chat Setup         ║
echo ║   Installing dependencies and configuring features    ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 20+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm version: %NPM_VERSION%
echo.

:: Install required dependencies
echo 📦 Installing required dependencies...
echo.

call npm install react-syntax-highlighter
call npm install --save-dev @types/react-syntax-highlighter

call npm install dompurify
call npm install --save-dev @types/dompurify

echo.
echo ✅ Core dependencies installed
echo.

:: Optional dependencies
echo 📦 Optional dependencies...
echo.

set /p MERMAID="Install Mermaid diagram support? (y/n): "
if /i "%MERMAID%"=="y" (
    call npm install mermaid
    call npm install --save-dev @types/mermaid
    echo ✅ Mermaid installed
)

set /p MARKED="Install Marked (enhanced Markdown parser)? (y/n): "
if /i "%MARKED%"=="y" (
    call npm install marked
    call npm install --save-dev @types/marked
    echo ✅ Marked installed
)

set /p CHARTJS="Install Chart.js (data visualization)? (y/n): "
if /i "%CHARTJS%"=="y" (
    call npm install chart.js react-chartjs-2
    echo ✅ Chart.js installed
)

echo.
echo ✅ All dependencies installed successfully!
echo.

:: Check if .env file exists
if not exist .env (
    echo ⚠️  No .env file found. Creating from template...
    if exist .env.example (
        copy .env.example .env >nul
        echo ✅ Created .env from .env.example
    ) else (
        echo ❌ No .env.example file found. Please create .env manually.
    )
) else (
    echo ✅ .env file exists
)

echo.

:: Check environment variables
echo 🔍 Checking environment variables...
echo.

findstr /C:"VITE_OPENAI_API_KEY=sk-" .env >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ OpenAI API key configured
) else (
    echo ⚠️  OpenAI API key not configured ^(add VITE_OPENAI_API_KEY to .env^)
)

findstr /C:"VITE_ANTHROPIC_API_KEY=sk-" .env >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Anthropic API key configured
) else (
    echo ⚠️  Anthropic API key not configured ^(add VITE_ANTHROPIC_API_KEY to .env^)
)

findstr /C:"VITE_GOOGLE_API_KEY=AIza" .env >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Google API key configured
) else (
    echo ⚠️  Google API key not configured ^(add VITE_GOOGLE_API_KEY to .env^)
)

findstr /C:"VITE_PERPLEXITY_API_KEY=pplx-" .env >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Perplexity API key configured
) else (
    echo ⚠️  Perplexity API key not configured ^(add VITE_PERPLEXITY_API_KEY to .env^)
)

echo.

:: Run type check
echo 🔍 Running TypeScript type check...
echo.

call npm run type-check
if %errorlevel% equ 0 (
    echo.
    echo ✅ No TypeScript errors
) else (
    echo.
    echo ⚠️  TypeScript errors found. Please fix before deploying.
)

echo.

:: Build the project
echo 🏗️  Building project...
echo.

call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Build failed. Please check the errors above.
    pause
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.

echo ╔═══════════════════════════════════════════════════════╗
echo ║              🎉 Setup Complete! 🎉                    ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo Next steps:
echo.
echo 1. Configure API keys in .env file:
echo    - VITE_OPENAI_API_KEY
echo    - VITE_ANTHROPIC_API_KEY
echo    - VITE_GOOGLE_API_KEY
echo    - VITE_PERPLEXITY_API_KEY
echo.
echo 2. Start development server:
echo    npm run dev
echo.
echo 3. Open your browser:
echo    http://localhost:5173/chat
echo.
echo 4. Test enhanced features:
echo    - Streaming responses
echo    - Tool execution
echo    - Artifact creation
echo    - Web search
echo.
echo 📚 Documentation:
echo    - CHAT_ENHANCEMENT_COMPLETE.md
echo    - QUICK_START_ENHANCED_CHAT.md
echo.
echo Happy coding! 🚀
echo.
pause
