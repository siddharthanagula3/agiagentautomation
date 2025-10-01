# 🔧 COMPREHENSIVE FIX TODO LIST

## STATUS: IN PROGRESS

---

## ✅ COMPLETED FIXES

### 1. API Keys Page - useAuthStore Fix ✅
**File**: `src/pages/dashboard/APIKeysPage.tsx`
**Issue**: Line 32 used `useAuthStore()` instead of `useAuth()`
**Fix**: Changed to `const { user } = useAuth();`
**Status**: FIXED

---

## 🔄 FIXES IN PROGRESS

### 2. Settings Page - Navigation Not Working
**File**: `src/pages/settings/SettingsPage.tsx`
**Issue**: Tabs change but URL doesn't update, clicking sidebar doesn't navigate
**Root Cause**: `activeSection` state is set from URL params but tab onChange doesn't update URL
**Fix Needed**: 
```typescript
// Change this:
onValueChange={setActiveSection}

// To this:
onValueChange={(value) => {
  setActiveSection(value);
  navigate(`/settings/${value}`, { replace: true });
}}
```
**Status**: ANALYZING

### 3. Theme Settings Not Working
**Files**: 
- `src/pages/settings/SettingsPage.tsx` (theme select)
- `src/components/layout/Header.tsx` (theme toggle button)
**Issue**: Theme selection doesn't persist or apply
**Root Cause**: Theme is saved to database but not applied to DOM
**Fix Needed**: Implement theme provider with localStorage and CSS class toggling
**Status**: ANALYZING

### 4. Workforce Page - Hired Employees Not Showing
**File**: `src/pages/workforce/WorkforcePage.tsx`
**Issue**: Not querying or displaying purchased_employees
**Fix Needed**: 
- Query `purchased_employees` table where `user_id = current_user`
- Display in grid/list format
- Handle empty state
**Status**: ANALYZING

### 5. Create Workflow Button - Not Working
**Files**:
- `src/pages/automation/WorkflowsPage.tsx`
- `src/pages/dashboard/DashboardHomePage.tsx`
**Issue**: Button doesn't navigate or open dialog
**Fix Needed**: 
```typescript
// Add onClick handler:
<Button onClick={() => navigate('/automation/designer/new')}>
  Create Workflow
</Button>
```
**Status**: ANALYZING

### 6. My AI Team - Wrong Redirect
**File**: Need to find where this button is
**Issue**: Redirects to `/dashboard/chat` instead of `/chat`
**Fix Needed**: Change redirect path
**Status**: ANALYZING - Need to find file

### 7. Autonomous Workflows - Mock Data
**File**: `src/pages/autonomous/AutonomousWorkflowsPage.tsx`
**Issue**: Showing hardcoded stats (success rate, executions, etc.)
**Fix Needed**: Query `automation_executions` table for real data
**Status**: ANALYZING

### 8. Workflow Designer - White Screen on Scroll
**File**: `src/pages/automation/WorkflowDesignerPage.tsx` or similar
**Issue**: White background visible on scroll
**Fix Needed**: Add `bg-slate-900` or similar to container
**Status**: ANALYZING - Need to find file

### 9. Integrations Page - Template Mock Data
**File**: `src/components/automation/IntegrationSettingsPanel.tsx`
**Issue**: Uses hardcoded `integrationTemplates` array
**Fix Needed**: Query `integration_configs` table, show real user integrations
**Status**: ANALYZING

### 10. Upgrade Plan Buttons - Not Implemented
**Files**: Multiple pages
**Issue**: Buttons do nothing
**Fix Needed**: Navigate to `/billing` or show upgrade modal
**Status**: ANALYZING - Need to find all instances

---

## 📋 NEXT STEPS

1. Fix Settings navigation (Priority 1)
2. Fix Theme functionality (Priority 1)  
3. Fix Workforce display (Priority 2)
4. Fix Create Workflow buttons (Priority 2)
5. Find and fix "My AI Team" redirect (Priority 2)
6. Fix Autonomous Workflows data (Priority 3)
7. Fix Designer background (Priority 3)
8. Fix Integrations to use real data (Priority 3)
9. Find and fix all Upgrade Plan buttons (Priority 3)

---

## 🔍 FILES TO LOCATE

- [ ] My AI Team button location
- [ ] Workflow Designer page
- [ ] All Upgrade Plan button locations
- [ ] Autonomous Workflows page

---

**Last Updated**: Just now
**Fixes Applied**: 1/10
**Estimated Time Remaining**: 2-3 hours
