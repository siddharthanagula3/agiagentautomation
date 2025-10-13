# PowerShell script to set up environment variables for local development
# Run this script to configure your .env file with localhost URLs

Write-Host "🚀 Setting up local development environment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "src/env.example" ".env"
}

# Read the current .env file
$envContent = Get-Content ".env" -Raw

# Replace placeholder values with localhost configuration
$envContent = $envContent -replace "VITE_SUPABASE_URL=your_supabase_url_here", "VITE_SUPABASE_URL=http://localhost:54321"
$envContent = $envContent -replace "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here", "VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
$envContent = $envContent -replace "VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here", "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RxgnG21oG095Q15c8WuKzv4x9Qn5t6bGPIctx5hGD1UrOe5t0aR4lj0qn7JRJdrvt2LKUUpBp2LLIKMldegwbxh004Oft02rx"
$envContent = $envContent -replace "VITE_API_URL=http://localhost:8888", "VITE_API_URL=http://localhost:8888"
$envContent = $envContent -replace "VITE_WS_URL=ws://localhost:8888", "VITE_WS_URL=ws://localhost:8888"
$envContent = $envContent -replace "VITE_DEMO_MODE=false", "VITE_DEMO_MODE=true"
$envContent = $envContent -replace "NODE_ENV=development", "NODE_ENV=development"

# Add additional local development variables
$additionalVars = @"

# Local Development Configuration
VITE_NETLIFY_FUNCTIONS_URL=http://localhost:8888
VITE_DEBUG=true
VITE_PORT=8080
SUPABASE_PORT=54321
SUPABASE_DB_PORT=54322
SUPABASE_STUDIO_PORT=54323
NETLIFY_PORT=8888
"@

$envContent += $additionalVars

# Write the updated content back to .env
Set-Content ".env" $envContent

Write-Host "✅ Environment configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Local Development URLs:" -ForegroundColor Cyan
Write-Host "  • Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "  • Supabase API: http://localhost:54321" -ForegroundColor White
Write-Host "  • Supabase Studio: http://localhost:54323" -ForegroundColor White
Write-Host "  • Netlify Functions: http://localhost:8888" -ForegroundColor White
Write-Host "  • Database: postgresql://postgres:postgres@localhost:54322/postgres" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start Supabase: supabase start" -ForegroundColor White
Write-Host "  2. Start Netlify Functions: netlify dev" -ForegroundColor White
Write-Host "  3. Start Frontend: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Ready for development!" -ForegroundColor Green
