# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AGI Agent Automation is a full-stack TypeScript/React application for managing AI workforce automation. The platform allows users to hire, manage, and coordinate AI employees powered by multiple LLM providers (OpenAI, Anthropic, Google, Perplexity).

**Tech Stack:**

- Frontend: React 18 + TypeScript + Vite + TailwindCSS + Shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Edge Functions) + Netlify Functions
- State: Zustand stores
- Data Fetching: React Query (@tanstack/react-query)
- Payment: Stripe integration
- Testing: Vitest (unit) + Playwright (e2e)

## Essential Commands

### Development

```bash
npm run dev                  # Start dev server (Vite on :5173)
npm run type-check          # Run TypeScript compiler without emitting
npm run lint                # Run ESLint (must pass before commit)
npm run build               # Production build
```

### Testing

```bash
npm run test                # Run Vitest unit tests in watch mode
npm run test:run            # Run tests once (CI mode)
npm run test:coverage       # Generate coverage report
npm run e2e                 # Run Playwright e2e tests
npm run e2e:ui             # Playwright with UI
npm run e2e:debug          # Playwright debug mode
```

### Local Backend Services

```bash
supabase start             # Start local Supabase (required for DB/Auth)
supabase stop              # Stop local services
netlify dev                # Run Netlify functions locally (:8888)
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

**Critical:** Pre-commit hooks run `eslint --fix` and `prettier --write` on staged files. All TypeScript `any` types trigger ESLint errors and must be replaced with proper types or `unknown`.

## Architecture

### Folder Structure (Post-Refactoring)

The codebase follows a **feature-based architecture** with strict separation:

```
src/
├── features/              # Feature modules (self-contained)
│   ├── auth/             # Login, Register, ProtectedRoute, auth services
│   ├── chat/             # Chat UI, LLM interactions, streaming (12 files, consolidated from 31)
│   ├── workforce/        # AI employee management, marketplace
│   ├── billing/          # Stripe integration, usage tracking
│   ├── settings/         # User settings, AI configuration
│   └── marketplace/      # Public marketplace pages
│
├── _core/                # Core infrastructure (renamed for AI visibility, DO NOT import from features)
│   ├── api/             # LLM providers (anthropic, google, openai, perplexity)
│   │   ├── llm/         # Provider implementations
│   │   └── ai/          # AI employee executor, service
│   ├── monitoring/      # Analytics, performance, SEO services
│   ├── orchestration/   # Multi-agent coordination, reasoning
│   ├── storage/         # Cache, persistence, Supabase services
│   └── security/        # Auth service, permissions
│
├── shared/              # Shared across features (reusable)
│   ├── components/      # Layout, accessibility, dashboard components
│   ├── ui/             # Shadcn/ui design system (96 components)
│   ├── hooks/          # Custom React hooks (useAuth, useChat, etc.)
│   ├── stores/         # Zustand stores (auth, chat, employee, ui)
│   ├── types/          # TypeScript types (supabase, employee, ai-employee)
│   ├── lib/            # Utils, API client, Supabase client
│   └── utils/          # Helper functions
│
├── pages/              # Public pages (landing, blog, pricing, legal)
├── layouts/            # Layout wrappers (PublicLayout, DashboardLayout)
├── integrations/       # External tool integrations
└── config/             # App config (database schema)
```

**Path Aliases (use these for imports):**

- `@features/*` → `./src/features/*`
- `@_core/*` → `./src/_core/*` (renamed from @core for AI visibility)
- `@shared/*` → `./src/shared/*`
- `@/*` → `./src/*` (legacy, prefer specific aliases)

### Key Architectural Patterns

#### 1. **LLM Provider Abstraction**

All LLM providers implement a unified interface in `src/_core/api/llm/`:

- Each provider (anthropic, google, openai, perplexity) exports `sendMessage()` and `streamMessage()`
- `unified-llm-service.ts` provides a single entry point with provider selection
- Streaming uses `AsyncGenerator<{ content: string; done: boolean; usage?: {...} }>`

**Example:**

```typescript
import { unifiedLLMService } from '@_core/api/llm/unified-llm-service';

const response = await unifiedLLMService.sendMessage({
  provider: 'openai',
  messages: [...],
  model: 'gpt-4',
});
```

#### 2. **Multi-Agent Orchestration**

Located in `src/_core/orchestration/`:

- `multi-agent-orchestrator.ts` - Coordinates multiple AI employees
- `workforce-orchestrator.ts` - Manages AI workforce tasks
- `reasoning/` - Task decomposition, NLP processing, agent selection
- Uses event-driven architecture with agent protocol

#### 3. **State Management**

Zustand stores in `src/shared/stores/`:

- `unified-auth-store.ts` - **Single source of truth** for auth state
- `chat-store.ts` - Chat conversations, messages
- `ai-employee-store.ts` - Employee data, hiring, management
- `ui-store.ts` - UI state (sidebar, modals, theme)

**Pattern:**

```typescript
import { useAuthStore } from '@shared/stores/unified-auth-store';

const { user, signIn, signOut } = useAuthStore();
```

#### 4. **Supabase Integration**

- Database client: `src/shared/lib/supabase-client.ts`
- Auth managed through `src/core/security/auth-service.ts`
- Feature-specific services: `src/features/*/services/supabase-*.ts`
- Row Level Security (RLS) policies enforce data isolation

**Critical:** All database operations must use the centralized Supabase client. Never create new client instances.

## AI-Optimized Documentation

For comprehensive codebase overview optimized for AI context windows:

- **Start here:** `src/_AI_CONTEXT.md` - Single-file architecture overview
- **Core services:** `src/_core/README.md` - Infrastructure service map
- **Features:** `src/features/README.md` - Feature module guide

#### 5. **Real-time Features**

- Chat uses Server-Sent Events (SSE) for streaming
- Supabase Realtime subscriptions for live updates
- WebSocket fallback in `src/shared/lib/websocket.ts`

## Critical Patterns & Constraints

### Import Rules

1. **Features cannot import from other features** - use `@shared/*` or `@_core/*`
2. **\_core cannot import from features** - maintains clean dependency hierarchy
3. **Shared can import from \_core** - but not from features
4. **Use path aliases, not relative imports** beyond adjacent files:

   ```typescript
   // ✅ Good
   import { Button } from '@shared/ui/button';
   import { useAuthStore } from '@shared/stores/unified-auth-store';
   import { unifiedLLMService } from '@_core/api/llm/unified-llm-service';

   // ❌ Bad
   import { Button } from '../../../shared/ui/button';
   import { unifiedLLMService } from '../../../_core/api/llm/unified-llm-service';
   ```

### Type Safety

- **No `any` types allowed** - ESLint will fail the build
- Use `unknown` for truly unknown types, then narrow with type guards
- Exception handlers must not use `catch (error: any)` - use `catch (error)` and check `error instanceof Error`

### Authentication Flow

1. User signs in via `auth-service.ts` (wraps Supabase Auth)
2. Session stored in `unified-auth-store.ts`
3. Protected routes use `<ProtectedRoute>` from `@features/auth/components/ProtectedRoute`
4. API calls include auth headers via `src/shared/lib/api.ts` interceptors

### LLM Provider Selection

Providers are selected via environment variables and user preferences:

- Each provider requires `VITE_<PROVIDER>_API_KEY` in `.env`
- User can switch providers in Settings
- Default model per provider configured in `unified-llm-service.ts`

### Stripe Payment Flow

1. User subscribes via `BillingPage` (creates Checkout Session)
2. Netlify function `create-pro-subscription` handles server-side logic
3. Webhooks via `stripe-webhook` function update Supabase `subscriptions` table
4. Frontend polls subscription status from Supabase

## Common Gotchas

1. **Supabase Local vs Production:**
   - Local: `http://localhost:54321` (started via `supabase start`)
   - Use `.env` to switch between environments
   - Migrations in `supabase/migrations/` must be applied with `supabase db reset`

2. **Netlify Functions:**
   - Located in `netlify/functions/`
   - Must be tested locally with `netlify dev`
   - CORS configured per-function
   - Environment variables set in Netlify dashboard, not `.env`

3. **ESLint Pre-commit Hooks:**
   - Lint-staged runs on all staged `.ts`/`.tsx` files
   - If ESLint fails, commit is blocked
   - Use `git commit --no-verify` only in emergencies (not recommended)

4. **React Query Patterns:**
   - Queries use `useQuery` from `@tanstack/react-query`
   - Query client configured in `src/shared/stores/query-client.ts`
   - Invalidation handled via `queryClient.invalidateQueries()`

5. **AI Employee Executor:**
   - Located at `src/core/api/ai/ai-employee-executor.ts`
   - Orchestrates tool execution for AI employees
   - Returns `TaskExecutionResult` with success/error/toolsUsed
   - Tools defined in `src/core/orchestration/tool-manager.ts`

## Testing Patterns

### Unit Tests (Vitest)

- Located in `tests/unit/` or co-located `*.test.ts` files
- Use `describe`, `it`, `expect` from Vitest
- Mock Supabase client: `vi.mock('@shared/lib/supabase-client')`
- Run specific test: `npm run test -- Button.test.tsx`

### E2E Tests (Playwright)

- Located in `tests/e2e/playwright/`
- Test user flows: login, chat, employee hiring
- Use `test.describe()` and `test()` from `@playwright/test`
- Headless by default, use `npm run e2e:ui` for debugging

## Environment Variables

**Required for development:**

```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from supabase start>

# LLM Providers (at least one)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=AI...
VITE_PERPLEXITY_API_KEY=pplx-...

# Stripe (test keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  # For Netlify functions
```

**Security:** Never commit `.env` files. Use `.env.example` as template.

## Build & Deployment

### Production Build

```bash
npm run build                # Vite build → dist/
npm run preview             # Test production build locally
```

Build output:

- HTML/CSS/JS → `dist/`
- Code splitting by route (React.lazy)
- Largest bundle: ~780KB (VibeCodingPage)
- Gzipped: ~650KB total

### Netlify Deployment

- Auto-deploys from `main` branch
- Build command: `npm run build`
- Publish directory: `dist/`
- Functions in `netlify/functions/` deployed automatically
- Environment variables set in Netlify dashboard

## Troubleshooting

### Build Fails with Import Errors

- Check path aliases in `tsconfig.json` and `vite.config.ts`
- Verify imports use `@features/*`, `@core/*`, `@shared/*`
- Run `npm run type-check` to isolate TypeScript errors

### Supabase Connection Issues

```bash
supabase status            # Check if services are running
supabase logs              # View service logs
supabase db reset          # Reset database and apply migrations
```

### Stripe Webhook Not Firing

```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
# Copy webhook secret to .env as STRIPE_WEBHOOK_SECRET
```

### ESLint `any` Type Errors

Replace `any` with:

- `unknown` for truly unknown types
- Specific interface/type if possible
- `Record<string, unknown>` for generic objects
- Remove `: any` from catch blocks (use `catch (error)`)

## Additional Resources

- **Refactoring Documentation:** `docs/REFACTORING_SUMMARY.md`
- **Security Audit:** `docs/RLS_AUDIT_REPORT.md`
- **Main README:** `docs/README.md`
- **Supabase Docs:** https://supabase.com/docs
- **Shadcn/ui:** https://ui.shadcn.com/
