# 🚨 URGENT: Manual Fix Required for Purchase System

## Current Issue
Purchase system failing with error: **"Failed to complete purchase. Please contact support."**

**Root Cause**: The `purchased_employees` table in Supabase is missing `name` and `is_active` columns.

---

## ✅ SOLUTION: Run This SQL in Supabase Dashboard

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select project: `agiagentautomation`
   - Click **"SQL Editor"** in the left sidebar

2. **Create New Query**
   - Click "New Query" button
   - Or use existing query tab

3. **Copy & Paste This SQL**
   ```sql
   -- Add missing columns to purchased_employees
   ALTER TABLE purchased_employees 
   ADD COLUMN IF NOT EXISTS name VARCHAR(255);

   ALTER TABLE purchased_employees 
   ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

   -- Update existing records
   UPDATE purchased_employees 
   SET name = role 
   WHERE name IS NULL;

   UPDATE purchased_employees 
   SET is_active = true 
   WHERE is_active IS NULL;

   -- Verify the fix
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns 
   WHERE table_name = 'purchased_employees'
   ORDER BY ordinal_position;
   ```

4. **Click "Run"**
   - The query should complete successfully
   - Last SELECT will show all columns including `name` and `is_active`

5. **Test the Fix**
   - Go to: https://agiagentautomation.com/marketplace
   - Try purchasing an AI Employee
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Employee should appear in Workforce page

---

## 🛠️ Alternative Methods

### Method 2: Interactive HTML Tool
We've created a visual tool to help with this:

1. Open in browser: `/fix-schema-tool.html`
2. Click "Run Auto-Fix" button
3. Wait for confirmation

### Method 3: Command Line (Advanced)
If you have `psql` installed:

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT_REF].supabase.co:5432/postgres"

# Run the fix
psql "$DATABASE_URL" <<EOF
ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

ALTER TABLE purchased_employees 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE purchased_employees SET name = role WHERE name IS NULL;
UPDATE purchased_employees SET is_active = true WHERE is_active IS NULL;
EOF
```

---

## 📋 What This Does

1. **Adds `name` column** (VARCHAR(255))
   - Stores the display name of the AI Employee
   - Required by TypeScript interfaces and UI

2. **Adds `is_active` column** (BOOLEAN, default TRUE)
   - Tracks whether employee is currently active
   - Used for filtering and display logic

3. **Sets defaults for existing records**
   - Uses `role` value for `name` if NULL
   - Sets `is_active` to `true` for all existing employees

4. **Verifies the schema**
   - Shows all columns to confirm the fix worked

---

## 🎯 Why This Happened

The production Supabase database was created before these columns were added to the schema. While the code expects these columns (TypeScript interfaces, UI components, database inserts), the remote database table didn't have them yet.

**Local database**: ✅ Has the columns (from migrations)  
**Remote database**: ❌ Missing the columns  

**Solution**: Apply the schema update to remote database manually.

---

## ✅ Verification Checklist

After running the SQL, verify:

- [ ] SQL ran without errors
- [ ] `name` column appears in schema
- [ ] `is_active` column appears in schema
- [ ] Test purchase completes successfully
- [ ] Employee appears in Workforce page
- [ ] No "Failed to complete purchase" error

---

## 🆘 Still Having Issues?

If the issue persists after running the SQL:

1. **Check Netlify Logs**
   - Go to Netlify Dashboard → Functions
   - Check logs for `manual-purchase` function
   - Look for any error messages

2. **Check Browser Console**
   - Open `/workforce` page
   - Press F12 to open DevTools
   - Check Console tab for errors
   - Look for `[Workforce]` log messages

3. **Verify Supabase Connection**
   - Ensure service role key is configured in Netlify
   - Check environment variable: `SUPABASE_SERVICE_ROLE_KEY`

4. **Contact Support**
   - Share: Session ID, User ID, and error logs
   - Include: Browser console logs and Netlify function logs

---

## 📊 Current State

✅ **Code is correct**
- TypeScript interfaces include `name` and `is_active`
- Netlify functions include `employeeName` in metadata
- Manual fallback logic implemented
- Stripe checkout passes all required data

❌ **Database schema outdated**
- Remote Supabase missing columns
- This is the ONLY issue

🔧 **Fix required**: Run the SQL above ☝️

---

## Time to Fix: **~30 seconds**

Just copy the SQL, paste in Supabase SQL Editor, and click Run. That's it! 🚀

