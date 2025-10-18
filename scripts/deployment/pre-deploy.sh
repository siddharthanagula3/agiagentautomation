#!/bin/bash

# Pre-deployment script for AGI Agent Automation Platform
# This script runs before deployment to ensure everything is ready

set -e

echo "🚀 Starting pre-deployment checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the project root?"
    exit 1
fi

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node --version)
echo "Node.js version: $node_version"

# Check if required environment variables are set
echo "🔍 Checking environment variables..."
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "⚠️  Warning: VITE_SUPABASE_URL not set"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Warning: VITE_SUPABASE_ANON_KEY not set"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running TypeScript type check..."
npm run type-check

# Run linting
echo "🧹 Running ESLint..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test:run

# Build the project
echo "🏗️  Building project..."
npm run build

# Check build output
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist directory not found"
    exit 1
fi

echo "✅ Pre-deployment checks completed successfully!"
echo "📁 Build output: $(du -sh dist | cut -f1)"
