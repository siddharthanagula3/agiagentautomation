#!/bin/bash

echo "🔧 Finishing Project Refactoring - Import Updates"
echo "=================================================="

# Function to show progress
show_progress() {
    echo "✓ $1"
}

# Update all page component imports
echo ""
echo "📄 Updating page imports..."
find src/pages src/features -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
    -e "s|from '../components/ui/|from '@shared/ui/|g" \
    -e "s|from '@/components/ui/|from '@shared/ui/|g" \
    -e "s|from '../components/|from '@shared/components/|g" \
    -e "s|from '@/components/|from '@shared/components/|g" \
    -e "s|from '../services/|from '@core/|g" \
    -e "s|from '@/services/|from '@core/|g" \
    -e "s|from '../types/|from '@shared/types/|g" \
    -e "s|from '@/types/|from '@shared/types/|g" \
    -e "s|from '../utils/|from '@shared/utils/|g" \
    -e "s|from '@/utils/|from '@shared/utils/|g" \
    -e "s|from '../data/|from '@/data/|g" \
    {} \;
show_progress "Updated page imports"

# Update layout imports
echo ""
echo "📐 Updating layout imports..."
find src/layouts -type f -name "*.tsx" -exec sed -i \
    -e "s|from '../components/|from '@shared/components/|g" \
    -e "s|from '@/components/|from '@shared/components/|g" \
    {} \;
show_progress "Updated layout imports"

# Update config imports
echo ""
echo "⚙️  Updating config imports..."
find src/config -type f -name "*.ts" -exec sed -i \
    -e "s|from '../lib/|from '@shared/lib/|g" \
    -e "s|from '@/lib/|from '@shared/lib/|g" \
    {} \;
show_progress "Updated config imports"

# Update integration imports
echo ""
echo "🔌 Updating integration imports..."
find src/integrations -type f -name "*.ts" -exec sed -i \
    -e "s|from '../lib/|from '@shared/lib/|g" \
    -e "s|from '@/lib/|from '@shared/lib/|g" \
    -e "s|from '../services/|from '@core/|g" \
    -e "s|from '@/services/|from '@core/|g" \
    {} \;
show_progress "Updated integration imports"

# Fix any remaining data imports
echo ""
echo "💾 Fixing data imports..."
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i \
    -e "s|from '@shared/data/|from '@/data/|g" \
    -e "s|from '@core/data/|from '@/data/|g" \
    {} \;
show_progress "Fixed data imports"

echo ""
echo "🧪 Running TypeScript type check..."
npm run type-check
if [ $? -eq 0 ]; then
    show_progress "Type check passed!"
else
    echo "❌ Type check failed - please review errors above"
    exit 1
fi

echo ""
echo "🏗️  Running production build..."
npm run build
if [ $? -eq 0 ]; then
    show_progress "Build successful!"
    echo ""
    echo "✅ Refactoring Complete!"
    echo ""
    echo "📊 Summary:"
    echo "  - Directory structure reorganized"
    echo "  - 200+ files moved to new locations"
    echo "  - Path aliases configured"
    echo "  - All imports updated"
    echo "  - Build verified"
    echo ""
    echo "📚 See docs/REFACTORING_SUMMARY.md for full details"
else
    echo "❌ Build failed - checking for remaining issues..."
    echo ""
    echo "Run this to see specific errors:"
    echo "  npm run build 2>&1 | grep -E 'Could not resolve|error'"
    exit 1
fi
