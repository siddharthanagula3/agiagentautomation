# PowerShell Script to Setup Database
# This script will create the purchased_employees table in Supabase

Write-Host "🚀 AGI Agent Automation - Database Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we have the environment variables
if (-not (Test-Path "netlify.toml")) {
    Write-Host "❌ Error: Run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📋 This script will:" -ForegroundColor Yellow
Write-Host "   1. Create purchased_employees table" -ForegroundColor White
Write-Host "   2. Set up RLS policies" -ForegroundColor White
Write-Host "   3. Create indexes for performance" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANT: You need to run the SQL in Supabase Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 Steps to complete setup:" -ForegroundColor Cyan
Write-Host "   1. Open: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "   2. Select your project" -ForegroundColor White
Write-Host "   3. Go to SQL Editor" -ForegroundColor White
Write-Host "   4. Click 'New Query'" -ForegroundColor White
Write-Host "   5. Copy the SQL below" -ForegroundColor White
Write-Host "   6. Click 'Run' (F5)" -ForegroundColor White
Write-Host ""

Write-Host "=" * 80 -ForegroundColor Green
Write-Host "SQL TO RUN IN SUPABASE DASHBOARD:" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""

$sql = @"
-- ============================================
-- Free AI Employee Hiring System Setup
-- ============================================

DROP TABLE IF EXISTS public.purchased_employees CASCADE;

CREATE TABLE public.purchased_employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    provider text NOT NULL,
    is_active boolean DEFAULT true,
    purchased_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, employee_id)
);

CREATE INDEX idx_purchased_employees_user_id ON public.purchased_employees(user_id);
CREATE INDEX idx_purchased_employees_employee_id ON public.purchased_employees(employee_id);
CREATE INDEX idx_purchased_employees_active ON public.purchased_employees(is_active) WHERE is_active = true;

ALTER TABLE public.purchased_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own hired employees"
    ON public.purchased_employees FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can hire employees (insert)"
    ON public.purchased_employees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hired employees"
    ON public.purchased_employees FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hired employees"
    ON public.purchased_employees FOR DELETE
    USING (auth.uid() = user_id);

GRANT ALL ON public.purchased_employees TO authenticated;
GRANT ALL ON public.purchased_employees TO service_role;

-- Verify
SELECT 'Setup complete!' as status;
"@

Write-Host $sql -ForegroundColor White
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""

# Copy to clipboard if possible
try {
    $sql | Set-Clipboard
    Write-Host "✅ SQL copied to clipboard!" -ForegroundColor Green
    Write-Host "   Just paste it in Supabase SQL Editor and click Run" -ForegroundColor White
} catch {
    Write-Host "ℹ️  Copy the SQL above manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 After running the SQL:" -ForegroundColor Cyan
Write-Host "   1. You should see 'Setup complete!' message" -ForegroundColor White
Write-Host "   2. Go to your marketplace and try hiring an employee" -ForegroundColor White
Write-Host "   3. It should work instantly!" -ForegroundColor White
Write-Host ""

# Save SQL to file as well
$sql | Out-File -FilePath "SETUP_DATABASE.sql" -Encoding UTF8
Write-Host "💾 SQL also saved to: SETUP_DATABASE.sql" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to continue"

