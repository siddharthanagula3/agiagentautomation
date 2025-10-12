# Simple PowerShell script to set up environment variables
Write-Host "Setting up local development environment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "src/env.example" ".env"
}

# Create the environment content
$envContent = @"
# Environment Variables for Local Development
# NEVER commit this file to version control

# Supabase Configuration (Local Development)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH

# Stripe Configuration (Test Mode)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51RxgnG21oG095Q15c8WuKzv4x9Qn5t6bGPIctx5hGD1UrOe5t0aR4lj0qn7JRJdrvt2LKUUpBp2LLIKMldegwbxh004Oft02rx

# API Configuration (Local)
VITE_API_URL=http://localhost:8888
VITE_WS_URL=ws://localhost:8888
VITE_NETLIFY_FUNCTIONS_URL=http://localhost:8888

# Development Settings
NODE_ENV=development
VITE_DEMO_MODE=true
VITE_DEBUG=true

# Local Development Ports
VITE_PORT=8080
SUPABASE_PORT=54321
SUPABASE_DB_PORT=54322
SUPABASE_STUDIO_PORT=54323
NETLIFY_PORT=8888

# API Keys (Optional for demo mode)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_PERPLEXITY_API_KEY=your_perplexity_api_key_here

# JWT Secret (for development)
VITE_JWT_SECRET=your_jwt_secret_here
"@

# Write the content to .env file
Set-Content ".env" $envContent

Write-Host "Environment configuration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Local Development URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "  Supabase API: http://localhost:54321" -ForegroundColor White
Write-Host "  Supabase Studio: http://localhost:54323" -ForegroundColor White
Write-Host "  Netlify Functions: http://localhost:8888" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start Supabase: supabase start" -ForegroundColor White
Write-Host "  2. Start Netlify Functions: netlify dev" -ForegroundColor White
Write-Host "  3. Start Frontend: npm run dev" -ForegroundColor White
