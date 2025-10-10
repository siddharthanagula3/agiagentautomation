# PowerShell Script to Setup Stripe Webhook Listening
# This script will start Stripe CLI to listen for webhooks

Write-Host "💳 AGI Agent Automation - Stripe Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Stripe CLI is installed
try {
    $stripeVersion = stripe --version 2>&1
    Write-Host "✅ Stripe CLI found: $stripeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Stripe CLI not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Stripe CLI:" -ForegroundColor Yellow
    Write-Host "   scoop install stripe" -ForegroundColor White
    Write-Host "   OR download from: https://stripe.com/docs/stripe-cli" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🔑 Login to Stripe (if not already logged in):" -ForegroundColor Yellow
Write-Host "   stripe login" -ForegroundColor White
Write-Host ""

$response = Read-Host "Have you logged in to Stripe CLI? (y/n)"
if ($response -ne "y") {
    Write-Host "Please run: stripe login" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🎯 Starting Stripe webhook forwarding..." -ForegroundColor Cyan
Write-Host "   Forwarding to: http://localhost:8888/.netlify/functions/stripe-webhook" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Keep this window open while testing!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 After this starts:" -ForegroundColor Cyan
Write-Host "   1. Copy the webhook signing secret (whsec_...)" -ForegroundColor White
Write-Host "   2. Add it to your .env file as STRIPE_WEBHOOK_SECRET" -ForegroundColor White
Write-Host "   3. Test a subscription in your app" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start Stripe webhook forwarding
stripe listen --forward-to http://localhost:8888/.netlify/functions/stripe-webhook

