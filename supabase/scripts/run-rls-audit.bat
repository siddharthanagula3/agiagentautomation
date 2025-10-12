@echo off
REM ================================================================
REM RLS Policy Audit Runner (Windows)
REM ================================================================
REM This script runs the RLS policy audit to test security
REM ================================================================

echo 🔒 Starting RLS Policy Audit...

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

REM Run the RLS audit script
echo 🔍 Running RLS policy tests...
psql "%DB_URL%" -f supabase/scripts/audit-rls-policies.sql

echo ✅ RLS Policy Audit completed!
echo.
echo 📋 Next steps:
echo    1. Review the audit results above
echo    2. Fix any failed tests
echo    3. Re-run the audit to verify fixes
echo    4. Consider adding more comprehensive tests for edge cases

pause
