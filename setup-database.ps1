# PowerShell script to copy database setup SQL to clipboard
# Run this script to easily copy the SQL to Supabase

Write-Host "🚀 Setting up database for production deployment..." -ForegroundColor Green
Write-Host ""

# Read the SQL file and copy to clipboard
$sqlContent = Get-Content "COMPLETE_DATABASE_SETUP.sql" -Raw
Set-Clipboard $sqlContent

Write-Host "✅ SQL script copied to clipboard!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to your Supabase project dashboard" -ForegroundColor White
Write-Host "2. Navigate to SQL Editor" -ForegroundColor White
Write-Host "3. Paste the SQL (Ctrl+V)" -ForegroundColor White
Write-Host "4. Click 'Run' to execute" -ForegroundColor White
Write-Host "5. Verify tables are created successfully" -ForegroundColor White
Write-Host ""
Write-Host "🎯 This will create:" -ForegroundColor Cyan
Write-Host "   • purchased_employees table (for free hiring)" -ForegroundColor White
Write-Host "   • token_usage table (for billing)" -ForegroundColor White
Write-Host "   • RLS policies (for security)" -ForegroundColor White
Write-Host "   • Performance indexes" -ForegroundColor White
Write-Host "   • Token limit functions" -ForegroundColor White
Write-Host ""
Write-Host "🚀 After database setup, deploy to Netlify!" -ForegroundColor Green