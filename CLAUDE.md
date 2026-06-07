# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AGI Workforce** — AI workforce management platform. Users hire, manage, and coordinate 140+ AI employees for autonomous multi-agent workflows. This is the companion web app for the AGI Workforce Desktop Application (separate repo: `agiworkforce-desktop-app`). Both share the same Supabase project and Stripe billing.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes -- don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -- then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. No side effects with new bugs.

## Development Commands

```bash
# Development
npm run dev                  # Vite dev server (port 5173)
npm run build:prod           # Production build
npm run preview              # Preview production build

# Code Quality (auto-runs via lint-staged on commit)
npm run lint                 # ESLint
npm run type-check           # TypeScript (must pass before deployment)
npm run format               # Prettier format
npm run format:check         # Check formatting (CI)

# Testing
npm run test                 # Vitest watch mode
npm run test:run             # Single run (CI)
npx vitest run path/to/file  # Run specific test file
npm run test:coverage        # Coverage report
npm run e2e                  # Playwright E2E tests

# Local Development Stack
supabase start               # Local Supabase (port 54321, Studio: 54323)
netlify dev                  # Netlify functions (port 8888)
stripe listen --forward-to localhost:8888/.netlify/functions/payments/stripe-webhook

# Database
supabase db reset            # Reset and apply all migrations
supabase migration new name  # Create new migration
supabase gen types typescript --local > src/shared/types/supabase.ts

# Performance & Security
npm run size                 # Bundle size checks against limits
npm run lighthouse           # Lighthouse CI
npm run security:audit       # npm audit (high severity)
```

## CI/CD Pipeline

GitHub Actions (`.github/workflows/simple-ci.yml`) runs on push to `main`/`develop` and PRs:

1. **security** — npm audit, TruffleHog secret scanning, license compliance
2. **dependency-review** — PR-only vulnerability check
3. **quality** — format:check, lint, type-check (must all pass)
4. **build** — `npm run build:prod`
5. **bundle-size** — Checks `.size-limit.json` (total JS 2.5 MB, CSS 100 kB, Chat 550 kB, Vibe 350 kB, Editor vendor 200 kB, React vendor 150 kB, AI core 120 kB, UI vendor 100 kB)
6. **lighthouse** — Performance >= 80%, FCP < 2s, LCP < 4s, TBT < 300ms
7. **test** — Unit tests (non-blocking)
8. **e2e** — Playwright (non-blocking)

Pre-commit: lint-staged runs ESLint + Prettier on staged files.

Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.

## Architecture

### Core Patterns

**1. Plan-Delegate-Execute Orchestration** (`src/core/ai/orchestration/workforce-orchestrator.ts`)

- **Planning**: LLM analyzes requests → structured JSON execution plans
- **Delegation**: Auto-selects optimal AI employees based on task requirements
- **Execution**: Tasks run in parallel with real-time status updates via Zustand
- **Security**: Input sanitization → sandwich defense → output validation

**2. File-Based AI Employee System** (`.agi/employees/*.md`)

- Markdown files with YAML frontmatter (name, description, tools, model)
- Loaded via `import.meta.glob` and parsed with `gray-matter`
- Hot-reloadable without code changes; 140+ employees

**3. State Management** (Zustand + Immer + React Query)

All stores exported from `@shared/stores/index.ts` — always import from there:

- `useMissionStore` + selectors (`useMissionStatus`, `useMissionPlan`, `useActiveEmployees`, `useMissionMessages`)
- `useWorkforceStore` — Hired employees
- `useChatStore` / `useMultiAgentChatStore` — Chat state
- `useCompanyHubStore` — Multi-agent workspace
- `useAuthStore`, `useAppStore`, `useUIStore`, `useNotificationStore`
- `useArtifactStore`, `useAgentMetricsStore`, `useUsageWarningStore`, `useUserProfileStore`

React Query hooks live in feature directories (`@features/billing/hooks/`, `@features/chat/hooks/`, `@features/settings/hooks/`). Query keys centralized in `@shared/stores/query-client.ts`.

**4. Multi-Provider LLM Integration** (`src/core/ai/llm/unified-language-model.ts`)

- 7 providers: OpenAI, Anthropic, Google, Perplexity, Grok, DeepSeek, Qwen
- Provider implementations in `src/core/ai/llm/providers/`
- All calls proxied through Netlify Functions (API keys never on client)

### Path Aliases (tsconfig.json)

```
@/*          → ./src/*
@features/*  → ./src/features/*
@core/*      → ./src/core/*
@shared/*    → ./src/shared/*
```

Always use path aliases. Never use relative paths across feature boundaries.

### Directory Layout

