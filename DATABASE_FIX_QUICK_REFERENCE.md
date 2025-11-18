# Database Fix Quick Reference

## What Was Fixed

| Error                                  | Root Cause                                     | Fix                                       |
| -------------------------------------- | ---------------------------------------------- | ----------------------------------------- |
| `user_settings 406 Not Acceptable`     | Using `.single()` when row might not exist     | Changed to `.maybeSingle()`               |
| `vibe_sessions foreign key constraint` | User in `auth.users` but not in `public.users` | Added trigger to auto-create user records |
| `Existing users missing records`       | Users signed up before trigger existed         | Backfill migration                        |

## Files Changed

### Code Changes

- `/src/features/settings/services/user-preferences.ts`
  - Line 83: Changed `.single()` → `.maybeSingle()`
  - Line 168: Changed `.single()` → `.maybeSingle()`

### New Migrations

1. `/supabase/migrations/20251118000003_add_handle_new_user_trigger.sql`
   - Creates `handle_new_user()` function
   - Creates `on_auth_user_created` trigger
   - Automatically populates `public.users`, `user_profiles`, `user_settings`

2. `/supabase/migrations/20251118000004_backfill_existing_users.sql`
   - Backfills existing users from `auth.users`
   - Creates missing records in all three tables

## Quick Apply

### Option 1: Using Script

```bash
./scripts/apply-database-fixes.sh
# Follow prompts to choose local or production
```

### Option 2: Manual (Local)

```bash
supabase start
supabase migration up
```

### Option 3: Manual (Production)

```bash
# Via Supabase Dashboard SQL Editor
# Copy and run each migration file
```

## Verification Commands

### Check trigger exists

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Check all users backfilled

```sql
-- Should return 0
SELECT COUNT(*) FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = au.id);
```

### Test new user creation

```sql
-- Sign up a new user, then check:
SELECT au.email,
  EXISTS(SELECT 1 FROM public.users WHERE id = au.id) as has_user,
  EXISTS(SELECT 1 FROM public.user_profiles WHERE id = au.id) as has_profile,
  EXISTS(SELECT 1 FROM public.user_settings WHERE id = au.id) as has_settings
FROM auth.users au
ORDER BY au.created_at DESC LIMIT 1;
```

## Impact

### Before

- ❌ VIBE sessions fail to create
- ❌ Settings page throws 406 errors
- ❌ Inconsistent user data

### After

- ✅ VIBE sessions create successfully
- ✅ Settings page loads without errors
- ✅ All users have complete records
- ✅ New signups automatically populate all tables

## Rollback (if needed)

If you need to rollback:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: Backfilled data is safe to keep
-- Only remove if specifically needed
```

Then revert code changes in `user-preferences.ts`:

- Change `.maybeSingle()` back to `.single()`
- Add back PGRST116 error handling

## Support

For detailed information, see:

- `DATABASE_ERRORS_FIXED.md` - Complete documentation
- Migration files in `/supabase/migrations/`
- Code changes in `/src/features/settings/services/user-preferences.ts`
