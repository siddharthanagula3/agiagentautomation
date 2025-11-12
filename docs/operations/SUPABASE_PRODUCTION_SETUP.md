# Supabase Production Setup Guide

## Overview

This guide explains how to configure Supabase for production deployment. All configurations focus on production URLs and settings.

## Required Environment Variables

### In Netlify Dashboard (Site Settings → Environment Variables):

**Supabase Configuration:**

- `VITE_SUPABASE_URL` - Your production Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only, never expose to client)

### Getting Your Supabase Credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **AGI Automation LLC**
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Set as `VITE_SUPABASE_URL`
   - **anon/public key** → Set as `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → Set as `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Database Migrations

All migrations have been applied to the production database. The following tables are available:

- `user_shortcuts` - Custom prompt shortcuts
- `public_artifacts` - Artifact gallery
- `token_transactions` - Token transaction audit trail
- `users.token_balance` - User token balance column
- `users.subscription_start_date` - Subscription start date column

## Verification

### Check Database Connection:

1. Deploy your application to Netlify
2. Check browser console for any Supabase connection errors
3. Verify authentication works by logging in

### Verify Tables Exist:

Run this query in Supabase SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_shortcuts', 'public_artifacts', 'token_transactions')
ORDER BY table_name;
```

Should return 3 rows.

### Verify RLS Policies:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_shortcuts', 'public_artifacts', 'token_transactions')
ORDER BY tablename;
```

All should show `rowsecurity = true`.

### Verify Functions:

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%token%' OR routine_name LIKE '%artifact%')
ORDER BY routine_name;
```

Should return:

- `update_user_token_balance`
- `increment_artifact_views`
- `increment_artifact_likes`

## Security Notes

- **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the client
- **Use `VITE_SUPABASE_ANON_KEY`** for client-side operations
- **RLS policies** are enabled on all tables - users can only access their own data
- **Service role key** bypasses RLS - only use in server-side Netlify Functions

## Troubleshooting

### Connection Errors:

1. Verify `VITE_SUPABASE_URL` is correct (should start with `https://`)
2. Check `VITE_SUPABASE_ANON_KEY` is set correctly
3. Verify your Supabase project is active and not paused

### RLS Blocking Queries:

1. Ensure user is authenticated: `supabase.auth.getUser()`
2. Check RLS policies in Supabase Dashboard → Authentication → Policies
3. For admin operations, use service role key in Netlify Functions only

### Migration Issues:

If tables are missing:

1. Go to Supabase Dashboard → Database → Migrations
2. Verify all migrations are applied
3. If needed, run: `supabase db push` (requires Supabase CLI)

## Next Steps

After configuring Supabase:

1. ✅ Set environment variables in Netlify
2. ✅ Deploy application
3. ✅ Test authentication flow
4. ✅ Verify database queries work
5. ✅ Test token system and artifact gallery
