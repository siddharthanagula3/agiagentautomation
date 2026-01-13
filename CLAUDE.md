# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AGI Agent Automation Platform - A comprehensive AI workforce management system that enables hiring, managing, and coordinating AI employees for various business tasks. The platform implements a **Plan-Delegate-Execute** orchestration pattern for autonomous multi-agent workflows.

## Development Commands

```bash
# Development
npm run dev                  # Start Vite dev server (port 5173)
npm run build               # Production build
npm run build:prod          # Production build with optimizations

# Code Quality (run before commits)
npm run lint                # Run ESLint
npm run type-check          # TypeScript checking (must pass before deployment)
npm run format              # Format with Prettier

# Testing
npm run test                # Run Vitest unit tests (watch mode)
npm run test:run            # Single test run (CI)
npx vitest run path/to/file # Run specific test file
npm run e2e                 # Run Playwright E2E tests
npm run e2e:debug           # Debug E2E tests interactively

# Local Development Stack
supabase start              # Start local Supabase (port 54321, Studio: 54323)
netlify dev                 # Start Netlify functions (port 8888)
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# Database
supabase db reset           # Reset and apply all migrations
supabase migration new name # Create new migration
supabase gen types typescript --local > src/shared/types/supabase.ts

# Vibe-specific
npm run vibe:migrate        # Apply migrations via Netlify
npm run vibe:test           # Test Vibe integration
npm run vibe:deploy         # Deploy Vibe workflow
```

## Architecture

### Core Patterns

**1. Plan-Delegate-Execute Orchestration** (`src/core/ai/orchestration/workforce-orchestrator.ts`)
- **Planning**: LLM analyzes requests → generates structured JSON execution plans
- **Delegation**: Auto-selects optimal AI employees based on task requirements
- **Execution**: Tasks run in parallel with real-time status updates via Zustand

**2. File-Based AI Employee System** (`.agi/employees/*.md`)
- Employees defined as markdown files with YAML frontmatter (name, description, tools, model)
- System prompt in markdown body
- Loaded via `import.meta.glob('/.agi/employees/*.md')` and parsed with `gray-matter`
- Hot-reloadable without code changes

**3. State Management** (Zustand + Immer)
- `mission-control-store.ts` - Mission execution state (tasks, active employees, messages)
- `employee-management-store.ts` - Hired employees from database
- Clean separation prevents state conflicts

**4. Multi-Provider LLM Integration** (`src/core/ai/llm/unified-language-model.ts`)
- Unified interface supporting: OpenAI, Anthropic, Google, Perplexity, Grok, DeepSeek, Qwen
- Provider-specific implementations in `src/core/ai/llm/providers/`
- Token enforcement via `@core/billing/token-enforcement-service`
- Security: prompt injection detection (`@core/security/`), API abuse prevention, rate limiting

### Directory Structure

```
src/
├── core/                    # Core business logic
│   ├── ai/
│   │   ├── llm/            # LLM providers (unified-language-model.ts)
│   │   ├── employees/      # Employee management (prompt-management.ts)
│   │   ├── orchestration/  # Multi-agent orchestration (workforce-orchestrator.ts)
│   │   └── tools/          # Tool execution engine
│   ├── auth/               # Authentication
│   ├── integrations/       # External services (chat, media, search)
│   └── storage/            # Database, cache, Supabase services
│
├── features/               # Feature modules
│   ├── vibe/              # /vibe - Standalone AI coding workspace
│   ├── chat/              # /chat - Multi-agent chat (inside dashboard)
│   ├── mission-control/   # Mission orchestration UI
│   ├── workforce/         # Employee hiring & management
│   ├── marketplace/       # AI employee marketplace
│   ├── billing/           # Stripe integration
│   └── settings/          # User preferences
│
├── shared/                 # Shared utilities
│   ├── stores/            # Zustand state stores
│   ├── hooks/             # React hooks
│   ├── lib/               # Utilities (supabase-client.ts)
│   └── types/             # TypeScript definitions
│
├── pages/                  # Top-level pages (Landing, Pricing, etc.)
└── .agi/employees/        # AI employee markdown definitions
```

### Path Aliases (tsconfig.json)

```typescript
"@/*"          → "./src/*"
"@features/*"  → "./src/features/*"
"@core/*"      → "./src/core/*"
"@shared/*"    → "./src/shared/*"
```

Always use path aliases. Never use relative paths across feature boundaries.

## Critical Implementation Details

### Mission Store

Located: `src/shared/stores/mission-control-store.ts`

Single source of truth for mission control. Key actions:
```typescript
setMissionPlan(tasks)                    // Set execution plan
updateTaskStatus(id, status)             // Update task progress
updateEmployeeStatus(name, status, tool) // Update employee state
addMessage(message)                      // Add to activity feed
startMission(id) / completeMission() / failMission(error)
```

### Workforce Orchestrator

Located: `src/core/ai/orchestration/workforce-orchestrator.ts`

Three-stage execution:
```typescript
// STAGE 1: PLANNING
const plan = await generatePlan(userInput);

// STAGE 2: DELEGATION
for (const task of tasks) {
  const employee = await selectOptimalEmployee(task);
  assignEmployeeToTask(task.id, employee);
}

// STAGE 3: EXECUTION
await executeTasks(tasks, originalInput);
```

### AI Employee System

Create new employees in `.agi/employees/`:
```markdown
---
name: employee-name
description: Brief role description
tools: Read, Grep, Glob, Bash, Edit, Write
model: inherit
---

You are a [role description].
[Detailed system prompt...]
```

Load employees:
```typescript
import { promptManagement } from '@core/ai/employees/prompt-management';
const employees = await promptManagement.getAvailableEmployees();
```

