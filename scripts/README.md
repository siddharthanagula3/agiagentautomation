# VIBE Utility Scripts

Complete set of utilities for managing VIBE database migrations, testing, and deployment.

---

## 📋 Available Scripts

### 1. Apply Migration via Netlify Function

**Script:** `apply-migration-via-netlify.ts`
**Command:** `npm run vibe:migrate`

Applies the user_id migration to vibe_messages table using the Netlify `run-sql` function.

**Features:**
- ✅ Works without local Docker/Supabase
- ✅ Uses production Netlify function
- ✅ Verifies schema changes
- ✅ Gets database statistics
- ✅ Handles errors gracefully

**Usage:**
```bash
npm run vibe:migrate
```

**Output:**
```
🚀 Applying VIBE migration via Netlify function...

📡 Calling run-sql function...
   URL: https://agiagentautomation.com/.netlify/functions/run-sql

✅ Migration applied successfully!

📊 Result: {
  "message": "Migration applied successfully",
  "messages_updated": 15
}

🔍 Verifying schema changes...
✅ Schema verification:
[
  { "column_name": "id", "data_type": "uuid", "is_nullable": "NO" },
  { "column_name": "session_id", "data_type": "uuid", "is_nullable": "NO" },
  { "column_name": "user_id", "data_type": "uuid", "is_nullable": "YES" },
  ...
]

✅ user_id column confirmed in vibe_messages table

📊 Getting database statistics...
✅ Statistics: {
  "total_messages": 150,
  "messages_with_user_id": 150,
  "total_sessions": 25,
  "total_actions": 300
}

✅ Migration complete!
```

---

### 2. Apply Migration Locally

**Script:** `apply-vibe-migration.ts`
**Command:** `tsx scripts/apply-vibe-migration.ts`

Applies migration using local Supabase instance.

**Features:**
- ✅ Uses service role key (bypasses RLS)
- ✅ Checks existing schema
- ✅ Provides SQL for manual application
- ✅ Verifies migration
- ✅ Gets table statistics

**Requirements:**
- Docker Desktop running
- Local Supabase instance: `supabase start`
- `SUPABASE_SERVICE_ROLE_KEY` environment variable

**Usage:**
```bash
# Start Supabase
supabase start

# Run migration
tsx scripts/apply-vibe-migration.ts
```

---

### 3. Test VIBE Integration

**Script:** `test-vibe-integration.ts`
**Command:** `npm run vibe:test`

Tests complete VIBE workflow end-to-end.

**Test Flow:**
1. ✅ Create test session
2. ✅ Create user message
3. ✅ Create assistant message (simulating orchestrator)
4. ✅ Log agent actions (file read, edit, command)
5. ✅ Verify all data
6. ✅ Get action statistics
7. ✅ Cleanup test data

**Usage:**
```bash
npm run vibe:test
```

**Output:**
```
🧪 Testing VIBE Integration...

Step 1: Creating test session...
✅ Session created: a1b2c3d4-...

Step 2: Creating user message...
✅ User message created: e5f6g7h8-...
   Content: Create a React component for user profiles
   User ID: user-456

Step 3: Creating assistant message...
✅ Assistant message created: i9j0k1l2-...
   Agent: code-reviewer

Step 4: Logging agent actions...
✅ Agent actions created: 3

Step 5: Verifying data...
✅ Messages verified: 2
   1. user: Create a React component for user profiles...
      user_id: ✓
   2. assistant: I'll help you create a user profile compo...
      user_id: ✓

Step 6: Getting action statistics...
📊 Action Statistics:
   Total: 3
   Completed: 3
   Failed: 0
   By Type: {
     "file_read": 1,
     "file_edit": 1,
     "command_execution": 1
   }

Step 7: Cleaning up test data...
✅ Test data cleaned up

✅ All tests passed! VIBE integration is working correctly.
```

---

### 4. Deployment Workflow

**Script:** `vibe-deployment-workflow.sh`
**Command:** `npm run vibe:deploy`

Complete deployment workflow with all checks.

**Workflow Steps:**
1. ✅ TypeScript type checking
2. ✅ Database migrations (if Supabase available)
3. ✅ Integration tests (optional)
4. ✅ Production build
5. ✅ Git commit and push
6. ✅ Auto-deploy to Netlify

**Usage:**
```bash
npm run vibe:deploy
```

