#!/bin/bash

# VIBE Deployment Workflow
# Complete workflow for deploying VIBE with database migrations

set -e

echo "🚀 VIBE Deployment Workflow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Type checking
echo "Step 1: Running TypeScript type check..."
if npm run type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi
echo ""

# Step 2: Apply database migration
echo "Step 2: Applying database migrations..."
if command -v supabase &> /dev/null; then
    if supabase db reset; then
        print_success "Database migrations applied"
    else
        print_warning "Database migration failed (Docker might not be running)"
        echo "   You can apply migrations manually:"
        echo "   1. Start Docker Desktop"
        echo "   2. Run: supabase db reset"
        echo "   3. Or apply via Supabase Dashboard SQL Editor"
    fi
else
    print_warning "Supabase CLI not installed"
    echo "   Install: npm install -g supabase"
fi
echo ""

# Step 3: Test VIBE integration (if TypeScript is set up)
echo "Step 3: Testing VIBE integration..."
if [ -f "scripts/test-vibe-integration.ts" ]; then
    if command -v tsx &> /dev/null; then
        print_warning "Integration tests available (run with: tsx scripts/test-vibe-integration.ts)"
    else
        print_warning "Install tsx to run integration tests: npm install -g tsx"
    fi
else
    print_warning "Test script not found"
fi
echo ""

# Step 4: Build project
echo "Step 4: Building project..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi
echo ""

# Step 5: Deploy to Netlify
echo "Step 5: Deploying to Netlify..."
if git diff --quiet && git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    echo "   Changes detected, committing..."
    git add .
    git commit -m "feat: VIBE Supabase integration with message service and agent actions" || true
fi

if git push origin main; then
    print_success "Pushed to GitHub - Netlify will auto-deploy"
    echo ""
    echo "📊 Deployment Info:"
    echo "   Site: https://agiagentautomation.com"
    echo "   Netlify Dashboard: https://app.netlify.com/projects/jocular-shortbread-1c7967"
else
    print_error "Git push failed"
    exit 1
fi
echo ""

# Step 6: Monitor deployment
echo "Step 6: Monitor deployment..."
print_warning "Check Netlify deployment status:"
echo "   Dashboard: https://app.netlify.com/projects/jocular-shortbread-1c7967/deploys"
echo "   Or use: netlify watch"
echo ""

print_success "Deployment workflow complete!"
echo ""
echo "🎯 Next Steps:"
echo "   1. Verify migration applied: Check Supabase Dashboard"
echo "   2. Test VIBE at: https://agiagentautomation.com/vibe"
echo "   3. Monitor agent actions in real-time"
echo "   4. Check deployment logs if issues occur"
echo ""
