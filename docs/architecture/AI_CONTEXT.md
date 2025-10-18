# AI Agent Context - AGI Agent Automation

**Purpose:** This file provides a comprehensive, single-file overview of the entire codebase optimized for AI agent context windows.

## Project Overview

Full-stack TypeScript/React application for managing AI workforce automation. Users hire, manage, and coordinate AI employees powered by multiple LLM providers (OpenAI, Anthropic, Google, Perplexity).

**Tech Stack:**

- Frontend: React 18 + TypeScript + Vite + TailwindCSS + Shadcn/ui
- Backend: Supabase (PostgreSQL + Auth) + Netlify Functions
- State: Zustand stores
- Testing: Vitest (unit) + Playwright (e2e)

## Directory Structure (150 files, ~3.5MB source)

```
src/
├── _core/              # Infrastructure services (prefixed _ for AI visibility)
│   ├── api/           # External services & LLM providers
│   │   ├── llm/       # 5 files: unified-llm-service.ts + 4 providers
│   │   └── ai/        # AI employee executor, orchestration (8 files)
│   ├── monitoring/    # Analytics, SEO, performance (10 files)
│   ├── orchestration/ # Multi-agent coordination (9 files)
│   ├── security/      # Auth service (2 files)
│   └── storage/       # Supabase, cache, backup (7 files)
│
├── features/          # Feature modules (self-contained)
│   ├── auth/          # Login, Register, ProtectedRoute (8 files)
│   ├── chat/          # 12 files (consolidated from 31)
│   │   ├── components/ # VibeCodingInterface, TabbedLLMChatInterface
│   │   ├── pages/     # ChatPage, VibeCodingPage
│   │   └── services/  # LLM streaming, background chat
│   ├── workforce/     # AI employee management (8 files)
│   ├── billing/       # Stripe integration (5 files)
│   └── settings/      # User settings (5 files)
│
├── pages/             # 20 public pages (reduced from 35)
│   ├── LandingPage, PricingPage, AboutPage
│   ├── BlogPage, BlogPostPage, ResourcesPage
│   ├── legal/ (3 files)
│   ├── use-cases/ (4 files)
│   └── features/ (3 files)
│
├── shared/
│   ├── ui/            # 64 Shadcn components (reduced from 72)
│   ├── components/    # Layout, accessibility (12 files)
│   ├── hooks/         # useAuth, useChat, usePerformance (8 files)
│   ├── stores/        # 5 Zustand stores
│   ├── lib/           # Utils, API client (6 files)
│   └── types/         # TypeScript types (5 files)
│
├── layouts/           # 3 layouts (Public, Dashboard, Auth)
└── config/            # database.ts, security.ts
```

## Path Aliases (CRITICAL - Use These)

```typescript
import { ... } from '@_core/...'    // Infrastructure
import { ... } from '@features/...' // Feature modules
import { ... } from '@shared/...'   // Shared utilities
import { ... } from '@/...'         // Root (legacy, avoid)
```

## Architecture Patterns

### 1. LLM Provider Abstraction

**Location:** `src/_core/api/llm/`
**Files:**

- `unified-llm-service.ts` - Single entry point for all providers
- `anthropic-provider.ts`, `google-provider.ts`, `openai-provider.ts`, `perplexity-provider.ts`

**Interface:**

```typescript
unifiedLLMService.sendMessage({ provider, messages, model });
unifiedLLMService.streamMessage({ provider, messages, model }); // AsyncGenerator
```

### 2. Multi-Agent Orchestration

**Location:** `src/_core/orchestration/`
**Key Files:**

- `multi-agent-orchestrator.ts` - Coordinates multiple AI employees
- `workforce-orchestrator.ts` - Manages AI workforce tasks
- `reasoning/` - Task decomposition, NLP, agent selection

### 3. State Management (Zustand)

**Location:** `src/shared/stores/`
**Stores:**

- `unified-auth-store.ts` - **Single source of truth** for auth
- `chat-store.ts` - Chat conversations, messages
- `ai-employee-store.ts` - Employee data, hiring
- `ui-store.ts` - UI state (sidebar, modals, theme)
- `workforce-store.ts` - Workforce management

### 4. Supabase Integration

**Client:** `src/shared/lib/supabase-client.ts`
**Auth:** `src/_core/security/auth-service.ts`
**Services:** `src/_core/storage/supabase/workforce-service.ts`

