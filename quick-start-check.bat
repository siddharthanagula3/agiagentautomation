@echo off
REM Quick Start Check Script - Windows Version
REM Verifies setup and provides next steps

echo.
echo ============================================
echo   AGI Agent Automation - Setup Verification
echo ============================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js installed: %NODE_VERSION%
) else (
    echo [ERROR] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Check npm
echo.
echo Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm installed: %NPM_VERSION%
) else (
    echo [ERROR] npm not found. Please install npm first.
    pause
    exit /b 1
)

REM Check directory structure
echo.
echo Checking directory structure...
if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json not found. Are you in the project root?
    pause
    exit /b 1
)

if exist "src\" (
    echo [OK] src directory found
) else (
    echo [ERROR] src directory not found.
    pause
    exit /b 1
)

REM Check environment file
echo.
echo Checking environment configuration...
if exist ".env" (
    echo [OK] .env file found
    
    REM Check for required variables
    findstr /C:"VITE_SUPABASE_URL" .env >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] VITE_SUPABASE_URL configured
    ) else (
        echo [WARNING] VITE_SUPABASE_URL not found in .env
    )
    
    findstr /C:"VITE_SUPABASE_ANON_KEY" .env >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] VITE_SUPABASE_ANON_KEY configured
    ) else (
        echo [WARNING] VITE_SUPABASE_ANON_KEY not found in .env
    )
) else (
    echo [WARNING] .env file not found. Please create one from .env.example
)

REM Check dependencies
echo.
echo Checking dependencies...
if exist "node_modules\" (
    echo [OK] node_modules directory found
) else (
    echo [WARNING] node_modules not found. Run: npm install
)

REM Check key service files
echo.
echo Checking service files...
if exist "src\services\cache-service.ts" (
    echo [OK] src\services\cache-service.ts exists
) else (
    echo [ERROR] src\services\cache-service.ts not found
)

if exist "src\services\analytics-service.ts" (
    echo [OK] src\services\analytics-service.ts exists
) else (
    echo [ERROR] src\services\analytics-service.ts not found
)

if exist "src\services\automation-service.ts" (
    echo [OK] src\services\automation-service.ts exists
) else (
    echo [ERROR] src\services\automation-service.ts not found
)

if exist "src\tools\filesystem-tools.ts" (
    echo [OK] src\tools\filesystem-tools.ts exists
) else (
    echo [ERROR] src\tools\filesystem-tools.ts not found
)

REM Check updated pages
echo.
echo Checking updated pages...
if exist "src\pages\dashboard\Dashboard.tsx" (
    echo [OK] src\pages\dashboard\Dashboard.tsx exists
) else (
    echo [ERROR] src\pages\dashboard\Dashboard.tsx not found
)

if exist "src\pages\analytics\AnalyticsPage.tsx" (
    echo [OK] src\pages\analytics\AnalyticsPage.tsx exists
) else (
    echo [ERROR] src\pages\analytics\AnalyticsPage.tsx not found
)

if exist "src\pages\automation\AutomationPage.tsx" (
    echo [OK] src\pages\automation\AutomationPage.tsx exists
) else (
    echo [ERROR] src\pages\automation\AutomationPage.tsx not found
)

REM Check scanner script
echo.
echo Checking mock data scanner...
if exist "find-mock-data.js" (
    echo [OK] find-mock-data.js exists
) else (
    echo [ERROR] find-mock-data.js not found
)

REM Summary
echo.
echo ============================================
echo    Next Steps:
echo ============================================
echo.
echo 1. Run mock data scanner:
echo    node find-mock-data.js
echo.
echo 2. Install dependencies (if needed):
echo    npm install
echo.
echo 3. Start development server:
echo    npm run dev
echo.
echo 4. Verify database migrations in Supabase SQL Editor
echo.
echo 5. Read CLEANUP-GUIDE.md for detailed instructions
echo.
echo ============================================
echo [OK] Setup verification complete!
echo ============================================
echo.
pause
