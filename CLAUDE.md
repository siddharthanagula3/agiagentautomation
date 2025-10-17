# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AGI Agent Automation Platform - A comprehensive AI workforce management system that enables hiring, managing, and coordinating AI employees for various business tasks. The platform implements a sophisticated Plan-Delegate-Execute orchestration pattern for autonomous multi-agent workflows.

## Development Commands

### Essential Commands

```bash
# Development
npm run dev                  # Start Vite dev server (port 5173)
npm run build               # Production build
npm run build:prod          # Production build with optimizations
npm run preview             # Preview production build

# Code Quality
npm run lint                # Run ESLint
npm run type-check          # TypeScript type checking (must pass before deployment)
npm run format              # Format code with Prettier
npm run format:check        # Check formatting

# Testing
npm run test                # Run Vitest unit tests
npm run test:ui             # Run tests with UI
npm run test:run            # Single test run (for CI)
npm run test:coverage       # Generate coverage report
npm run e2e                 # Run Playwright E2E tests
npm run e2e:ui              # E2E tests with UI
npm run e2e:debug           # Debug E2E tests

# Local Development
supabase start              # Start local Supabase (port 54321, Studio: 54323)
netlify dev                 # Start Netlify functions (port 8888)
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

## Architecture

### Core Architectural Patterns

**1. Plan-Delegate-Execute Orchestration**

- **Planning Stage**: LLM analyzes user requests and generates structured JSON execution plans
- **Delegation Stage**: Automatically selects optimal AI employees based on task requirements and employee capabilities
- **Execution Stage**: Tasks execute in parallel with real-time status updates via Zustand stores

**2. File-Based AI Employee System**

- AI employees defined as markdown files in `.agi/employees/*.md`
- YAML frontmatter contains: name, description, tools, model
- System prompt in markdown body
- Dynamically loaded via `import.meta.glob` and parsed with `gray-matter`
- Hot-reloadable without code changes

**3. State Management Architecture**

- **mission-store.ts**: Mission control state (tasks, active employees, real-time messages)
- **workforce-store.ts**: Hired employees from database (purchased employees, user workforce)
- Clean separation prevents state conflicts between mission execution and workforce management

**4. Multi-Provider LLM Integration**

- Unified interface via `unified-llm-service.ts`
- Supports: OpenAI, Anthropic (Claude), Google (Gemini), Perplexity
- Provider-specific optimizations in `system-prompts-service.ts`
- Automatic model selection and fallbacks

### Directory Structure

```
src/
├── _core/                          # Core business logic
│   ├── api/                        # API services and integrations
│   │   ├── llm/                   # LLM provider implementations
│   │   │   ├── unified-llm-service.ts      # Main LLM interface
│   │   │   ├── anthropic-provider.ts
│   │   │   ├── openai-provider.ts
│   │   │   └── google-provider.ts
│   │   ├── system-prompts-service.ts       # System prompts + employee loader
│   │   └── ai-employee-service.ts          # Employee management
│   ├── orchestration/              # Multi-agent orchestration
│   │   ├── workforce-orchestrator-refactored.ts  # Main orchestrator
│   │   ├── tool-manager.ts                       # Tool execution
│   │   └── reasoning/                            # Planning & delegation
│   ├── security/                   # Authentication & authorization
│   │   └── auth-service.ts         # Supabase auth wrapper
│   ├── storage/                    # Data persistence
│   │   └── supabase/               # Supabase services
│   └── types/                      # Core type definitions
│       └── ai-employee.ts          # AIEmployee interface
│
├── features/                       # Feature modules
│   ├── mission-control/            # Mission control UI
│   │   ├── components/
│   │   │   ├── WorkforceStatusPanel.tsx    # Real-time employee status
│   │   │   ├── MissionLogEnhanced.tsx      # Task plan + activity feed
│   │   │   └── StandardChat.tsx            # Simple 1:1 chat
│   │   └── pages/
│   │       ├── MissionControlPageRefactored.tsx  # Main orchestration UI
│   │       └── ChatPageSimplified.tsx            # Simple chat interface
│   ├── workforce/                  # Employee hiring & management
│   ├── marketplace/                # AI employee marketplace
│   ├── billing/                    # Stripe integration
│   └── settings/                   # User settings
│
├── shared/                         # Shared utilities
│   ├── stores/                     # Zustand state stores
│   │   ├── mission-store.ts        # Mission control state (CRITICAL)
│   │   ├── workforce-store.ts      # Hired employees state
│   │   └── unified-auth-store.ts   # Authentication state
│   ├── hooks/                      # React hooks
│   ├── lib/                        # Utility libraries
│   │   ├── supabase-client.ts      # Supabase singleton
│   │   └── utils.ts                # Common utilities
│   └── types/                      # Shared type definitions
│
└── .agi/                           # AI employee definitions
    └── employees/                  # Employee markdown files
        ├── code-reviewer.md
        └── debugger.md
```

### Path Aliases (tsconfig.json)

```typescript
"@/*"          → "./src/*"
"@features/*"  → "./src/features/*"
"@_core/*"     → "./src/_core/*"
"@shared/*"    → "./src/shared/*"
```

Always use path aliases for imports. Never use relative paths across feature boundaries.

## Critical Implementation Details

### 1. Mission Store (Real-Time State)

Located: `src/shared/stores/mission-store.ts`

The mission store is the **single source of truth** for all mission control operations. It uses Zustand with Immer middleware for immutable updates.

**Key Actions:**

```typescript
setMissionPlan(tasks); // Set execution plan
updateTaskStatus(id, status); // Update task progress
updateEmployeeStatus(name, status, tool, task); // Update employee state
addEmployeeLog(name, entry); // Add log entry
addMessage(message); // Add to activity feed
startMission(id) / completeMission() / failMission(error);
```

**State Structure:**

- `missionPlan: Task[]` - Current execution plan
- `activeEmployees: Map<string, ActiveEmployee>` - Real-time employee status
- `messages: MissionMessage[]` - Activity feed
- `missionStatus: 'idle' | 'planning' | 'executing' | 'completed' | 'failed'`

### 2. Workforce Orchestrator

Located: `src/_core/orchestration/workforce-orchestrator-refactored.ts`

Implements the three-stage execution pattern:

```typescript
// STAGE 1: PLANNING
const plan = await generatePlan(userInput);
// Returns: { plan: [{ task, tool_required }], reasoning }

// STAGE 2: DELEGATION
for (const task of tasks) {
  const employee = await selectOptimalEmployee(task);
  assignEmployeeToTask(task.id, employee);
}

// STAGE 3: EXECUTION
await executeTasks(tasks, originalInput);
// Each task executes with employee's custom system prompt
```

The orchestrator:

- Loads employees from `.agi/employees/` via `systemPromptsService.getAvailableEmployees()`
- Matches tasks to employees based on description keywords and tool requirements
- Updates mission-store in real-time at each stage
- Handles errors gracefully with fallback strategies

### 3. AI Employee System

**Creating New Employees:**

Add a new `.md` file to `.agi/employees/`:

```markdown
---
name: employee-name
description: Brief role description
tools: Read, Grep, Glob, Bash, Edit, Write
model: inherit
---

You are a [role description].

[Detailed system prompt with instructions, guidelines, and examples]
```

**Loading Employees:**

```typescript
import { systemPromptsService } from '@_core/api/system-prompts-service';

const employees = await systemPromptsService.getAvailableEmployees();
// Returns: AIEmployee[] with { name, description, tools[], model, systemPrompt }
```

**Important:** The file-based system uses Vite's `import.meta.glob()` which only works with literal strings. The glob pattern is hardcoded as `'/../.agi/employees/*.md'`.

### 4. Database Schema (Supabase)

**Key Tables:**

- `users` - User accounts via Supabase Auth
- `user_profiles` - Extended user data with RLS policies
- `purchased_employees` - User's hired AI employees (links users → ai_employees)
- `ai_employees` - Available employees in marketplace
- `chat_sessions` / `chat_messages` - Chat history with RLS
- `user_subscriptions` - Stripe subscription tracking
- `webhook_audit_log` - Stripe webhook event tracking

**Row Level Security (RLS):**
All tables have RLS policies. Users can only access their own data. The `service_role` key bypasses RLS and should **never** be exposed to the client.

**Running Migrations:**

```bash
supabase db reset              # Reset and apply all migrations
supabase migration new name    # Create new migration
```

### 5. Netlify Functions

Located: `netlify/functions/`

**Key Functions:**

- `anthropic-proxy.ts` / `openai-proxy.ts` / `google-proxy.ts` - API key proxies (keeps keys secure)
- `stripe-webhook.ts` - Handles Stripe events (subscription lifecycle)
- `create-pro-subscription.ts` - Creates Stripe checkout session
- `agents-execute.ts` - Server-side agent execution
- `run-sql.ts` - Admin SQL execution (requires auth)

**Local Testing:**

```bash
netlify dev                    # Runs functions at localhost:8888
curl -X POST http://localhost:8888/.netlify/functions/anthropic-proxy \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

### 6. Testing Strategy

**Unit Tests (Vitest):**

- Test individual functions and utilities
- Located in `*.test.ts` files next to source
- Use `vi.mock()` to mock dependencies
- Run with `npm run test`

**E2E Tests (Playwright):**

- Test complete user flows
- Located in `e2e/` directory
- Run with `npm run e2e`
- Requires dev server running

**Integration Tests:**

- Test service layer interactions
- Mock Supabase and LLM providers
- Focus on critical paths: auth, chat, orchestration

### 7. Environment Variables

**Required for Development:**

```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local_anon_key>
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional (for LLM features)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=...
VITE_PERPLEXITY_API_KEY=...
```

**CRITICAL:** Never commit `.env` files. API keys should only be in environment variables or Netlify Functions (server-side).

## API Compatibility

### Unified LLM Service - Dual API Support

The `unifiedLLMService.sendMessage()` method supports two calling conventions for backwards compatibility:

**New API (Parameter-based):**

```typescript
await unifiedLLMService.sendMessage(
  messages: UnifiedMessage[],
  sessionId?: string,
  userId?: string,
  provider?: LLMProvider
);
```

**Old API (Object-based):**

```typescript
await unifiedLLMService.sendMessage({
  provider?: LLMProvider,
  messages: UnifiedMessage[],
  model?: string,
  sessionId?: string,
  userId?: string,
  temperature?: number,
  maxTokens?: number
});
```

Both styles work correctly. The implementation detects which style is being used via `Array.isArray()` check and handles parameters accordingly.

## Common Development Tasks

### Adding a New AI Employee

1. Create `src/.agi/employees/new-employee.md`:

```markdown
---
name: new-employee
description: Specialist in X
tools: Read, Write, Bash
model: inherit
---

You are a specialist in X...
```

2. The employee is automatically available after page refresh (hot-reload)

3. Test in Mission Control: Navigate to `/mission-control`, submit a task matching the employee's specialty

### Adding a New Feature Module

1. Create feature directory: `src/features/feature-name/`
2. Add subdirectories: `components/`, `pages/`, `services/`, `hooks/`
3. Create page component: `src/features/feature-name/pages/FeaturePage.tsx`
4. Add route in `src/App.tsx`:

```typescript
const FeaturePage = lazyWithRetry(() => import('@features/feature-name/pages/FeaturePage'));

// Inside routes:
<Route path="/feature-name" element={<FeaturePage />} />
```

5. Update navigation in `src/layouts/AppLayout.tsx`

### Modifying the Orchestrator

The orchestrator is critical infrastructure. When modifying:

1. **Never break the three-stage pattern** (Plan → Delegate → Execute)
2. **Always update mission-store** at each stage for UI updates
3. **Handle errors gracefully** - failed tasks should not crash the mission
4. **Test with real LLM calls** - the orchestrator's prompt engineering is critical
5. **Consider parallel execution** - tasks can run concurrently if they don't depend on each other

Key file: `src/_core/orchestration/workforce-orchestrator-refactored.ts`

### Working with Supabase

**Local Development:**

```bash
supabase start                      # Start all services
supabase status                     # Check running services
supabase db reset                   # Reset database
supabase functions serve            # Serve edge functions
```

**Database Access:**

- Studio UI: http://localhost:54323
- Direct connection: `postgresql://postgres:postgres@localhost:54322/postgres`

**Creating Tables:**

1. Create migration: `supabase migration new add_table_name`
2. Write SQL in `supabase/migrations/<timestamp>_add_table_name.sql`
3. Apply: `supabase db reset`
4. Update TypeScript types: `supabase gen types typescript --local > src/shared/types/supabase.ts`

### Debugging

**Common Issues:**

1. **Type errors after adding new features:**
   - Run `npm run type-check` to see all errors
   - Fix imports and type definitions
   - Ensure path aliases are used correctly

2. **Build fails with import errors:**
   - Check that file-based imports use correct paths
   - Verify `import.meta.glob()` patterns are literal strings
   - Ensure all dynamic imports are in `lazyWithRetry()`

3. **Mission orchestration not working:**
   - Check browser console for employee loading errors
   - Verify `.agi/employees/*.md` files have correct frontmatter
   - Test `systemPromptsService.getAvailableEmployees()` in console
   - Check mission-store state in Redux DevTools

4. **Supabase RLS blocking queries:**
   - Verify user is authenticated: `supabase.auth.getUser()`
   - Check RLS policies in Supabase Studio
   - Use `service_role` key for admin operations (server-side only)

5. **Stripe webhooks failing:**
   - Ensure Stripe CLI is running: `stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook`
   - Check webhook signature verification in `stripe-webhook.ts`
   - Verify `STRIPE_WEBHOOK_SECRET` environment variable

## Performance Considerations

- **Code splitting:** Uses Vite's automatic chunking + manual chunks for vendor libraries
- **Lazy loading:** All routes use `lazyWithRetry()` wrapper for resilient loading
- **Optimized re-renders:** Mission store uses selector hooks to prevent unnecessary re-renders
- **Debounced inputs:** User inputs in chat use debouncing to reduce API calls
- **Caching:** System prompts service caches prompts for 1 hour

## Security Notes

1. **API Keys:** All LLM API keys must be proxied through Netlify Functions. Never expose keys to client.
2. **RLS Policies:** Every Supabase table must have RLS policies. Test with `supabase db test`.
3. **Input Validation:** Validate all user inputs on both client and server (Zod schemas).
4. **Authentication:** Use `unified-auth-store.ts` as single source of truth for auth state.
5. **Webhook Security:** Stripe webhooks must verify signatures. Check `webhook_audit_log` table for event history.

## Build & Deployment

**Production Build:**

```bash
npm run type-check              # Must pass with 0 errors
npm run build:prod              # Creates optimized build in dist/
```

**Build Output:**

- Main bundle: ~650KB gzipped
- Code splitting: ~60 chunks
- Vendor chunks: react, router, ui, supabase, ai-vendor
- Build time: ~40-50 seconds

**Deployment (Netlify):**

1. Push to main branch
2. Netlify auto-builds and deploys
3. Set environment variables in Netlify dashboard
4. Configure Stripe webhook endpoint in production

**Pre-deployment Checklist:**

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:run` passes
- [ ] `npm run build` succeeds
- [ ] All environment variables configured in Netlify
- [ ] Supabase migrations applied to production
- [ ] Stripe webhooks configured for production URL

## Key Principles

1. **Type Safety First:** All code must pass TypeScript strict mode checks
2. **Path Aliases Always:** Use `@features/`, `@_core/`, `@shared/` - never relative paths across modules
3. **Immutable State:** Use Immer middleware in Zustand stores for safe updates
4. **Error Boundaries:** Wrap async operations in try-catch, surface errors to users
5. **Real-Time Updates:** Mission store updates trigger immediate UI re-renders
6. **File-Based Configuration:** Prefer configuration files over hardcoded values
7. **Test Coverage:** Write tests for all business logic and critical paths
