@echo off
echo ========================================
echo   NETLIFY BUILD VERIFICATION SCRIPT
echo ========================================
echo.

REM Check Node version
echo [1/7] Checking Node version...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found! Please install Node.js 20+
    pause
    exit /b 1
)
echo ✅ Node.js installed
echo.

REM Check npm version
echo [2/7] Checking npm version...
npm --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found!
    pause
    exit /b 1
)
echo ✅ npm installed
echo.

REM Clean previous builds
echo [3/7] Cleaning previous builds...
if exist "dist" rmdir /s /q "dist"
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
echo ✅ Cleaned build artifacts
echo.

REM Install dependencies (matching Netlify's npm ci)
echo [4/7] Installing dependencies (like Netlify does)...
echo This may take a few minutes...
call npm ci
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Dependency installation failed!
    echo Try running: npm install
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Type checking
echo [5/7] Running TypeScript type check...
call npm run type-check
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  TypeScript errors found! Fix these before deploying.
    echo.
    pause
) else (
    echo ✅ No TypeScript errors
    echo.
)

REM Run production build
echo [6/7] Running production build (like Netlify does)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌❌❌ BUILD FAILED ❌❌❌
    echo.
    echo The build failed just like on Netlify.
    echo Check the error messages above.
    echo.
    echo Common issues:
    echo - Missing environment variables
    echo - TypeScript compilation errors
    echo - Import errors or circular dependencies
    echo - Missing dependencies in package.json
    echo.
    pause
    exit /b 1
)
echo ✅ Build succeeded!
echo.

REM Check dist folder
echo [7/7] Verifying build output...
if not exist "dist\index.html" (
    echo ❌ dist/index.html not found!
    pause
    exit /b 1
)
if not exist "dist\assets" (
    echo ❌ dist/assets folder not found!
    pause
    exit /b 1
)
echo ✅ Build output looks good
echo.

echo ========================================
echo   ✅ ALL CHECKS PASSED! ✅
echo ========================================
echo.
echo Your build is ready for Netlify!
echo.
echo Next steps:
echo 1. git add .
echo 2. git commit -m "fix: build configuration for production"
echo 3. git push origin main
echo.
echo Netlify will automatically detect and deploy your changes.
echo.
pause
