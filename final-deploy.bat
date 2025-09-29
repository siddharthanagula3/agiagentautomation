@echo off
echo 🚀 Final Production Build and Deploy
echo =====================================

echo 📝 Changes Made:
echo ✅ Fixed "User is not defined" error in DashboardHeader
echo ✅ Replaced mock data with fresh user empty states
echo ✅ Dashboard shows 0 values for new users
echo ✅ Removed complex mock data generators
echo ✅ Simplified DashboardHomePage from 1500+ lines to 350 lines

echo.
echo 🧹 Cleaning build artifacts...
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite

echo.
echo 📦 Building for production...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed! Check errors above.
    pause
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.
echo 📊 Build Analysis:
for /f %%A in ('powershell -command "& {(Get-ChildItem -Path dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB}"') do set SIZE=%%A
echo Total Size: ~%SIZE% MB

echo.
echo 🧪 Testing build locally...
echo Starting preview server...
echo.
echo 📋 Test Checklist:
echo ✅ Open http://localhost:8080
echo ✅ Login with your credentials
echo ✅ Verify dashboard loads without errors
echo ✅ Check that stats show 0 values
echo ✅ Verify no "User is not defined" error
echo ✅ Test navigation to other pages

echo.
npm run preview

pause
