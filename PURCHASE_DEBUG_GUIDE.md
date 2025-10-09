# Debug Guide: Failed to Complete Purchase

## Issue
After successful Stripe checkout, employee not appearing in workforce with error:
"Failed to complete purchase. Please contact support."

## Session ID from Error
`cs_test_b1JnBof2vBN5CLlker7iiwe16n5QdGaVHW124vxXdw4X0NRSdCiP0Xlm`

## Root Causes (Already Fixed in Code)

### 1. ✅ TypeScript Interface - FIXED
- Added `name` and `is_active` fields to `PurchasedEmployeeRecord`
- File: `src/services/supabase-employees.ts`

### 2. ✅ Netlify Function - FIXED
- Added `employeeName` parameter support in `netlify/functions/manual-purchase.ts`
- Extracts `employeeName` from Stripe session metadata
- Includes `name` field in database insert

### 3. ✅ Frontend Service - FIXED
- Updated `manualPurchaseEmployee` signature in `src/services/stripe-service.ts`
- Added `sessionId` parameter for fallback scenarios

### 4. ✅ Marketplace - FIXED
- Already passes `employeeName: employee.name` in checkout
- File: `src/pages/MarketplacePublicPage.tsx` line 86

## Potential Issues

### Issue A: Netlify Functions Not Deployed
**Problem**: Latest code changes not deployed to production Netlify
**Solution**: Push to GitHub triggers auto-deployment
```bash
git push origin main
```

### Issue B: Supabase Schema Missing Columns
**Problem**: Remote database missing `name` or `is_active` columns
**Check**: 
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchased_employees';
```

**Expected Columns**:
- id (uuid)
- user_id (uuid)
- employee_id (varchar)
- **name (varchar)** ← Must exist!
- role (varchar)
- provider (varchar)
- **is_active (boolean)** ← Must exist!
- purchased_at (timestamp)
- created_at (timestamp)

**Fix if Missing**:
```sql
-- Add name column
ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add is_active column
ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set defaults for existing records
UPDATE purchased_employees 
SET name = role 
WHERE name IS NULL;

UPDATE purchased_employees 
SET is_active = true 
WHERE is_active IS NULL;
```

### Issue C: RLS (Row Level Security) Policy
**Problem**: Service role can't insert without proper policy
**Check**:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'purchased_employees';
```

**Fix**:
```sql
-- Allow service role to insert (for webhooks)
CREATE POLICY "Service role can insert purchased employees" 
ON purchased_employees
FOR INSERT 
WITH CHECK (true);

-- Allow service role to update
CREATE POLICY "Service role can update purchased employees" 
ON purchased_employees
FOR UPDATE 
USING (true);
```

## Debugging Steps

### Step 1: Check Browser Console
Open `/workforce` page and look for:
```
[Workforce] 🎉 Detected successful payment!
[Workforce] Session ID: cs_test_...
[Workforce] ⚠️ No purchased employees found, webhook may have failed
[Workforce] 🔄 Attempting manual purchase fallback...
[Manual Purchase Service] Calling with data: {...}
```

### Step 2: Check Netlify Function Logs
Go to Netlify Dashboard → Functions → manual-purchase → View logs

Look for:
```
[Manual Purchase] Retrieving session details from Stripe: cs_test_...
[Manual Purchase] Retrieved session metadata: {...}
[Manual Purchase] Creating purchased employee record
```

### Step 3: Check Stripe Webhook Logs
```bash
stripe logs tail
```

Look for:
```
[Stripe Webhook] Checkout completed: cs_test_...
[Stripe Webhook] Session metadata: {...}
[Stripe Webhook] Successfully created purchased employee
```

### Step 4: Manually Test the Session
Open `test-manual-purchase.html` in browser:
1. Enter your User ID (from Supabase)
2. Session ID is pre-filled
3. Click "Test Manual Purchase"
4. Check the response

## Quick Fix Commands

### If Supabase Schema is Missing Columns:
```bash
# Connect to remote Supabase
supabase db remote --linked

# Run migration manually
psql $DATABASE_URL -c "
ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
"
```

### If Netlify Functions Not Updated:
```bash
# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push origin main
```

## Expected Data Flow

```
User completes Stripe checkout
         ↓
Stripe webhook fires (if configured)
    ├─ Success → Creates purchased_employees record
    └─ Fails → Manual fallback kicks in
         ↓
Page waits 2 seconds
         ↓
Checks if employee exists
    ├─ Exists → Show success toast
    └─ Not exists → Call manual-purchase
         ↓
         Fetch session from Stripe
         Extract metadata (employeeId, employeeName, employeeRole)
         Insert into Supabase
         ↓
         Refetch workforce data
         ↓
         Employee appears!
```

## Test Scenario

1. Go to `/marketplace`
2. Click "Hire" on any employee
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Get redirected: `/workforce?success=true&session_id=...`
6. Open browser console (F12)
7. Watch the logs
8. Employee should appear within 3 seconds

## Files to Check

1. `netlify/functions/manual-purchase.ts` - Handles fallback
2. `netlify/functions/stripe-webhook.ts` - Handles webhook
3. `netlify/functions/create-checkout-session.ts` - Creates session with metadata
4. `src/pages/workforce/WorkforcePage.tsx` - Handles success redirect
5. `src/services/stripe-service.ts` - Client-side Stripe calls
6. `src/services/supabase-employees.ts` - Database operations

## Most Likely Cause

**The Supabase remote database is missing the `name` column.**

The migration file `004_complete_workforce_schema.sql` includes it, but it may not have been applied to the remote database.

**Solution**: Apply the schema update manually to the remote Supabase database.

## Contact Support Info

If issue persists after all fixes:
1. Share session ID: `cs_test_b1JnBof2vBN5CLlker7iiwe16n5QdGaVHW124vxXdw4X0NRSdCiP0Xlm`
2. Share user ID (from Supabase auth.users table)
3. Share browser console logs from `/workforce` page
4. Share Netlify function logs for manual-purchase
5. Share Stripe webhook logs

## Status: Code is Correct ✅

All code changes have been made. The issue is likely a deployment/database state issue, not a code issue.

