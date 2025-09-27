#!/bin/bash

echo "====================================="
echo "🔧 ENVIRONMENT CONFIGURATION CHECK"
echo "====================================="
echo

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo
    echo "📝 Creating .env file with placeholder values..."
    echo "VITE_SUPABASE_URL=your_supabase_url_here" > .env
    echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here" >> .env
    echo
    echo "✅ .env file created with placeholder values"
    echo "📖 See ENVIRONMENT_SETUP_GUIDE.md for setup instructions"
    echo
    exit 1
fi

echo "✅ .env file found"
echo

# Run the Node.js check script
node check-env.js

echo
echo "🚀 Quick Commands:"
echo "  npm run check:env    - Check environment"
echo "  npm run verify:login - Test login system"
echo "  npm run dev          - Start development server"
echo