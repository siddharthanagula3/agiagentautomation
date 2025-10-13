@echo off
REM Local Development Setup Script for Windows
REM This script helps set up the local development environment

echo 🚀 Setting up AGI Agent Automation Local Development Environment
echo ================================================================

REM Check if required tools are installed
echo 📋 Checking required tools...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install it first.
    exit /b 1
) else (
    echo ✅ Node.js is installed
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install it first.
    exit /b 1
) else (
    echo ✅ npm is installed
)

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install it first.
    exit /b 1
) else (
    echo ✅ Git is installed
)

REM Check for optional tools
echo.
echo 📋 Checking optional tools...

where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Supabase CLI is not installed. Install it with: npm install -g supabase
) else (
    echo ✅ Supabase CLI is installed
)

where stripe >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Stripe CLI is not installed. Install it from: https://stripe.com/docs/stripe-cli
) else (
    echo ✅ Stripe CLI is installed
)

where netlify >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Netlify CLI is not installed. Install it with: npm install -g netlify-cli
) else (
    echo ✅ Netlify CLI is installed
)

REM Create environment file if it doesn't exist
echo.
echo 📝 Setting up environment configuration...

if not exist .env.local (
    echo Creating .env.local file...
    (
        echo # Local Development Environment Configuration
        echo.
        echo # ===========================================
        echo # VITE CONFIGURATION
        echo # ===========================================
        echo VITE_DEV_SERVER_URL=http://localhost:8080
        echo.
        echo # ===========================================
        echo # SUPABASE LOCAL DEVELOPMENT
        echo # ===========================================
        echo VITE_SUPABASE_URL=http://localhost:54321
        echo VITE_SUPABASE_ANON_KEY=your_local_supabase_anon_key_here
        echo.
        echo # ===========================================
        echo # NETLIFY FUNCTIONS LOCAL DEVELOPMENT
        echo # ===========================================
        echo VITE_NETLIFY_FUNCTIONS_URL=http://localhost:8888
        echo NETLIFY_FUNCTIONS_PORT=8888
        echo.
        echo # ===========================================
        echo # STRIPE LOCAL DEVELOPMENT
        echo # ===========================================
        echo VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
        echo STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
        echo STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
        echo.
        echo # ===========================================
        echo # DEVELOPMENT FLAGS
        echo # ===========================================
        echo VITE_DEMO_MODE=true
        echo VITE_DEBUG=true
        echo NODE_ENV=development
        echo VITE_NODE_ENV=development
        echo.
        echo # ===========================================
        echo # LOCAL DEVELOPMENT PORTS
        echo # ===========================================
        echo VITE_PORT=8080
        echo SUPABASE_PORT=54321
        echo SUPABASE_DB_PORT=54322
        echo SUPABASE_STUDIO_PORT=54323
        echo NETLIFY_PORT=8888
    ) > .env.local
    echo ✅ Created .env.local file
) else (
    echo ✅ .env.local file already exists
)

REM Install dependencies
echo.
echo 📦 Installing dependencies...
npm install

REM Install development dependencies
echo.
echo 📦 Installing development dependencies...
npm install -D

REM Setup Supabase (if CLI is available)
where supabase >nul 2>nul
if %errorlevel% equ 0 (
    echo.
    echo 🗄️  Setting up Supabase local development...
    
    if not exist supabase (
        echo Initializing Supabase project...
        supabase init
    )
    
    echo Starting Supabase local development server...
    echo This will start Supabase on:
    echo   - API: http://localhost:54321
    echo   - DB: postgresql://postgres:postgres@localhost:54322/postgres
    echo   - Studio: http://localhost:54323
    echo.
    echo Run 'supabase start' to start the local Supabase instance
) else (
    echo.
    echo ⚠️  Supabase CLI not found. Please install it and run 'supabase start'
)

REM Setup Netlify Functions
echo.
echo 🔧 Setting up Netlify Functions...
echo To start Netlify Functions locally, run:
echo   netlify dev
echo This will start the functions server on http://localhost:8888

REM Setup Stripe CLI (if available)
where stripe >nul 2>nul
if %errorlevel% equ 0 (
    echo.
    echo 💳 Setting up Stripe CLI...
    echo To forward webhooks to your local development server, run:
    echo   stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
) else (
    echo.
    echo ⚠️  Stripe CLI not found. Please install it for webhook testing
)

echo.
echo 🎉 Local development setup complete!
echo.
echo 📋 Next steps:
echo 1. Update .env.local with your actual API keys
echo 2. Start Supabase: supabase start
echo 3. Start Netlify Functions: netlify dev
echo 4. Start Stripe webhook forwarding: stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
echo 5. Start the frontend: npm run dev
echo.
echo 🌐 Local development URLs:
echo   - Frontend: http://localhost:8080
echo   - Supabase API: http://localhost:54321
echo   - Supabase Studio: http://localhost:54323
echo   - Netlify Functions: http://localhost:8888
echo   - Database: postgresql://postgres:postgres@localhost:54322/postgres
echo.
echo Happy coding! 🚀
pause
