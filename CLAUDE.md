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
npm run preview             # Preview production build locally

# Code Quality (run before commits - auto-runs via Husky/lint-staged)
npm run lint                # Run ESLint
npm run type-check          # TypeScript checking (must pass before deployment)
npm run format              # Format with Prettier
npm run format:check        # Check formatting without changes (CI)

# Testing
npm run test                # Run Vitest unit tests (watch mode)
npm run test:run            # Single test run (CI)
npm run test:coverage       # Generate coverage report
npx vitest run path/to/file # Run specific test file
npm run e2e                 # Run Playwright E2E tests
npm run e2e:ui              # E2E tests with interactive UI
npm run e2e:debug           # Debug E2E tests interactively

# Testing Patterns
# Use test data factory for consistent fixtures:
# import { createMockTask, createUserMessage } from '../../../tests/fixtures/test-data-factory';
# Reset Zustand stores in beforeEach: useMissionStore.getState().reset();

# Local Development Stack
supabase start              # Start local Supabase (port 54321, Studio: 54323)
supabase status             # Check service status
netlify dev                 # Start Netlify functions (port 8888)
stripe listen --forward-to localhost:8888/.netlify/functions/payments/stripe-webhook

# Database
supabase db reset           # Reset and apply all migrations
supabase migration new name # Create new migration
supabase gen types typescript --local > src/shared/types/supabase.ts

# Performance & Bundle Analysis
npm run size                # Check bundle sizes against limits
npm run lighthouse          # Run Lighthouse CI locally

