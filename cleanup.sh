#!/bin/bash

echo "🧹 Starting AGI Agent Automation cleanup..."

# Test files and reports
echo "Deleting test files..."
rm -f test-website-comprehensive.cjs
rm -f test-website-comprehensive.js
rm -f website-test-report-2025-09-28.json

# Documentation/temporary files
echo "Deleting documentation files..."
rm -f CLAUDE.md
rm -f gemini.md
rm -f README-Phase4.md
rm -f QUICKSTART.js

# Build artifacts
echo "Deleting build artifacts..."
rm -rf dist/
rm -f bun.lockb

# Test directory
echo "Deleting test directory..."
rm -rf src/test/

# Unused page files
echo "Deleting unused pages..."
rm -f src/pages/AboutPage.tsx
rm -f src/pages/BlogPage.tsx
rm -f src/pages/BlogPostPage.tsx
rm -f src/pages/CareersPage.tsx
rm -f src/pages/ContactPage.tsx
rm -f src/pages/FeaturesPage.tsx
rm -f src/pages/LegalPage.tsx
rm -f src/pages/ChatInterface.tsx
rm -f src/pages/DashboardHomePage.tsx
rm -f src/pages/NotFoundPage.tsx

# Unused component files
echo "Deleting unused components..."
rm -f src/components/ChatGPTHeader.tsx
rm -f src/components/ChatGPTInput.tsx
rm -f src/components/ChatGPTMessage.tsx
rm -f src/components/ChatGPTSidebar.tsx
rm -f src/components/CompleteAdminDashboard.tsx
rm -f src/components/CompleteAIEmployeeChat.tsx
rm -f src/components/CompleteAIEmployeeMarketplace.tsx
rm -f src/components/Header.tsx
rm -f src/components/Sidebar.tsx
rm -f src/components/SimpleHeader.tsx
rm -f src/components/MessageBubble.tsx
rm -f src/components/MessageComposer.tsx
rm -f src/components/AuthDebugger.tsx
rm -f src/components/HideLoader.tsx
rm -f src/components/RealtimeDashboard.tsx
rm -f src/components/RealtimeNotification.tsx
rm -f src/components/AIEmployeeChat.tsx

# Empty navigation directory
echo "Cleaning up empty directories..."
rm -rf src/components/navigation/

# Optimize package.json
echo "Optimizing package.json..."
if [ -f package_optimized.json ]; then
    mv package_optimized.json package.json
fi

# Unused directories that might be empty
echo "Checking for empty directories..."
find src/ -type d -empty -delete 2>/dev/null || true

echo "✅ Cleanup complete!"
echo "📁 Cleaned up unnecessary files from the project"

# Show remaining structure
echo "📂 Remaining project structure:"
tree src/ -I 'node_modules|.git' -L 2 2>/dev/null || find src/ -type d | head -20