**Output:**
```
🚀 VIBE Deployment Workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Running TypeScript type check...
✅ Type checking passed

Step 2: Applying database migrations...
✅ Database migrations applied

Step 3: Testing VIBE integration...
⚠️  Integration tests available (run with: tsx scripts/test-vibe-integration.ts)

Step 4: Building project...
✅ Build completed successfully

Step 5: Deploying to Netlify...
   Changes detected, committing...
✅ Pushed to GitHub - Netlify will auto-deploy

📊 Deployment Info:
   Site: https://agiagentautomation.com
   Netlify Dashboard: https://app.netlify.com/projects/jocular-shortbread-1c7967

Step 6: Monitor deployment...
⚠️  Check Netlify deployment status:
   Dashboard: https://app.netlify.com/projects/jocular-shortbread-1c7967/deploys
   Or use: netlify watch

✅ Deployment workflow complete!

🎯 Next Steps:
   1. Verify migration applied: Check Supabase Dashboard
   2. Test VIBE at: https://agiagentautomation.com/vibe
   3. Monitor agent actions in real-time
   4. Check deployment logs if issues occur
```

---

## 🚀 Quick Start

### Option 1: Use Netlify Function (Recommended)

Works without local setup:

```bash
npm run vibe:migrate
```

### Option 2: Local Development

With Docker Desktop:

```bash
# Start Supabase
supabase start

# Apply migration
tsx scripts/apply-vibe-migration.ts

# Test integration
npm run vibe:test
```

### Option 3: Manual Application

Via Supabase Dashboard:

1. Go to Supabase Dashboard > SQL Editor
2. Paste migration SQL from `supabase/migrations/20251116000002_add_user_id_to_vibe_messages.sql`
3. Execute

---

## 📊 Verification

After applying migration, verify with:

```bash
# Test complete integration
npm run vibe:test

# Or check manually via Supabase Dashboard
```

**What to verify:**
- ✅ `user_id` column exists in `vibe_messages` table
- ✅ `idx_vibe_messages_user` index created
- ✅ Existing messages have `user_id` populated
- ✅ New messages can be created with `user_id`
- ✅ Real-time subscriptions working

---

## 🔧 Troubleshooting

### Migration fails with "permission denied"

**Solution:** Use service role key instead of anon key
```bash
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"
tsx scripts/apply-vibe-migration.ts
```

### Docker not running

**Solution:** Use Netlify function method
```bash
npm run vibe:migrate
```

### Type check fails

**Solution:** Fix TypeScript errors first
```bash
npm run type-check
# Fix reported errors
```

### Build fails

**Solution:** Check console errors
```bash
npm run build
# Review error messages
```

### Netlify function not found

**Solution:** Deploy functions first
```bash
npm run build
git push origin main
# Wait for Netlify deployment
```

---

## 📝 Environment Variables

### Required for Scripts

**Local Development:**
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key
```

**Production (via Netlify function):**
```env
# No local env vars needed
# Uses deployed Netlify function
```

---

## 🏗️ Architecture

### Migration Flow

```
┌─────────────────────────────────────────┐
│ npm run vibe:migrate                    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ apply-migration-via-netlify.ts          │
│ - Calls Netlify run-sql function       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Netlify Function: run-sql               │
│ - Executes SQL via service role        │
│ - Bypasses RLS                          │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Supabase Database                       │
│ - Applies schema changes                │
│ - Creates index                         │
│ - Updates existing rows                 │
└─────────────────────────────────────────┘
```

### Test Flow

```
┌─────────────────────────────────────────┐
│ npm run vibe:test                       │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ test-vibe-integration.ts                │
│ 1. Create session                       │
│ 2. Create messages                      │
│ 3. Log agent actions                    │
│ 4. Verify data                          │
│ 5. Cleanup                              │
└─────────────────────────────────────────┘
```

---

## 📚 Related Documentation

- **Implementation Guide:** `VIBE_IMPLEMENTATION_GUIDE.md`
- **VIBE README:** `src/features/vibe/README.md`
- **Service APIs:** `src/features/vibe/services/`
- **React Hooks:** `src/features/vibe/hooks/`
- **Examples:** `src/features/vibe/examples/`

---

## 🎯 Next Steps After Migration

1. **Verify deployment** at https://agiagentautomation.com/vibe
2. **Test message flow:**
   - Send user message
   - Verify workforce orchestrator call
   - Check agent action logging
   - Monitor real-time updates
3. **Review statistics:**
   - Check Supabase Dashboard
   - Monitor agent actions table
   - Verify message delivery
4. **Update agent code** to log actions:
   ```typescript
   import { VibeAgentActionService } from '@features/vibe/services';

   await VibeAgentActionService.logFileEdit({
     sessionId,
     agentName: 'code-reviewer',
     filePath: 'src/App.tsx',
     changes: 'Added error boundary'
   });
   ```

---

## 🆘 Support

If you encounter issues:

1. Check this README
2. Review `VIBE_IMPLEMENTATION_GUIDE.md`
3. Check Supabase Dashboard for errors
4. Review Netlify function logs
5. Run test script: `npm run vibe:test`
