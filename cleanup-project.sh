#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "   AGI AGENT AUTOMATION - CLEANUP"
echo "========================================"
echo ""
echo -e "${CYAN}🧹 Starting cleanup process...${NC}"
echo ""

# Delete temporary documentation files
echo -e "${CYAN}[1/4] Deleting temporary documentation...${NC}"
rm -f ALL_IMPORT_ERRORS_FIXED.md && echo -e "${GREEN}✅ Deleted: ALL_IMPORT_ERRORS_FIXED.md${NC}"
rm -f BUILD_COMPLETE_FIX.md && echo -e "${GREEN}✅ Deleted: BUILD_COMPLETE_FIX.md${NC}"
rm -f BUILD_ERROR_SOLUTION.md && echo -e "${GREEN}✅ Deleted: BUILD_ERROR_SOLUTION.md${NC}"
rm -f BUILD_FIX_CHECKLIST.md && echo -e "${GREEN}✅ Deleted: BUILD_FIX_CHECKLIST.md${NC}"
rm -f NETLIFY_BUILD_FINAL_FIX.md && echo -e "${GREEN}✅ Deleted: NETLIFY_BUILD_FINAL_FIX.md${NC}"
rm -f NETLIFY_BUILD_FIX.md && echo -e "${GREEN}✅ Deleted: NETLIFY_BUILD_FIX.md${NC}"
rm -f QUICK_FIX_REFERENCE.md && echo -e "${GREEN}✅ Deleted: QUICK_FIX_REFERENCE.md${NC}"
rm -f SETTINGS_REAL_DATA_GUIDE.md && echo -e "${GREEN}✅ Deleted: SETTINGS_REAL_DATA_GUIDE.md${NC}"
rm -f SETTINGS_SETUP_CHECKLIST.md && echo -e "${GREEN}✅ Deleted: SETTINGS_SETUP_CHECKLIST.md${NC}"
rm -f TEST_AND_CLEAN.md && echo -e "${GREEN}✅ Deleted: TEST_AND_CLEAN.md${NC}"
rm -f verify-build.bat && echo -e "${GREEN}✅ Deleted: verify-build.bat${NC}"
rm -f verify-build.sh && echo -e "${GREEN}✅ Deleted: verify-build.sh${NC}"
echo ""

# Delete debug components
echo -e "${CYAN}[2/4] Deleting debug components...${NC}"
rm -f src/components/AuthDebugMonitor.tsx && echo -e "${GREEN}✅ Deleted: AuthDebugMonitor.tsx${NC}"
rm -f src/components/DebugPanel.tsx && echo -e "${GREEN}✅ Deleted: DebugPanel.tsx${NC}"
rm -f src/pages/AuthDebugPage.tsx && echo -e "${GREEN}✅ Deleted: AuthDebugPage.tsx${NC}"
echo ""

# Optional: Delete demo components (commented out by default)
echo -e "${CYAN}[3/4] Checking demo components...${NC}"
echo -e "${YELLOW}⚠️  Demo components kept (uncomment script lines to remove)${NC}"
# rm -f src/components/DemoModeBanner.tsx
# rm -rf src/pages/demo/
echo ""

# Clean build artifacts
echo -e "${CYAN}[4/4] Cleaning build artifacts...${NC}"
rm -rf dist/ && echo -e "${GREEN}✅ Cleaned: dist/${NC}"
rm -rf node_modules/.vite && echo -e "${GREEN}✅ Cleaned: node_modules/.vite/${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}   ✅ CLEANUP COMPLETE!${NC}"
echo "========================================"
echo ""
echo "📋 Next Steps:"
echo "   1. Review COMPLETE_CLEANUP_PLAN.md"
echo "   2. Update App.tsx (remove debug imports)"
echo "   3. Run: npm run type-check"
echo "   4. Run: npm run build"
echo ""
echo "🎯 Files Remaining to Keep:"
echo "   ✅ README.md"
echo "   ✅ API_SETUP_GUIDE.md"
echo "   ✅ SETUP_GUIDE.md"
echo "   ✅ SUPABASE_SETUP_GUIDE.md"
echo "   ✅ FINAL_UPDATE.md"
echo "   ✅ COMPLETE_CLEANUP_PLAN.md (this guide)"
echo ""
