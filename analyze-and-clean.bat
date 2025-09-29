@echo off
echo 🔍 Analyzing Unnecessary Files
echo ================================

echo.
echo 📊 File Analysis Report
echo.

set TOTAL_SIZE=0

echo Test Files:
if exist test-website-comprehensive.cjs (
    echo   - test-website-comprehensive.cjs [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist test-website-comprehensive.js (
    echo   - test-website-comprehensive.js [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist website-test-report-2025-09-28.json (
    echo   - website-test-report-2025-09-28.json [FOUND]
    set /a TOTAL_SIZE+=1
)

echo.
echo Documentation Files:
if exist CLAUDE.md (
    echo   - CLAUDE.md [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist gemini.md (
    echo   - gemini.md [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist README-Phase4.md (
    echo   - README-Phase4.md [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist QUICKSTART.js (
    echo   - QUICKSTART.js [FOUND]
    set /a TOTAL_SIZE+=1
)

echo.
echo Build Artifacts:
if exist bun.lockb (
    echo   - bun.lockb [FOUND]
    set /a TOTAL_SIZE+=1
)

echo.
echo Unused Components:
if exist src\components\ChatGPTHeader.tsx (
    echo   - src\components\ChatGPTHeader.tsx [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist src\components\ChatGPTInput.tsx (
    echo   - src\components\ChatGPTInput.tsx [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist src\components\ChatGPTMessage.tsx (
    echo   - src\components\ChatGPTMessage.tsx [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist src\components\ChatGPTSidebar.tsx (
    echo   - src\components\ChatGPTSidebar.tsx [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist src\components\CompleteAdminDashboard.tsx (
    echo   - src\components\CompleteAdminDashboard.tsx [FOUND]
    set /a TOTAL_SIZE+=1
)
if exist src\components\CompleteAIEmployeeChat.tsx (
    echo   - src\components\CompleteAIEmployeeChat.tsx [FOUND]
    set /a TOTAL_SIZE+=1
)

echo.
echo 📈 Summary:
echo Total unnecessary files found: %TOTAL_SIZE%
echo.

choice /C YN /M "Do you want to remove these files"
if errorlevel 2 goto :cancel
if errorlevel 1 goto :remove

:remove
echo.
echo 🗑️ Removing files...

REM Test files
if exist test-website-comprehensive.cjs del test-website-comprehensive.cjs && echo ✅ Deleted test-website-comprehensive.cjs
if exist test-website-comprehensive.js del test-website-comprehensive.js && echo ✅ Deleted test-website-comprehensive.js
if exist website-test-report-2025-09-28.json del website-test-report-2025-09-28.json && echo ✅ Deleted website-test-report-2025-09-28.json

REM Documentation (optional - keeping for reference)
echo.
echo ℹ️ Keeping documentation files for reference (you can delete manually later)

REM Build artifacts
if exist bun.lockb del bun.lockb && echo ✅ Deleted bun.lockb

REM Components (being cautious - only deleting obvious duplicates)
if exist src\components\ChatGPTHeader.tsx del src\components\ChatGPTHeader.tsx && echo ✅ Deleted ChatGPTHeader.tsx
if exist src\components\ChatGPTInput.tsx del src\components\ChatGPTInput.tsx && echo ✅ Deleted ChatGPTInput.tsx
if exist src\components\ChatGPTMessage.tsx del src\components\ChatGPTMessage.tsx && echo ✅ Deleted ChatGPTMessage.tsx
if exist src\components\ChatGPTSidebar.tsx del src\components\ChatGPTSidebar.tsx && echo ✅ Deleted ChatGPTSidebar.tsx

echo.
echo ✅ Cleanup complete!
echo.
echo 📝 Note: Documentation files kept for reference
echo    You can manually delete: CLAUDE.md, gemini.md, README-Phase4.md
echo.
goto :end

:cancel
echo.
echo ❌ Cleanup cancelled. No files were deleted.
goto :end

:end
pause
