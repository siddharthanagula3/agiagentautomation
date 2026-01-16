#!/bin/bash

# Local Development Setup Script
# This script helps set up the local development environment

echo "🚀 Setting up AGI Agent Automation Local Development Environment"
echo "================================================================"

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is installed"
    fi
}

echo "📋 Checking required tools..."
check_tool "node"
check_tool "npm"
check_tool "git"

# Check for optional tools
echo ""
echo "📋 Checking optional tools..."
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI is installed"
else
    echo "⚠️  Supabase CLI is not installed. Install it with: npm install -g supabase"
fi

if command -v stripe &> /dev/null; then
    echo "✅ Stripe CLI is installed"
else
    echo "⚠️  Stripe CLI is not installed. Install it from: https://stripe.com/docs/stripe-cli"
fi

if command -v netlify &> /dev/null; then
    echo "✅ Netlify CLI is installed"
else
    echo "⚠️  Netlify CLI is not installed. Install it with: npm install -g netlify-cli"
fi

# Create environment file if it doesn't exist
echo ""
echo "📝 Setting up environment configuration..."

if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    cat > .env.local << 'EOF'
# Local Development Environment Configuration

# ===========================================
# VITE CONFIGURATION
# ===========================================
VITE_DEV_SERVER_URL=http://localhost:8080

# ===========================================
# SUPABASE LOCAL DEVELOPMENT
# ===========================================
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_supabase_anon_key_here

# ===========================================
# NETLIFY FUNCTIONS LOCAL DEVELOPMENT
# ===========================================
VITE_NETLIFY_FUNCTIONS_URL=http://localhost:8888
NETLIFY_FUNCTIONS_PORT=8888

# ===========================================
# STRIPE LOCAL DEVELOPMENT
# ===========================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# ===========================================
# DEVELOPMENT FLAGS
# ===========================================
VITE_DEMO_MODE=true
VITE_DEBUG=true
NODE_ENV=development
VITE_NODE_ENV=development

# ===========================================
# LOCAL DEVELOPMENT PORTS
# ===========================================
VITE_PORT=8080
SUPABASE_PORT=54321
SUPABASE_DB_PORT=54322
SUPABASE_STUDIO_PORT=54323
NETLIFY_PORT=8888
EOF
    echo "✅ Created .env.local file"
else
    echo "✅ .env.local file already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Install development dependencies
echo ""
echo "📦 Installing development dependencies..."
npm install -D

# Setup Supabase (if CLI is available)
if command -v supabase &> /dev/null; then
    echo ""
    echo "🗄️  Setting up Supabase local development..."
    
    if [ ! -d "supabase" ]; then
        echo "Initializing Supabase project..."
        supabase init
    fi
    
    echo "Starting Supabase local development server..."
    echo "This will start Supabase on:"
    echo "  - API: http://localhost:54321"
    echo "  - DB: postgresql://postgres:postgres@localhost:54322/postgres"
    echo "  - Studio: http://localhost:54323"
    echo ""
    echo "Run 'supabase start' to start the local Supabase instance"
else
    echo ""
    echo "⚠️  Supabase CLI not found. Please install it and run 'supabase start'"
fi

# Setup Netlify Functions
echo ""
echo "🔧 Setting up Netlify Functions..."
echo "To start Netlify Functions locally, run:"
echo "  netlify dev"
echo "This will start the functions server on http://localhost:8888"

# Setup Stripe CLI (if available)
if command -v stripe &> /dev/null; then
    echo ""
    echo "💳 Setting up Stripe CLI..."
    echo "To forward webhooks to your local development server, run:"
    echo "  stripe listen --forward-to localhost:8888/.netlify/functions/payments/stripe-webhook"
else
    echo ""
    echo "⚠️  Stripe CLI not found. Please install it for webhook testing"
fi

echo ""
echo "🎉 Local development setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your actual API keys"
echo "2. Start Supabase: supabase start"
echo "3. Start Netlify Functions: netlify dev"
echo "4. Start Stripe webhook forwarding: stripe listen --forward-to localhost:8888/.netlify/functions/payments/stripe-webhook"
echo "5. Start the frontend: npm run dev"
echo ""
echo "🌐 Local development URLs:"
echo "  - Frontend: http://localhost:8080"
echo "  - Supabase API: http://localhost:54321"
echo "  - Supabase Studio: http://localhost:54323"
echo "  - Netlify Functions: http://localhost:8888"
echo "  - Database: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "Happy coding! 🚀"
