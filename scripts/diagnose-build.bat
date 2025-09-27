@echo off
echo 🔍 AGI Agent Automation - Build Diagnostics
echo ==========================================
echo.

REM Check Node version
echo 📦 Node Version:
node -v
echo.

REM Check npm version
echo 📦 NPM Version:
npm -v
echo.

REM Check if .env file exists
echo 🔑 Environment Variables Check:
if exist ".env" (
    echo ✅ .env file exists
    findstr /B "VITE_" .env
) else (
    echo ❌ .env file not found
)
echo.

REM Check if node_modules exists
echo 📚 Dependencies Check:
if exist "node_modules" (
    echo ✅ node_modules directory exists
) else (
    echo ❌ node_modules not found - run 'npm install'
)
echo.

REM Check critical files
echo 📄 Critical Files Check:
for %%f in (
    "src\App.tsx"
    "src\main.tsx"
    "src\pages\LandingPage.tsx"
    "src\integrations\supabase\client.ts"
    "src\services\complete-mcp-service.ts"
    "vite.config.ts"
    "netlify.toml"
) do (
    if exist %%f (
        echo ✅ %%f
    ) else (
        echo ❌ %%f - MISSING!
    )
)
echo.

REM Try to build
echo 🏗️  Attempting Build:
echo Running: npm run build
echo.
npm run build

if %errorlevel% equ 0 (
    echo.
    echo ✅ Build succeeded!
    echo.
    echo 📦 Build output:
    dir dist /b
) else (
    echo.
    echo ❌ Build failed!
    echo.
    echo 💡 Troubleshooting tips:
    echo 1. Check that all environment variables are set
    echo 2. Try: rmdir /s /q node_modules ^&^& del package-lock.json ^&^& npm install
    echo 3. Check for TypeScript errors: npm run lint
    echo 4. Review BUILD_FIXES.md for known issues
)

pause
