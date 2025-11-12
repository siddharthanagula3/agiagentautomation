# Apply Supabase Migrations - Step by Step Guide

## 📋 Migrations to Apply

You need to apply 5 migrations in order. Copy and paste each SQL file content into Supabase Dashboard SQL Editor.

## 🔧 How to Apply

### Step 1: Open Supabase Dashboard

1. Go to: https://app.supabase.com
2. Select project: **AGI Automation LLC**
3. Click **SQL Editor** in the left sidebar

### Step 2: Apply Each Migration

For each migration below:
1. Open the migration file
2. Copy ALL the SQL content
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for success message
6. Move to next migration

## 📝 Migration Files (Apply in Order)

### 1. User Shortcuts Table
**File**: `supabase/migrations/20250111000001_add_user_shortcuts_table.sql`

Creates:
- `user_shortcuts` table
- RLS policies
- Indexes
- Triggers

### 2. Public Artifacts Table
**File**: `supabase/migrations/20250111000002_add_public_artifacts_table.sql`

Creates:
- `public_artifacts` table
- RLS policies
- Indexes (including full-text search)
- Functions: `increment_artifact_views()`, `increment_artifact_likes()`

### 3. Token System
**File**: `supabase/migrations/20250111000003_add_token_system.sql`

Creates:
- `users.token_balance` column
- `token_transactions` table
- Functions: `update_user_token_balance()`, `get_user_token_balance()`, `get_user_transaction_history()`

### 4. Subscription Start Date
**File**: `supabase/migrations/20250111000004_add_subscription_start_date.sql`

Creates:
- `users.subscription_start_date` column

### 5. Update Pro Pricing
**File**: `supabase/migrations/20250112000001_update_pro_pricing.sql`

Updates:
- Pro plan `price_monthly` = $29.00
- Pro plan `price_yearly` = $299.88

## ✅ Verification

After applying all migrations, run:

```bash
npx tsx scripts/verify-supabase-stripe.ts
```

Should show all ✅ green checks for Supabase.

## 🆘 Troubleshooting

### Error: "relation already exists"
- The table/column already exists - this is OK, the migration uses `IF NOT EXISTS`
- Continue to next migration

### Error: "permission denied"
- Make sure you're using the SQL Editor (not a restricted user)
- Check you're in the correct project

### Error: "syntax error"
- Check you copied the entire SQL file
- Make sure no lines were cut off
- Try running one statement at a time

## 📊 Expected Results

After all migrations:
- ✅ `user_shortcuts` table exists
- ✅ `public_artifacts` table exists
- ✅ `token_transactions` table exists
- ✅ `users.token_balance` column exists
- ✅ `users.subscription_start_date` column exists
- ✅ Pro plan pricing: $29/month, $299.88/year