```
src/
├── core/                    # Business logic
│   ├── ai/                  # LLM providers, orchestration, employees, tools
│   ├── billing/             # Token enforcement (token-enforcement-service.ts)
│   ├── security/            # Prompt injection, input sanitization, rate limiting, feature flags
│   └── storage/             # Database, cache, Supabase services
├── features/                # Feature modules
│   ├── vibe/               # /vibe — Standalone AI coding workspace (full-screen)
│   ├── chat/               # /chat — Multi-agent chat (inside dashboard)
│   ├── mission-control/    # Mission orchestration UI
│   ├── workforce/          # Employee hiring & management
│   ├── marketplace/        # AI employee marketplace
│   ├── billing/            # Stripe integration
│   └── settings/           # User preferences
├── shared/                  # Shared utilities, stores, hooks, types, UI components
├── pages/                   # Top-level pages (Landing, Pricing, etc.)
netlify/functions/           # Serverless backend
│   ├── llm-proxies/        # 7 LLM API proxies
│   ├── media-proxies/      # DALL-E, Imagen, Veo
│   ├── payments/           # Stripe & billing
│   ├── agents/             # Agent orchestration
│   ├── utilities/          # vibe-build, fetch-page
│   └── utils/              # auth-middleware, cors, rate-limiter, credit-system
.agi/employees/             # 140+ AI employee markdown definitions
```

### VIBE vs Chat

- **`/vibe`**: Standalone AI coding workspace (full-screen, outside dashboard layout). Monaco editor, file system, live preview, terminal. Stores in `src/features/vibe/stores/`. Files persist to `vibe_files` table.
- **`/chat`**: Multi-agent chat interface (inside dashboard layout). Rich markdown, employee selection, document export (PDF/DOCX). Components organized by domain: `Main/`, `Sidebar/`, `Composer/`, `messages/`, `dialogs/`.

Both are protected routes requiring authentication.

## Billing System

**Cents-based credits** via `token_credits` table (shared with desktop app):

- Utility: `netlify/functions/utils/credit-system.ts`
- RPCs: `get_credit_balance()`, `check_credits_available()`, `deduct_credits()`
- All 7 LLM proxies + 3 media proxies call `deductCredits()` — return HTTP 402 on failure
- `token-enforcement-service.ts` checks balance before API calls
- Pricing matrix per provider/model in `credit-system.ts`

## Netlify Functions

**API Paths**: `/.netlify/functions/<directory>/<function-name>`

All proxies require:
- JWT auth via `withAuth` middleware (`supabase.auth.getUser()`, not just decode)
- CORS origin whitelist (not `*`)
- Rate limiting via Upstash Redis (tiered: public 5/min, authenticated 10/min, payment 5/min)
- Zod validation on inputs, request size limits (1MB, 15MB for video)
- Credit deduction before API calls

## Deployment

**Target**: Vercel at `agiworkforce.com` — `vercel.json` configured with:
- `/.netlify/functions/*` → `/api/*` rewrites (backward compatibility)
- SPA fallback to `/index.html`
- 30s function timeout

**Shared infrastructure**: Supabase project `xwmcvbgdyergfnvwbnap`, same Stripe account as desktop app.

## Key Rules

1. **Type Safety**: All code must pass `npm run type-check`
2. **Path Aliases**: Use `@features/`, `@core/`, `@shared/` — never relative paths across boundaries
3. **Immutable State**: Immer middleware in all Zustand stores; use `Record<>` not `Map/Set`
4. **Store Imports**: Always from `@shared/stores/index.ts`, never directly
5. **Server State**: React Query hooks, not manual `useState`/`useEffect` for async data
6. **Supabase**: Use `.maybeSingle()` not `.single()` when row may not exist
7. **API Keys**: Never on client — proxy through Netlify Functions
8. **Database Changes**: Always via migrations (`supabase migration new`), never direct SQL
9. **Error Boundaries**: Wrap page components with `<ErrorBoundary>` + Sentry
10. **Cleanup**: Always cleanup timeouts, subscriptions, and AbortControllers in useEffect

## Debugging

```bash
npm run type-check && npm run lint && npm run build   # Quick health check
rm -rf node_modules/.vite dist .netlify               # Clear caches
open http://localhost:54323                            # Supabase Studio
```

Common issues:
- **"No AI employees"**: Check glob pattern in `prompt-management.ts` is `'/.agi/employees/*.md'`
- **Supabase 406 "PGRST116"**: Use `.maybeSingle()` instead of `.single()`
- **CORS errors**: LLM calls must go through Netlify Function proxies
- **Rate limit 503**: Upstash Redis unavailable — rate limiter fails closed
- **Credit balance errors**: Check `token_credits` table, use `get_credit_balance()` RPC
- **Netlify function 500**: Check `netlify dev` console for actual error
