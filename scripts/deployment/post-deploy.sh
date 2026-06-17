#!/bin/bash

# Post-deployment script for AGI Agent Automation Platform
# This script runs after deployment to verify everything is working

set -e

echo "🎉 Starting post-deployment verification..."

# Get the deployment URL (this would be provided by Vercel)
DEPLOY_URL=${VERCEL_URL:-"https://agiworkforce.com"}

echo "🌐 Checking deployment at: $DEPLOY_URL"

# Check if the site is accessible
echo "🔍 Checking site accessibility..."
if curl -f -s "$DEPLOY_URL" > /dev/null; then
    echo "✅ Site is accessible"
else
    echo "❌ Error: Site is not accessible"
    exit 1
fi

# Check if the API endpoints are working
echo "🔍 Checking API endpoints..."

# Check health endpoint (if exists)
if curl -f -s "$DEPLOY_URL/api/health" > /dev/null; then
    echo "✅ Health endpoint is working"
else
    echo "⚠️  Warning: Health endpoint not found or not working"
fi

# Check if the main pages load
echo "🔍 Checking main pages..."

pages=(
    "/"
    "/pricing"
    "/about"
    "/login"
)

for page in "${pages[@]}"; do
    if curl -f -s "$DEPLOY_URL$page" > /dev/null; then
        echo "✅ Page $page is accessible"
    else
        echo "❌ Error: Page $page is not accessible"
        exit 1
    fi
done

# Check build artifacts
echo "🔍 Checking build artifacts..."
if [ -f "dist/index.html" ]; then
    echo "✅ index.html exists"
else
    echo "❌ Error: index.html not found"
    exit 1
fi

# Check if assets are properly built
if [ -d "dist/assets" ]; then
    echo "✅ Assets directory exists"
    echo "📁 Assets count: $(find dist/assets -type f | wc -l)"
else
    echo "❌ Error: Assets directory not found"
    exit 1
fi

# Check environment variables in production
echo "🔍 Checking production environment..."
if [ -n "$VITE_SUPABASE_URL" ]; then
    echo "✅ Supabase URL is configured"
else
    echo "⚠️  Warning: Supabase URL not configured"
fi

# Run smoke tests (if available)
if [ -f "tests/smoke/smoke.test.js" ]; then
    echo "🧪 Running smoke tests..."
    npm run test:smoke
fi

echo "✅ Post-deployment verification completed successfully!"
echo "🎉 Deployment is ready for use!"
