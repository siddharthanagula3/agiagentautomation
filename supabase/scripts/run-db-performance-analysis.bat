@echo off
REM ================================================================
REM Database Performance Analysis Runner (Windows)
REM ================================================================
REM This script analyzes database performance and suggests optimizations
REM ================================================================

echo 📊 Starting Database Performance Analysis...

REM Check if Supabase is running
supabase status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase is not running. Please start it first:
    echo    supabase start
    exit /b 1
)

echo ✅ Supabase is running

REM Get the database URL
for /f "tokens=3" %%i in ('supabase status ^| findstr "DB URL"') do set DB_URL=%%i

if "%DB_URL%"=="" (
    echo ❌ Could not get database URL from Supabase status
    exit /b 1
)

echo 📊 Database URL: %DB_URL%

REM Create output directory if it doesn't exist
if not exist "performance-reports" mkdir performance-reports

REM Generate timestamp for report filename
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

REM Run the performance analysis
echo 🔍 Running database performance analysis...
psql "%DB_URL%" -f supabase/scripts/analyze-db-performance.sql -o "performance-reports/db-performance-analysis-%timestamp%.txt"

if %errorlevel% equ 0 (
    echo ✅ Database Performance Analysis completed!
    echo 📄 Report saved to: performance-reports/db-performance-analysis-%timestamp%.txt
    echo.
    echo 📋 Next steps:
    echo    1. Review the performance report
    echo    2. Implement recommended indexes
    echo    3. Optimize slow queries
    echo    4. Run VACUUM and ANALYZE on tables with high dead tuple ratios
    echo    5. Monitor performance improvements
) else (
    echo ❌ Database Performance Analysis failed
    exit /b 1
)

pause
