#!/bin/bash
# Quick Start Check Script
# Verifies setup and provides next steps

echo "🔍 AGI Agent Automation - Setup Verification"
echo "============================================"
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check npm
echo ""
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm installed: $NPM_VERSION"
else
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

# Check if we're in the right directory
echo ""
echo "Checking directory structure..."
if [ -f "package.json" ]; then
    echo "✅ package.json found"
else
    echo "❌ package.json not found. Are you in the project root?"
    exit 1
fi

if [ -d "src" ]; then
    echo "✅ src directory found"
else
    echo "❌ src directory not found."
    exit 1
fi

# Check environment file
echo ""
echo "Checking environment configuration..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
    
    # Check for required variables
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo "✅ VITE_SUPABASE_URL configured"
    else
        echo "⚠️  VITE_SUPABASE_URL not found in .env"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo "✅ VITE_SUPABASE_ANON_KEY configured"
    else
        echo "⚠️  VITE_SUPABASE_ANON_KEY not found in .env"
    fi
else
    echo "⚠️  .env file not found. Please create one from .env.example"
fi

# Check if node_modules exists
echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory found"
else
    echo "⚠️  node_modules not found. Run: npm install"
fi

# Check key service files
echo ""
echo "Checking service files..."

FILES=(
    "src/services/cache-service.ts"
    "src/services/analytics-service.ts"
    "src/services/automation-service.ts"
    "src/tools/filesystem-tools.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file not found"
    fi
done

# Check updated pages
echo ""
echo "Checking updated pages..."

PAGES=(
    "src/pages/dashboard/Dashboard.tsx"
    "src/pages/analytics/AnalyticsPage.tsx"
    "src/pages/automation/AutomationPage.tsx"
)

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "✅ $page exists"
    else
        echo "❌ $page not found"
    fi
done

# Check scanner script
echo ""
echo "Checking mock data scanner..."
if [ -f "find-mock-data.js" ]; then
    echo "✅ find-mock-data.js exists"
else
    echo "❌ find-mock-data.js not found"
fi

# Summary
echo ""
echo "============================================"
echo "📋 Next Steps:"
echo "============================================"
echo ""
echo "1. Run mock data scanner:"
echo "   node find-mock-data.js"
echo ""
echo "2. Install dependencies (if needed):"
echo "   npm install"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "4. Verify database migrations in Supabase SQL Editor"
echo ""
echo "5. Read CLEANUP-GUIDE.md for detailed instructions"
echo ""
echo "============================================"
echo "✅ Setup verification complete!"
echo "============================================"
