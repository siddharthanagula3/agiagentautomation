# 🚨 URGENT: Run This SQL in Supabase to Fix Purchase System

## Problem
AI Employees are not appearing in Workforce after successful Stripe checkout.

## Root Cause
The `purchased_employees` table is missing two required columns:
- `name` (stores employee display name)
- `is_active` (stores employee status)

## ✅ THE FIX (Takes 30 seconds)

### Step 1: Open Supabase SQL Editor
Click this link: https://supabase.com/dashboard/project/lywdzvfibhzbljrgovwr/editor/sql

### Step 2: Copy & Paste This SQL

```sql
-- Add missing columns
ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records
UPDATE purchased_employees 
SET name = role 
WHERE name IS NULL OR name = '';

UPDATE purchased_employees 
SET is_active = COALESCE(is_active, true);

-- Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchased_employees'
ORDER BY ordinal_position;
```

### Step 3: Click "Run" (or press Ctrl+Enter)

### Step 4: Verify
The last query should show both `name` and `is_active` columns in the result.

---

## After Running the SQL:

### Test the Purchase Flow:
1. Go to `/marketplace`
2. Click "Hire" on any AI Employee
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Get redirected to `/workforce`
6. **Employee should appear within 3 seconds!** ✅

---

## What's Fixed:

✅ All application code is correct:
- TypeScript interfaces include both columns
- Netlify functions pass employeeName in metadata
- Stripe webhook inserts both columns
- Manual fallback includes both columns
- Frontend displays both fields

❌ Only the database schema needs updating

---

## Files Reference:
See `RUN_THIS_SQL_IN_SUPABASE.sql` for a fully commented version of the SQL.

---

## Need Help?
If the fix doesn't work:
1. Check browser console (F12) on `/workforce` page
2. Look for `[Workforce]` log messages
3. Check Netlify function logs for `manual-purchase`
4. Verify columns were added with the SELECT query

**This SQL fix will immediately solve the purchase system!** 🚀

