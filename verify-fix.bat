@echo off
echo 🔍 AGI Agent Automation - Production Fix Verification
echo ==================================================

echo 🔧 Checking if fixes are applied...

REM Check vite.config.ts
findstr /C:"Complex banner" vite.config.ts >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ vite.config.ts still contains complex optimizations
    echo    Fix: Replace vite.config.ts with the simplified version
) else (
    echo ✅ vite.config.ts has been simplified
)

REM Check index.html
findstr /C:"window._a" index.html >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ index.html still contains complex scripts
    echo    Fix: Replace index.html with the clean version
) else (
    echo ✅ index.html has been cleaned
)

echo.
echo 🌍 Checking environment variables...

if exist .env (
    findstr /C:"VITE_SUPABASE_URL" .env >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Environment variables are configured
    ) else (
        echo ❌ Missing required environment variables
    )
) else (
    echo ⚠️ .env file not found - make sure environment variables are set in your hosting provider
)

echo.
echo 📦 Checking dependencies...

if exist node_modules (
    echo ✅ node_modules exists
) else (
    echo ⚠️ node_modules not found - run: npm install
)

echo.
echo 🏗️ Checking build status...

if exist dist (
    if exist dist\index.html (
        echo ✅ Build artifacts exist
        
        REM Check if JS files exist
        dir dist\assets\*.js >nul 2>&1
        if %errorlevel% equ 0 (
            echo ✅ JavaScript bundles created
        ) else (
            echo ❌ No JavaScript bundles found
        )
    ) else (
        echo ❌ dist\index.html not found
    )
) else (
    echo ⚠️ No build artifacts found - run: npm run build
)

echo.
echo 🎯 Next Steps:
echo 1. If any errors above, fix them first
echo 2. Run: npm run build
echo 3. Test: npm run preview
echo 4. Deploy: git push origin main

echo.
echo 🌐 For Netlify deployment:
echo 1. Check build logs in Netlify dashboard
echo 2. Verify environment variables in Site Settings
echo 3. Ensure domain is pointing correctly

echo.
echo 📞 If you need more help:
echo 1. Share the build logs
echo 2. Check browser DevTools console
echo 3. Verify network requests in DevTools

pause
