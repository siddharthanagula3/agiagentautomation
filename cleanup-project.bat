@echo off
echo.
echo ========================================
echo    AGI AGENT AUTOMATION - CLEANUP
echo ========================================
echo.
echo 🧹 Starting cleanup process...
echo.

REM Delete temporary documentation files
echo [1/4] Deleting temporary documentation...
if exist "ALL_IMPORT_ERRORS_FIXED.md" del /F "ALL_IMPORT_ERRORS_FIXED.md" && echo ✅ Deleted: ALL_IMPORT_ERRORS_FIXED.md
if exist "BUILD_COMPLETE_FIX.md" del /F "BUILD_COMPLETE_FIX.md" && echo ✅ Deleted: BUILD_COMPLETE_FIX.md
if exist "BUILD_ERROR_SOLUTION.md" del /F "BUILD_ERROR_SOLUTION.md" && echo ✅ Deleted: BUILD_ERROR_SOLUTION.md
if exist "BUILD_FIX_CHECKLIST.md" del /F "BUILD_FIX_CHECKLIST.md" && echo ✅ Deleted: BUILD_FIX_CHECKLIST.md
if exist "NETLIFY_BUILD_FINAL_FIX.md" del /F "NETLIFY_BUILD_FINAL_FIX.md" && echo ✅ Deleted: NETLIFY_BUILD_FINAL_FIX.md
if exist "NETLIFY_BUILD_FIX.md" del /F "NETLIFY_BUILD_FIX.md" && echo ✅ Deleted: NETLIFY_BUILD_FIX.md
if exist "QUICK_FIX_REFERENCE.md" del /F "QUICK_FIX_REFERENCE.md" && echo ✅ Deleted: QUICK_FIX_REFERENCE.md
if exist "SETTINGS_REAL_DATA_GUIDE.md" del /F "SETTINGS_REAL_DATA_GUIDE.md" && echo ✅ Deleted: SETTINGS_REAL_DATA_GUIDE.md
if exist "SETTINGS_SETUP_CHECKLIST.md" del /F "SETTINGS_SETUP_CHECKLIST.md" && echo ✅ Deleted: SETTINGS_SETUP_CHECKLIST.md
if exist "TEST_AND_CLEAN.md" del /F "TEST_AND_CLEAN.md" && echo ✅ Deleted: TEST_AND_CLEAN.md
if exist "verify-build.bat" del /F "verify-build.bat" && echo ✅ Deleted: verify-build.bat
if exist "verify-build.sh" del /F "verify-build.sh" && echo ✅ Deleted: verify-build.sh
echo.

REM Delete debug components
echo [2/4] Deleting debug components...
if exist "src\components\AuthDebugMonitor.tsx" del /F "src\components\AuthDebugMonitor.tsx" && echo ✅ Deleted: AuthDebugMonitor.tsx
if exist "src\components\DebugPanel.tsx" del /F "src\components\DebugPanel.tsx" && echo ✅ Deleted: DebugPanel.tsx
if exist "src\pages\AuthDebugPage.tsx" del /F "src\pages\AuthDebugPage.tsx" && echo ✅ Deleted: AuthDebugPage.tsx
echo.

REM Optional: Delete demo components (commented out by default)
echo [3/4] Checking demo components...
echo ⚠️  Demo components kept (uncomment script lines to remove)
REM if exist "src\components\DemoModeBanner.tsx" del /F "src\components\DemoModeBanner.tsx"
REM if exist "src\pages\demo" rmdir /S /Q "src\pages\demo"
echo.

REM Clean build artifacts
echo [4/4] Cleaning build artifacts...
if exist "dist" rmdir /S /Q "dist" && echo ✅ Cleaned: dist/
if exist "node_modules\.vite" rmdir /S /Q "node_modules\.vite" && echo ✅ Cleaned: node_modules/.vite/
echo.

echo ========================================
echo    ✅ CLEANUP COMPLETE!
echo ========================================
echo.
echo 📋 Next Steps:
echo    1. Review COMPLETE_CLEANUP_PLAN.md
echo    2. Update App.tsx (remove debug imports)
echo    3. Run: npm run type-check
echo    4. Run: npm run build
echo.
echo 🎯 Files Remaining to Keep:
echo    ✅ README.md
echo    ✅ API_SETUP_GUIDE.md
echo    ✅ SETUP_GUIDE.md
echo    ✅ SUPABASE_SETUP_GUIDE.md
echo    ✅ FINAL_UPDATE.md
echo    ✅ COMPLETE_CLEANUP_PLAN.md (this guide)
echo.
pause