**Row Level Security (RLS):** All queries filtered by `auth.uid()`

### 5. Feature Module Pattern

Each feature is self-contained with:

```
feature/
├── components/  # UI components
├── pages/       # Route components
├── services/    # Business logic
└── hooks/       # Custom hooks
```

**Import Rules:**

- ✅ Features can import from `@shared/*` and `@_core/*`
- ❌ Features CANNOT import from other features
- ❌ `@_core/*` CANNOT import from features

## Key Services Map

### Authentication Flow

1. `auth-service.ts` (wraps Supabase Auth)
2. `unified-auth-store.ts` (global state)
3. `<ProtectedRoute>` (route protection)
4. API calls include auth headers via `src/shared/lib/api.ts`

### Chat Flow

1. User selects AI employee in `WorkforcePage`
2. Chat initiated in `ChatPage` or `VibeCodingPage`
3. Message sent via `unified-llm-service.ts`
4. Streaming response via `streamMessage()` AsyncGenerator
5. State updated in `chat-store.ts`

### Hiring Flow

1. Browse marketplace in `MarketplacePage`
2. Click "Hire Now" → `hireEmployee()` in `workforce-store.ts`
3. Creates row in `purchased_employees` table (Supabase)
4. Updates local state optimistically
5. Syncs with `workforce-service.ts`

## Environment Variables (Required)

```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from supabase start>
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=AI...
VITE_PERPLEXITY_API_KEY=pplx-...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  # Netlify functions only
```

## Essential Commands

```bash
npm run dev          # Start Vite dev server (:8080)
npm run build        # Production build
npm run lint         # ESLint (must pass)
npm run type-check   # TypeScript check
npm run test         # Vitest unit tests
npm run e2e          # Playwright e2e tests

supabase start       # Local Supabase (:54321)
netlify dev          # Netlify functions (:8888)
```

## Common Patterns

### Error Handling

```typescript
try {
  await someOperation();
} catch (error) {
  // ✅ No type annotation (TypeScript infers 'unknown')
  if (error instanceof Error) {
    console.error(error.message);
  }
  // ❌ Never use catch (error: any)
}
```

### Component Structure

```typescript
// ✅ Good
import { Button } from '@shared/ui/button';
import { useAuthStore } from '@shared/stores/unified-auth-store';
import { aiService } from '@_core/api/ai/ai-service';

// ❌ Bad - relative imports
import { Button } from '../../../shared/ui/button';
```

### Lazy Loading

```typescript
const SomePage = lazyWithRetry(() => import('./pages/SomePage'));
```

## Type Safety Rules

- **No `any` types** - ESLint will fail build
- Use `unknown` for truly unknown types
- Use type guards to narrow types
- All function returns must be typed

## Monitoring & Performance

**Services:** All initialized in `App.tsx`

- `monitoringService` - General monitoring
- `analyticsService` - User analytics
- `performanceService` - Performance tracking
- `seoService` - SEO optimization
- `backupService` - Data backup
- `scalingService` - Load balancing
- `privacyService` - Privacy compliance

## Testing

**Unit Tests:** `tests/unit/` (Vitest)
**E2E Tests:** `tests/e2e/playwright/` (Playwright)

**Coverage Target:** >80% for critical paths

## Deployment

- **Platform:** Netlify
- **Build:** `npm run build` → `dist/`
- **Functions:** `netlify/functions/` (auto-deployed)
- **DB:** Supabase (cloud or self-hosted)

## AI Agent Optimization Notes

1. **Context Window Priority:** Start with `_AI_CONTEXT.md` (this file)
2. **Feature Modules:** Read feature READMEs for focused context
3. **Service Discovery:** Check `src/_core/` for infrastructure
4. **Type Definitions:** See `src/shared/types/` for data models
5. **Routing:** `src/App.tsx` for all routes

## Recent Changes

- ✅ Removed 68MB build artifacts (coverage, test-results, dist, playwright-report)
- ✅ Consolidated chat components: 31 → 12 files
- ✅ Removed unused marketing pages: 35 → 20 files
- ✅ Optimized UI components: 72 → 64 files
- ✅ Renamed `core/` → `_core/` for AI visibility
- ✅ All imports updated to `@_core/*`

## Next Steps for AI Agents

1. Read feature-specific `_MANIFEST.ts` files
2. Check `_core/README.md` for service details
3. Review `features/README.md` for module overview
4. Examine test files for usage examples
