# 🔧 COMPREHENSIVE BUG FIX PLAN

**Date**: September 30, 2025  
**Status**: Analyzing and Fixing Issues

---

## 📋 ISSUES TO FIX

### 1. ❌ Integrations Page - Mock Data
**File**: `src/components/automation/IntegrationSettingsPanel.tsx`
**Issue**: Uses hardcoded `integrationTemplates` array
**Fix**: Replace with real data from Supabase `integration_configs` table

### 2. ❌ Create Workflow Button Not Working
**Files**: 
- `src/pages/automation/WorkflowsPage.tsx`
- `src/pages/dashboard/DashboardHomePage.tsx`
**Issue**: Button doesn't navigate or open dialog
**Fix**: Implement navigation to workflow designer or open create dialog

### 3. ❌ Upgrade Plan Button
**Files**: Multiple pages
**Issue**: Functionality not implemented
**Fix**: Navigate to billing page or show upgrade modal

### 4. ❌ API Keys Page - useAuthStore undefined
**File**: `src/pages/dashboard/ApiKeysPage.tsx`
**Issue**: Using `useAuthStore` instead of `useAuth`
**Fix**: Change import to use correct auth hook

### 5. ❌ Settings Sidebar Navigation
**File**: `src/pages/settings/SettingsPage.tsx` or layout
**Issue**: Clicking different settings options doesn't change page
**Fix**: Fix routing logic in settings page

### 6. ❌ Theme Settings Not Working
**Files**: 
- `src/pages/settings/*` (theme settings)
- `src/components/layout/Header.tsx` (theme toggle)
**Issue**: Theme toggle doesn't work
**Fix**: Implement proper theme switching with persistence

### 7. ❌ Hired Employees Not Showing in Workforce
**File**: `src/pages/workforce/WorkforcePage.tsx`
**Issue**: Not fetching/displaying purchased_employees
**Fix**: Query `purchased_employees` table and display

### 8. ❌ My AI Team Wrong Redirect
**File**: `src/pages/marketplace/MarketplacePage.tsx` or similar
**Issue**: Redirecting to `/dashboard/chat` instead of `/chat`
**Fix**: Update redirect path

### 9. ❌ Autonomous Workflows Mock Data
**File**: `src/pages/autonomous/AutonomousWorkflowsPage.tsx`
**Issue**: Showing hardcoded success rate, executions, etc.
**Fix**: Query real data from `automation_executions` table

### 10. ❌ Designer White Screen on Scroll
**File**: `src/pages/automation/WorkflowDesignerPage.tsx` or similar
**Issue**: White background showing on scroll
**Fix**: Add proper background styling

---

## 🎯 EXECUTION PLAN

1. Fix API Keys page (Quick - 5 min)
2. Fix Theme functionality (Medium - 15 min)
3. Fix Settings navigation (Medium - 15 min)
4. Fix Workforce display (Medium - 20 min)
5. Fix Create Workflow buttons (Medium - 15 min)
6. Fix My AI Team redirect (Quick - 5 min)
7. Fix Autonomous Workflows data (Medium - 20 min)
8. Fix Designer background (Quick - 5 min)
9. Fix Integrations page (Complex - 30 min)
10. Fix Upgrade Plan buttons (Medium - 15 min)

**Total Estimated Time**: 2-3 hours

---

## 📁 FILES TO MODIFY

Analyzing current structure...