# Security
npm run security:audit      # Check for high severity vulnerabilities
npm run security:check      # Check for critical vulnerabilities only
```

## CI/CD Pipeline

GitHub Actions (`.github/workflows/simple-ci.yml`) runs on push to `main`/`develop` and PRs:

1. **security** - npm audit, TruffleHog secret scanning, license compliance
2. **dependency-review** - PR-only dependency vulnerability check
3. **quality** - format:check, lint, type-check (must all pass)
4. **build** - Production build with `npm run build:prod`
5. **bundle-size** - Checks bundle sizes against limits (fails if exceeded)
6. **lighthouse** - Lighthouse CI performance audit
7. **test** - Unit tests (non-blocking)
8. **e2e** - Playwright E2E tests (non-blocking)

Pre-commit hooks (Husky + lint-staged) auto-run ESLint and Prettier on staged files.

## Architecture

### Core Patterns

**1. Plan-Delegate-Execute Orchestration** (`src/core/ai/orchestration/workforce-orchestrator.ts`)

- **Planning**: LLM analyzes requests → generates structured JSON execution plans
- **Delegation**: Auto-selects optimal AI employees based on task requirements
- **Execution**: Tasks run in parallel with real-time status updates via Zustand
- **Security**: Input sanitization, prompt injection defense, output validation

**2. File-Based AI Employee System** (`.agi/employees/*.md`)

- Employees defined as markdown files with YAML frontmatter (name, description, tools, model)
- System prompt in markdown body
- Loaded via `import.meta.glob('/.agi/employees/*.md')` and parsed with `gray-matter`
- Hot-reloadable without code changes
- 140+ specialized employees available

**3. State Management** (Zustand + Immer + React Query)

Stores exported from `@shared/stores/index.ts` - always import from there:

- `useMissionStore`, `useMissionStatus`, `useMissionPlan`, `useActiveEmployees`, `useMissionMessages` - Mission orchestration
- `useWorkforceStore` - Hired employees from database
- `useChatStore` - Chat conversations and messages
- `useMultiAgentChatStore` - Multi-participant chat
- `useCompanyHubStore` - Multi-agent workspace state
- `useAgentMetricsStore` - Agent performance metrics
- `useAppStore` - App settings and feature flags
- `useUIStore` - UI layout and theme state
- `useAuthStore` - Auth state
- `useArtifactStore` - Code artifacts
- `useNotificationStore` - App notifications and toasts
- `useUsageWarningStore` - Token usage warnings
- `useUserProfileStore` - User profile state

**React Query** for server state (hooks in feature directories):

- `@features/billing/hooks/use-billing-queries.ts` - Billing, token balance, analytics
- `@features/chat/hooks/use-chat-queries.ts` - Chat sessions, messages, CRUD
- `@features/chat/hooks/use-search-history.ts` - Search tracking, suggestions
- `@features/chat/hooks/use-message-reactions.ts` - Message reactions
- `@features/chat/hooks/use-conversation-branches.ts` - Conversation branching
- `@features/settings/hooks/use-settings-queries.ts` - User profile, settings

**4. Multi-Provider LLM Integration** (`src/core/ai/llm/unified-language-model.ts`)

- Unified interface: OpenAI, Anthropic, Google, Perplexity, Grok, DeepSeek, Qwen
- Provider implementations in `src/core/ai/llm/providers/`
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
│   ├── billing/            # Token enforcement (token-enforcement-service.ts)
│   ├── integrations/       # External services (chat, media, search)
│   ├── security/           # Security utilities
│   │   ├── prompt-injection-detector.ts   # Injection detection with homoglyph support
│   │   ├── employee-input-sanitizer.ts    # Input sanitization & sandwich defense
│   │   ├── api-abuse-prevention.ts        # Rate limiting & abuse detection
│   │   └── gradual-rollout.ts             # Feature flags
│   └── storage/            # Database, cache, Supabase services
│
├── features/               # Feature modules
│   ├── vibe/              # /vibe - Standalone AI coding workspace
│   ├── chat/              # /chat - Multi-agent chat (inside dashboard)
│   ├── mission-control/   # Mission orchestration UI
│   ├── workforce/         # Employee hiring & management
│   ├── marketplace/       # AI employee marketplace
│   ├── billing/           # Stripe integration with React Query hooks
│   └── settings/          # User preferences with React Query hooks
│
├── shared/                 # Shared utilities
│   ├── stores/            # Zustand state stores
│   ├── hooks/             # React hooks
│   ├── lib/               # Utilities (supabase-client.ts, sentry.ts)
│   ├── types/             # TypeScript definitions
│   │   ├── common.ts      # Centralized common types
│   │   ├── store-types.ts # Store-specific types
│   │   └── supabase.ts    # Database types
│   └── ui/                # shadcn/ui components
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

```typescript
import {
  useMissionStore,
  useMissionStatus,
  useMissionPlan,
  useActiveEmployees,
  useMissionMessages,
} from '@shared/stores';

// Selector hooks (preferred - minimize re-renders)
const status = useMissionStatus();
const plan = useMissionPlan();
const employees = useActiveEmployees();

// Full store access (for actions)
const { setMissionPlan, updateTaskStatus, startMission, completeMission } =
  useMissionStore();
```

### Workforce Orchestrator

Located: `src/core/ai/orchestration/workforce-orchestrator.ts`

Three-stage execution with security layers:

```typescript
// STAGE 1: PLANNING (with input sanitization)
const sanitizedInput = sanitizeEmployeeInput(userInput, userId);
if (sanitizedInput.blocked) throw new Error('Input blocked');
const plan = await generatePlan(sanitizedInput.sanitizedText);

// STAGE 2: DELEGATION
for (const task of tasks) {
  const selectedEmployee = await selectOptimalEmployee(task);
  if (selectedEmployee) {
    store.updateTaskStatus(task.id, 'in_progress', selectedEmployee.name);
  }
}

// STAGE 3: EXECUTION (with sandwich defense)
const secureMessages = buildSecureMessages(systemPrompt, userMessage, employeeName);
const response = await executeWithSecureMessages(secureMessages);

// STAGE 4: OUTPUT VALIDATION
const validation = validateEmployeeOutput(response.content, employeeName);
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

### React Query Integration

Query keys are centralized in `@shared/stores/query-client.ts`:

```typescript
import { queryKeys } from '@shared/stores';

// Available namespaces
queryKeys.auth.user();
queryKeys.chat.sessions(userId);
queryKeys.chat.session(sessionId);
queryKeys.employees.list(userId);
queryKeys.billing.plan(userId);
queryKeys.billing.tokenBalance(userId);
queryKeys.settings.profile(userId);
queryKeys.search.recent(userId);
queryKeys.search.popular();
```

### VIBE vs Chat

- **`/vibe`**: Standalone AI coding workspace (full-screen, outside dashboard layout)
  - Monaco editor, file system, live preview, terminal
  - Stores in `src/features/vibe/stores/`: `vibe-chat-store.ts`, `vibe-file-store.ts`, `vibe-view-store.ts`, `vibe-agent-store.ts`
  - Files persist to `vibe_files` table
- **`/chat`**: Multi-agent chat interface (inside dashboard layout)
  - Rich markdown, employee selection, document export (PDF/DOCX)
  - Components organized by domain folders: `Main/`, `Sidebar/`, `Composer/`, `messages/`, `dialogs/`

Both are protected routes requiring authentication.

### Supabase Patterns

```typescript
// Use .maybeSingle() for optional data (avoids 406 errors)
const { data } = await supabase.from('table').select().maybeSingle();

// All tables have RLS - users only access their own data
// service_role key bypasses RLS (server-side only, never expose to client)
```

### Unified LLM Service

```typescript
// New API (parameter-based)
await unifiedLLMService.sendMessage(messages, sessionId, userId, provider);

// Old API (object-based) - still supported
await unifiedLLMService.sendMessage({ provider, messages, model, sessionId });
```

## Environment Variables

See `.env.example` for full list. Key variables:

```bash
# Required
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local_anon_key>

# Server-side only (Netlify Functions)
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LLM Provider API Keys (server-side only - proxied through Netlify Functions)
OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, PERPLEXITY_API_KEY,
GROK_API_KEY, DEEPSEEK_API_KEY, QWEN_API_KEY

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

# Sentry Error Monitoring
VITE_SENTRY_DSN, SENTRY_AUTH_TOKEN
```

**Security Note:** API keys are NEVER exposed to the client. All LLM calls are proxied through authenticated Netlify Functions.

## Netlify Functions

Located: `netlify/functions/` (organized into subdirectories)

```
netlify/functions/
├── llm-proxies/          # LLM API proxies (7 providers)
├── media-proxies/        # Media generation (DALL-E, Imagen, Veo)
├── payments/             # Stripe & billing
├── agents/               # Agent orchestration
├── utilities/            # General utilities (vibe-build, fetch-page)
└── utils/                # Shared utilities (auth-middleware, cors, rate-limiter)
```

**API Paths**: `/.netlify/functions/<directory>/<function-name>`

**Security Features:**

- All proxies require JWT authentication via `withAuth` middleware
- CORS validation with origin whitelist (not `*`)
- Rate limiting via Upstash Redis (tiered: public 5/min, authenticated 10/min, payment 5/min, webhook 100/min)
- JWT verification uses `supabase.auth.getUser()` (not just decode)
- Request size validation (1MB limit, 15MB for video)
- Token enforcement before API calls
- Zod validation on all inputs

## Key Principles

1. **Type Safety**: All code must pass `npm run type-check`
2. **Path Aliases**: Use `@features/`, `@core/`, `@shared/` - never relative paths
3. **Immutable State**: Use Immer middleware in Zustand stores
4. **Error Boundaries**: Wrap routes in ErrorBoundary components with Sentry integration
5. **RLS Policies**: Every Supabase table must have RLS policies
6. **API Keys Server-Side**: Never expose keys to client - use Netlify proxies
7. **Database Migrations**: Always use migrations, never direct SQL
8. **React Query for Server State**: Use React Query hooks, not manual useState/useEffect
9. **Memory Leak Prevention**: Always cleanup timeouts, subscriptions, and AbortControllers

### ErrorBoundary Pattern

All page components should be wrapped with ErrorBoundary:

```typescript
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

const MyPageWithErrorBoundary: React.FC = () => (
  <ErrorBoundary componentName="MyPage" showReportDialog>
    <MyPage />
  </ErrorBoundary>
);

export default MyPageWithErrorBoundary;
```

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
- **Supabase 406 "PGRST116"**: Use `.maybeSingle()` instead of `.single()` when row may not exist
- **Foreign key errors**: Ensure user provisioning trigger exists (migration `20251118000003`)
- **RLS blocking**: Verify user is authenticated with `supabase.auth.getUser()`
- **CORS errors**: LLM calls must go through Netlify Function proxies, not direct API calls
- **Map/Set serialization**: Zustand stores use `Record<>` and arrays instead of Map/Set for Immer
- **Rate limit 503**: Upstash Redis unavailable - rate limiter fails closed (denies requests)
- **Token balance errors**: Check `user_token_balances` table exists, use `get_or_create_token_balance()` RPC
- **Netlify function 500**: Check `netlify dev` console for actual error
- **Memory leaks**: Ensure useEffect cleanup functions clear timeouts/subscriptions

## Security Implementation

**Multi-Layer Security** (`@core/security/`):

```typescript
import {
  sanitizeEmployeeInput,
  buildSecureMessages,
  validateEmployeeOutput,
} from '@core/security';

// Input sanitization with configurable blocking
const result = sanitizeEmployeeInput(userMessage, userId, { blockThreshold: 'high' });

// Secure messages with sandwich defense
const messages = buildSecureMessages(systemPrompt, userMessage, employeeName);

// Output validation for data leakage
const validation = validateEmployeeOutput(response.content, employeeName);
```

**Feature Flags** (`gradual-rollout.ts`):

```typescript
import { isFeatureEnabled } from '@core/security/gradual-rollout';

// Security features (100% enabled)
isFeatureEnabled('employee_input_sanitization');
isFeatureEnabled('employee_output_validation');
isFeatureEnabled('sandwich_defense');
```

## Monitoring

**Sentry** configured in `src/main.tsx`:

```typescript
import { captureError, addBreadcrumb, setUser } from '@shared/lib/sentry';

addBreadcrumb({ category: 'user', message: 'Clicked submit' });
captureError(error, { tags: { feature: 'billing' } });
setUser({ id: user.id, email: user.email });
```

**Bundle Size Limits** (`.size-limit.json`): Total JS 2.5 MB, Chat 550 kB, Vibe 350 kB

**Lighthouse Budgets** (`lighthouserc.js`): Performance >= 80%, FCP < 2s, LCP < 4s, TBT < 300ms

## Token System

- `user_token_balances` table with RLS (migration `20260106000002`)
- RPC: `get_or_create_token_balance()`, `deduct_user_tokens()`, `add_user_tokens()`, `cap_user_token_balance()`
- Default: 1M tokens (free tier); Pro/Max plans get more
- Subscription cancellation caps balance at free tier limit

## Testing

**Unit Tests (Vitest)**: 461+ tests in `*.test.ts` files
**E2E Tests (Playwright)**: Located in `e2e/` and `tests/e2e/playwright/`

Key test files:
- `src/core/billing/token-enforcement-service.test.ts`
- `src/core/security/employee-input-sanitizer.test.ts`
- `src/core/security/prompt-injection-detector.test.ts`
- `src/shared/stores/*.test.ts`