### VIBE vs Chat

- **`/vibe`**: Standalone AI coding workspace (outside dashboard layout, full-screen)
  - Monaco editor, file system, live preview, terminal
  - Services: `vibe-message-handler.ts`, `vibe-tool-orchestrator.ts`, `vibe-file-manager.ts`
  - Stores: `vibe-chat-store.ts`, `vibe-file-store.ts`, `vibe-view-store.ts`
- **`/chat`**: Multi-agent chat interface (inside dashboard layout)
  - Rich markdown, employee selection, document export (PDF/DOCX)

Both are protected routes requiring authentication.

### Supabase Patterns

```typescript
// Use .maybeSingle() for optional data (avoids 406 errors)
const { data } = await supabase.from('table').select().maybeSingle();

// All tables have RLS - users only access their own data
// service_role key bypasses RLS (server-side only, never expose to client)
```

### Unified LLM Service - Dual API

```typescript
// New API (parameter-based)
await unifiedLLMService.sendMessage(messages, sessionId, userId, provider);

// Old API (object-based) - still supported
await unifiedLLMService.sendMessage({ provider, messages, model, sessionId });
```

## Environment Variables

```bash
# Required
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local_anon_key>

# Server-side only (Netlify Functions)
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional (for LLM features)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=...
VITE_PERPLEXITY_API_KEY=...
```

**Never commit `.env` files.** API keys must be proxied through Netlify Functions.

## Netlify Functions

Located: `netlify/functions/`

**LLM Proxy Functions (7 providers):**
- `anthropic-proxy.ts` - Claude API proxy
- `openai-proxy.ts` - OpenAI/GPT API proxy
- `google-proxy.ts` - Google Gemini API proxy
- `grok-proxy.ts` - xAI Grok API proxy
- `perplexity-proxy.ts` - Perplexity API proxy
- `deepseek-proxy.ts` - DeepSeek API proxy
- `qwen-proxy.ts` - Alibaba Qwen API proxy

**Payment & Billing:**
- `stripe-webhook.ts` - Stripe event handling (subscriptions, token grants)
- `create-pro-subscription.ts` - Checkout session creation
- `buy-token-pack.ts` - One-time token purchases
- `get-billing-portal.ts` - Stripe billing portal redirect

**Other:**
- `vibe-build.ts` - React/TypeScript transpilation for Vibe live preview
- `fetch-page.ts` - Web page fetching with SSRF protection

**Security Features:**
- All proxies require JWT authentication via `withAuth` middleware
- CORS validation via `utils/cors.ts` with origin whitelist (not `*` wildcard)
- Rate limiting via Upstash Redis with JWT verification
- Request size validation (1MB limit)
- Token enforcement before API calls

Security headers configured in `netlify.toml`: CSP, HSTS, X-Frame-Options, etc.

## Key Principles

1. **Type Safety**: All code must pass `npm run type-check`
2. **Path Aliases**: Use `@features/`, `@core/`, `@shared/` - never relative paths
3. **Immutable State**: Use Immer middleware in Zustand stores
4. **Error Boundaries**: Wrap routes in ErrorBoundary components
5. **RLS Policies**: Every Supabase table must have RLS policies
6. **API Keys Server-Side**: Never expose keys to client
7. **Database Migrations**: Always use migrations, never direct SQL

## Debugging

```bash
# Check errors
npm run type-check
npm run lint
npm run build

# Clear caches
rm -rf node_modules/.vite dist .netlify

# Database
open http://localhost:54323   # Supabase Studio
```

Common issues:
- **"No AI employees"**: Check glob pattern in `prompt-management.ts` is `'/.agi/employees/*.md'`
- **Supabase 406**: Use `.maybeSingle()` instead of `.single()`
- **Foreign key errors**: Ensure user provisioning trigger exists (see migration `20251118000003_add_handle_new_user_trigger.sql`)
- **RLS blocking**: Verify user is authenticated with `supabase.auth.getUser()`
- **CORS errors**: LLM calls must go through Netlify Function proxies, not direct API calls
- **Map/Set serialization**: Zustand stores use `Record<>` and arrays instead of Map/Set for Immer compatibility

## Recent Architecture Updates (January 2026)

### Security Enhancements
- **CORS Hardening**: All 7 proxy functions now use validated origin whitelist (`utils/cors.ts`) instead of `'*'` wildcard
- **Rate Limiter JWT Verification**: JWT tokens are now verified via Supabase `auth.getUser()` instead of just decoded
- **Demo Mode Protection**: Demo login requires explicit `VITE_DEMO_MODE=true` environment variable

### Token System
- **New Table**: `user_token_balances` with RLS policies (migration `20260106000002`)
- **RPC Functions**: `get_or_create_token_balance()`, `deduct_user_tokens()`, `add_user_tokens()`
- **Plan-Aware Allocation**: Pro = 10M tokens/month, Max = 40M tokens/month

### Employee Memory System
- **Integration**: `employeeMemoryService` now wired into `employee-chat-service.ts`
- **Memory Context**: Employee system prompts include previous interaction context
- **Persistence**: Interactions saved to `employee_memories` table after responses

### Code Cleanup (Deleted)
- Orphaned stores: `ai-employee-store.ts`, `complete-ai-employee-store.ts`
- Legacy services: `employeeService.ts`, `complete-ai-employee-service.ts`
- Unused components: `AdminLayout.tsx`, `AdminRoute.tsx`, `PermissionGate.tsx`
- Duplicate routes: `/login`, `/register` (use `/auth/login`, `/auth/register`)

### Vibe File Persistence
- Files created by AI are now synced to `vibe_files` database table
- Survives page refresh (previously in-memory only)
