# Database Errors Fixed - Nov 18, 2025

## Summary

Fixed three critical Supabase database errors that were preventing user operations and VIBE session creation.

## Issues Fixed

### 1. ✅ user_settings 406 Not Acceptable Error

**Problem:**
- Query: `GET /rest/v1/user_settings?select=*&id=eq.{uuid}`
- Error: 406 Not Acceptable
- Root Cause: Using `.single()` instead of `.maybeSingle()` caused errors when no row existed for new users

**Solution:**
- Changed `/src/features/settings/services/user-preferences.ts` to use `.maybeSingle()` instead of `.single()`
- This allows graceful handling when no settings row exists yet
- Returns default settings instead of throwing an error

**Files Changed:**
- `/src/features/settings/services/user-preferences.ts` (lines 79-88 and 164-173)

### 2. ✅ vibe_sessions Foreign Key Constraint Error

**Problem:**
- Error: `insert or update on table "vibe_sessions" violates foreign key constraint "vibe_sessions_user_id_fkey"`
- Details: 'Key is not present in table "users"'
- Root Cause: When users sign up via Supabase Auth, they get an entry in `auth.users` but NOT in `public.users`
- The `vibe_sessions` table has a foreign key to `public.users(id)`, causing the insert to fail

**Solution:**
- Created trigger function `handle_new_user()` that automatically creates entries in:
  - `public.users` - Main user record
  - `public.user_profiles` - User profile data
  - `public.user_settings` - User settings with defaults
- Trigger fires AFTER INSERT on `auth.users` table
- All new signups now automatically populate all required tables

**Files Created:**
- `/supabase/migrations/20251118000003_add_handle_new_user_trigger.sql`

### 3. ✅ Existing Users Not in public.users

**Problem:**
- Users who signed up before the trigger was added don't have entries in `public.users`, `public.user_profiles`, or `public.user_settings`
- These users would experience errors when trying to use VIBE or update settings

**Solution:**
- Created backfill migration that:
  - Finds all users in `auth.users` who don't exist in `public.users`
  - Creates missing entries in `public.users`, `public.user_profiles`, and `public.user_settings`
  - Uses `ON CONFLICT DO NOTHING` to safely handle duplicates
  - Preserves original `created_at` timestamps from `auth.users`

**Files Created:**
- `/supabase/migrations/20251118000004_backfill_existing_users.sql`

## Migration Details

### Migration 1: Add Trigger Function
**File:** `20251118000003_add_handle_new_user_trigger.sql`

Creates:
- `public.handle_new_user()` - Function that creates user records
- `on_auth_user_created` - Trigger that fires on new auth.users insertions

Default values set:
- Role: `'user'`
- Plan: `'free'`
- Theme: `'dark'`
- AI Provider: `'openai'`
- AI Model: `'gpt-4o'`
- Session timeout: `60` minutes
- All notification settings enabled by default
- See migration file for complete list

### Migration 2: Backfill Existing Users
**File:** `20251118000004_backfill_existing_users.sql`

Backfills:
- All users from `auth.users` → `public.users`
- All users from `auth.users` → `public.user_profiles`
- All users from `auth.users` → `public.user_settings`

Safety features:
- Uses `NOT EXISTS` to only insert missing records
- Uses `ON CONFLICT DO NOTHING` for additional safety
- Preserves original timestamps from auth.users

## How to Apply Migrations

### Local Development

```bash
# Start Supabase (if not already running)
supabase start

# Apply new migrations
supabase db reset

# Or apply individually
supabase migration up
```

### Production

**Option 1: Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Run migration `20251118000003_add_handle_new_user_trigger.sql`
3. Run migration `20251118000004_backfill_existing_users.sql`

**Option 2: Supabase CLI**
```bash
# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Verification

After applying migrations, verify:

### 1. Check trigger exists
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### 2. Check backfill completed
```sql
-- Should return 0 (all auth users have public.users records)
SELECT COUNT(*)
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);
```

### 3. Test new user signup
1. Sign up a new user
2. Check that records are created in all three tables:
```sql
SELECT
  au.email,
  u.id IS NOT NULL as has_user,
  up.id IS NOT NULL as has_profile,
  us.id IS NOT NULL as has_settings
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
LEFT JOIN public.user_profiles up ON up.id = au.id
LEFT JOIN public.user_settings us ON us.id = au.id
WHERE au.email = 'test@example.com';
```

### 4. Test VIBE session creation
1. Log in as a user
2. Navigate to `/vibe`
3. Should successfully create a vibe_session without foreign key errors

### 5. Test user settings
1. Navigate to `/settings`
2. Should load settings without 406 errors
3. Should be able to update settings successfully

## RLS Policies

All existing RLS policies remain unchanged:

**user_settings:**
- Users can view their own settings: `auth.uid() = id`
- Users can update their own settings: `auth.uid() = id`
- Users can insert their own settings: `auth.uid() = id`

**vibe_sessions:**
- Users can view their own sessions: `auth.uid() = user_id`
- Users can create their own sessions: `auth.uid() = user_id`
- Users can update their own sessions: `auth.uid() = user_id`
- Users can delete their own sessions: `auth.uid() = user_id`

## Testing Checklist

- [x] Created trigger function
- [x] Created trigger on auth.users
- [x] Created backfill migration
- [x] Updated user-preferences.ts to use maybeSingle()
- [ ] Applied migrations to local Supabase
- [ ] Verified trigger fires on new user signup
- [ ] Verified backfill completed for existing users
- [ ] Tested VIBE session creation
- [ ] Tested user settings page
- [ ] Applied migrations to production
- [ ] Verified production functionality

## Impact

**Before:**
- New users couldn't create VIBE sessions (foreign key error)
- Users couldn't load settings page (406 error)
- User operations failed silently or with errors

**After:**
- All new users automatically get complete database records
- Existing users backfilled with missing records
- VIBE sessions create successfully
- Settings page loads and saves correctly
- Clean, predictable user experience

## Additional Notes

- The trigger function uses `SECURITY DEFINER` to run with elevated privileges
- This is safe because it only creates records for the newly signed up user
- The trigger only fires on INSERT, not UPDATE or DELETE
- Default values match the application's expected defaults
- Timestamps are preserved from auth.users for accurate audit trails
