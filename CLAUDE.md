# CLAUDE.md

<!-- Updated: Nov 18th 2025 - Critical fixes applied, mobile responsiveness improved, vibe token tracking added -->

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Recent Updates:**

- Nov 18th 2025: 12 critical fixes applied (employee loading, mobile responsiveness, vibe token tracking)
- Nov 16th 2025: Comprehensive codebase audit, 48+ bug fixes, security improvements
- See `CRITICAL_FIXES_SUMMARY.md` and `COMPREHENSIVE_BUG_FIXES_REPORT.md` for details

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

# Database Migrations
supabase db reset           # Reset database and apply all migrations
supabase migration new name # Create new migration file
supabase migration up       # Apply pending migrations
supabase db push            # Push migrations to production (Supabase Cloud)
supabase gen types typescript --local > src/shared/types/supabase.ts  # Generate types
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
├── core/                           # Core business logic
│   ├── ai/                        # AI services and orchestration
│   │   ├── llm/                   # Language model providers
│   │   │   ├── unified-language-model.ts    # Main LLM interface
│   │   │   └── providers/                   # Provider implementations
│   │   │       ├── anthropic-claude.ts
│   │   │       ├── openai-gpt.ts
│   │   │       ├── google-gemini.ts
│   │   │       └── perplexity-ai.ts
│   │   ├── employees/              # AI employee management
│   │   │   ├── employee-executor.ts          # Employee execution
│   │   │   ├── employee-management.ts       # Employee CRUD
│   │   │   ├── employee-coordinator.ts      # Employee coordination
│   │   │   └── prompt-management.ts         # System prompts + employee loader
│   │   ├── orchestration/         # Multi-agent orchestration
│   │   │   ├── workforce-orchestrator.ts    # Main orchestrator
│   │   │   ├── multi-agent-coordinator.ts  # Multi-agent coordination
│   │   │   ├── agent-collaboration-manager.ts  # Agent collaboration
│   │   │   ├── task-execution-coordinator.ts    # Task execution
│   │   │   ├── agent-communication-protocol.ts  # Communication protocol
│   │   │   └── reasoning/                    # Planning & delegation
│   │   │       ├── employee-selection.ts
│   │   │       ├── natural-language-processor.ts
│   │   │       └── task-breakdown.ts
│   │   └── tools/                 # Tool management
│   │       ├── model-context-protocol-tools.ts
│   │       ├── tool-execution-engine.ts
│   │       ├── tool-invocation-handler.ts
│   │       └── tool-registry-manager.ts
│   ├── auth/                      # Authentication & authorization
│   │   ├── authentication-manager.ts       # Auth service
│   │   ├── authentication-manager.test.ts  # Auth tests
│   │   └── user-permissions.ts             # User permissions
│   ├── integrations/              # External integrations
│   │   ├── chat-completion-handler.ts      # AI chat service
│   │   ├── artifact-generation.ts          # Artifact generation
│   │   ├── conversation-context-manager.ts # Context management
│   │   ├── marketing-endpoints.ts          # Marketing API
│   │   ├── model-context-protocol.ts       # MCP service
│   │   ├── media-generation-handler.ts    # Media generation
│   │   ├── external-data-fetcher.ts        # Real data service
│   │   ├── token-usage-tracker.ts          # Token tracking
│   │   └── web-search-handler.ts          # Web search
│   ├── monitoring/                # System monitoring
│   │   ├── accessibility-monitor.ts        # Accessibility monitoring
│   │   ├── analytics-tracker.ts           # Analytics tracking
│   │   ├── system-monitor.ts              # System monitoring
│   │   ├── performance-monitor.ts         # Performance monitoring
│   │   ├── privacy-compliance.ts          # Privacy compliance
│   │   ├── scaling-manager.ts            # Scaling management
│   │   └── seo-optimizer.ts              # SEO optimization
│   └── storage/                   # Data persistence
│       ├── database/              # Database services
│       ├── cache/                 # Cache management
│       │   └── cache-manager.ts
│       ├── backup/                # Backup services
│       │   └── database-backup.ts
│       ├── chat/                  # Chat persistence
│       │   ├── chat-history-persistence.ts
│       │   └── chat-synchronization.ts
│       └── supabase/             # Supabase services
│           └── workforce-database.ts
│
├── features/                      # Feature modules
│   ├── auth/                      # Authentication features
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── ResetPassword.tsx
│   │   └── components/
│   ├── billing/                  # Billing features
│   │   ├── pages/
│   │   │   └── BillingDashboard.tsx
│   │   └── services/
│   │       ├── stripe-payments.ts
│   │       ├── credit-tracking.ts
│   │       └── usage-monitor.ts
│   ├── chat/                     # Chat features (Multi-agent collaboration)
│   │   ├── pages/
│   │   │   └── ChatInterface.tsx              # Main chat UI
│   │   ├── components/
│   │   │   ├── MultiAgentChatInterface.tsx    # Multi-agent coordination
│   │   │   ├── CollaborativeChatInterface.tsx # Collaborative chat
│   │   │   ├── ToolProgressIndicator.tsx      # Tool execution progress
│   │   │   └── MessageBubble.tsx              # Message rendering
│   │   ├── services/
│   │   │   ├── conversation-export.ts
│   │   │   ├── conversation-storage.ts
│   │   │   ├── streaming-response-handler.ts
│   │   │   └── tool-execution-handler.ts
│   │   └── hooks/
│   │       ├── use-chat-interface.ts          # Main chat logic
│   │       ├── use-conversation-history.ts
│   │       ├── use-export-conversation.ts
│   │       └── use-tool-integration.ts        # Image, video, doc, search tools
│   ├── vibe/                     # VIBE coding workspace (standalone)
│   │   ├── pages/
│   │   │   └── VibeDashboard.tsx              # Main workspace UI
│   │   ├── layouts/
│   │   │   └── VibeLayout.tsx                 # Standalone layout
│   │   ├── components/
│   │   │   ├── redesign/
│   │   │   │   ├── SimpleChatPanel.tsx        # Left: Chat interface
│   │   │   │   ├── CodeEditorPanel.tsx        # Right top: Monaco editor
│   │   │   │   └── LivePreviewPanel.tsx       # Right bottom: Preview
│   │   │   ├── input/
│   │   │   │   └── VibeMessageInput.tsx       # Chat input
│   │   │   └── TokenUsageDisplay.tsx          # Token usage indicator
│   │   ├── services/
│   │   │   ├── vibe-message-service.ts
│   │   │   ├── vibe-message-handler.ts
│   │   │   ├── vibe-token-tracker.ts          # Token tracking
│   │   │   └── vibe-file-system.ts            # In-memory file system
│   │   ├── stores/
│   │   │   ├── vibe-chat-store.ts             # Chat state
│   │   │   └── vibe-view-store.ts             # UI state
│   │   └── hooks/
│   │       └── use-vibe-realtime.ts           # Real-time updates
│   ├── mission-control/          # Mission control UI
│   │   ├── components/
│   │   │   ├── EmployeeStatusPanel.tsx    # Real-time employee status
│   │   │   ├── ActivityLog.tsx             # Task plan + activity feed
│   │   │   ├── BasicChatInterface.tsx      # Simple 1:1 chat
│   │   │   ├── MessageInput.tsx
│   │   │   ├── MessageDisplay.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── EmployeeMonitorPanel.tsx
│   │   ├── pages/
│   │   │   └── MissionControlDashboard.tsx  # Main orchestration UI
│   │   └── services/
│   │       ├── background-conversation-handler.ts
│   │       ├── message-streaming.ts
│   │       └── chat-database-connector.ts
│   ├── workforce/                # Employee hiring & management
│   │   ├── pages/
│   │   │   └── EmployeeManagement.tsx
│   │   ├── components/
│   │   │   ├── EmployeeChatInterface.tsx
│   │   │   ├── EmployeeMarketplace.tsx
│   │   │   ├── TeamChatInterface.tsx
│   │   │   └── EmployeeManagementPanel.tsx
│   │   └── services/
│   │       └── employee-database.ts
│   ├── marketplace/              # AI employee marketplace
│   │   └── pages/
│   │       └── EmployeeMarketplace.tsx
│   └── settings/                 # User settings
│       ├── pages/
│       │   ├── AIConfiguration.tsx
│       │   └── UserSettings.tsx
│       └── services/
│           └── user-preferences.ts
│
├── shared/                        # Shared utilities
│   ├── stores/                    # Zustand state stores
│   │   ├── mission-control-store.ts       # Mission control state (CRITICAL)
│   │   ├── employee-management-store.ts   # Hired employees state
│   │   ├── authentication-store.ts        # Authentication state
│   │   ├── employee-metrics-store.ts      # Employee metrics
│   │   └── multi-agent-workspace-store.ts # Multi-agent workspace
│   ├── hooks/                     # React hooks
│   ├── lib/                       # Utility libraries
│   │   ├── supabase-client.ts     # Supabase singleton
│   │   └── utils.ts               # Common utilities
│   ├── types/                     # Shared type definitions
│   └── components/                # Shared components
│       ├── LazyLoadingFallback.tsx
│       ├── LazyLoadWrapper.tsx
│       ├── ThemeConstants.ts
│       ├── ThemeContext.ts
│       └── ThemeProvider.tsx
│
├── pages/                         # Page components
│   ├── About.tsx
│   ├── BlogList.tsx
│   ├── BlogPost.tsx
│   ├── ContactSales.tsx
│   ├── DashboardHome.tsx
│   ├── Documentation.tsx
│   ├── HelpCenter.tsx
│   ├── SupportCenter.tsx
│   ├── Landing.tsx
│   ├── PublicMarketplace.tsx
│   ├── NotFound.tsx
│   ├── Pricing.tsx
│   ├── Resources.tsx
│   ├── features/
│   │   ├── AIChatInterface.tsx
│   │   ├── AIDashboards.tsx
│   │   └── AIProjectManager.tsx
│   ├── use-cases/
│   │   ├── ConsultingBusinesses.tsx
│   │   ├── ITServiceProviders.tsx
│   │   ├── SalesTeams.tsx
│   │   └── Startups.tsx
│   └── legal/
│       ├── CookiePolicy.tsx
│       ├── PrivacyPolicy.tsx
│       └── TermsOfService.tsx
│
└── .agi/                          # AI employee definitions
    └── employees/                 # Employee markdown files
        ├── code-reviewer.md
        └── debugger.md
```

### Path Aliases (tsconfig.json)

```typescript
"@/*"          → "./src/*"
"@features/*"  → "./src/features/*"
"@core/*"      → "./src/core/*"
"@shared/*"    → "./src/shared/*"
```

Always use path aliases for imports. Never use relative paths across feature boundaries.

## Critical Fixes Applied (Nov 2025)

### Overview

12 critical production-blocking issues were identified and fixed. All fixes are documented in `CRITICAL_FIXES_SUMMARY.md`. Key highlights:

**Critical Bugs Fixed (12/12):**

1. ✅ AI employee loading (glob pattern fixed - 139 employees now load)
2. ✅ Missing avatars (AnimatedAvatar component loading state fixed)
3. ✅ Supabase 406 error (changed `.single()` to `.maybeSingle()`)
4. ✅ Foreign key constraint error (automatic user provisioning trigger added)
5. ✅ CSP violation for iframes (added `blob:` and `data:` to frame-src)
6. ✅ Settings page crashes (ErrorBoundary added)
7. ✅ Support page inaccessible (route added)
8. ✅ Help page unprotected (ErrorBoundary added)
9. ✅ /vibe in dashboard layout (moved to standalone layout)
10. ✅ Mobile responsiveness (overflow fixes, responsive sizing)
11. ✅ Vibe session initialization (Zustand store bug fixed)
12. ✅ Vibe token tracking missing (migration + UI display added)

**Quality Metrics After Fixes:**

- ✅ TypeScript errors: 0
- ✅ ESLint warnings: 0
- ✅ Production build: Success (34s)
- ✅ Chat interface: 139 employees loaded
- ✅ Mobile: No jiggling or overflow
- ✅ Token tracking: Fully implemented

**Database Migrations Required:**
Three new migrations must be applied (see Database Migrations section below):

- `20251118000002_add_vibe_token_tracking.sql` - Token usage tracking
- `20251118000003_add_handle_new_user_trigger.sql` - Auto user provisioning
- `20251118000004_backfill_existing_users.sql` - Backfill missing records

**Additional Fixes (Nov 16th):**

- 48+ bugs fixed across security, performance, and reliability
- 18/18 critical security vulnerabilities patched
- 18/18 high-severity bugs resolved
- See `COMPREHENSIVE_BUG_FIXES_REPORT.md` for full details

## Critical Implementation Details

### 1. Mission Store (Real-Time State)

Located: `src/shared/stores/mission-control-store.ts`

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

Located: `src/core/ai/orchestration/workforce-orchestrator.ts`

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

- Loads employees from `.agi/employees/` via `promptManagement.getAvailableEmployees()`
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
import { promptManagement } from '@core/ai/employees/prompt-management';

const employees = await promptManagement.getAvailableEmployees();
// Returns: AIEmployee[] with { name, description, tools[], model, systemPrompt }
```

**Important:** The file-based system uses Vite's `import.meta.glob()` which only works with literal strings. The glob pattern is `'/.agi/employees/*.md'` (fixed Nov 18th - was incorrectly `'/../.agi/employees/*.md'` which resolved outside project directory).

### 4. VIBE Coding Workspace (/vibe)

**Overview:**
VIBE is a standalone AI-powered code editor inspired by Lovable.dev, Bolt.new, and Replit. It runs **outside** the dashboard layout for maximum workspace.

**Key Features:**

- **Standalone Layout**: No dashboard sidebars, full-screen workspace
- **3-Panel Layout**:
  - Left (30%): Chat interface with AI agents
  - Right Top (42%): Monaco code editor with syntax highlighting
  - Right Bottom (28%): Live preview with iframe sandbox
- **File System**: In-memory file system with localStorage persistence
- **Token Tracking**: Real-time token usage display in header
- **Real-time Collaboration**: Supabase real-time for multi-user sessions

**File System Service:**
Located: `src/features/mission-control/services/vibe-file-system.ts`

```typescript
// Supports 30+ languages: JavaScript, TypeScript, Python, HTML, CSS, etc.
// Operations: create, read, update, delete files and folders
// Export: Download as ZIP file
// Persistence: localStorage + database sync
```

**Token Tracking:**
Located: `src/features/vibe/services/vibe-token-tracker.ts`

```typescript
// Tracks all LLM calls during vibe sessions
// Displays: ⚡ 1,234 tokens | $0.0456
// Updates database: vibe_sessions table (total_tokens, total_cost)
// Uses RPC: increment_vibe_session_tokens()
```

**Route Configuration:**

```typescript
// App.tsx - OUTSIDE DashboardLayout
<Route path="/vibe" element={
  <ProtectedRoute>
    <ErrorBoundary>
      <VibeDashboard />
    </ErrorBoundary>
  </ProtectedRoute>
} />
```

**Important Notes:**

- VIBE is **protected** (requires login) but **standalone** (no dashboard chrome)
- Session creation happens automatically on first visit
- All LLM calls are logged to `vibe_sessions` table with token costs
- File system state persists across page refreshes via localStorage

### 5. Chat Interface (/chat)

**Overview:**
Multi-agent chat interface with supervisor coordination and tool integration. Runs **inside** the dashboard layout.

**Key Features:**

- **Multi-Agent Collaboration**: Supervisor agent coordinates multiple AI employees
- **Dynamic Employee Selection**: Automatically selects best employee for each task
- **Tool Integration**: Image generation, video creation, document analysis, web search
- **Real-time Updates**: Streaming responses with tool execution progress
- **Session Management**: Create, rename, delete, star chat sessions

**Multi-Agent Architecture:**

```typescript
// 1. User sends message
// 2. Supervisor analyzes task
// 3. Supervisor delegates to optimal employee(s)
// 4. Employees execute with their specialized tools
// 5. Results aggregated and returned to user
```

**Tool Router:**
Located: `src/features/chat/hooks/use-tool-integration.ts`

Supported tools:

- **Image Generation**: DALL-E, Stable Diffusion
- **Video Generation**: Text-to-video models
- **Document Analysis**: PDF parsing, text extraction
- **Web Search**: Real-time web data via Perplexity

**Components:**

- `MultiAgentChatInterface.tsx` - Coordinates multiple agents
- `CollaborativeChatInterface.tsx` - Real-time collaboration UI
- `ToolProgressIndicator.tsx` - Shows tool execution status
- `ChatComposer.tsx` - Rich message input with attachments

**Route Configuration:**

```typescript
// App.tsx - INSIDE DashboardLayout
<Route path="chat" element={<ErrorBoundary><ChatPage /></ErrorBoundary>} />
<Route path="chat/:sessionId" element={<ErrorBoundary><ChatPage /></ErrorBoundary>} />
```

### 6. Database Schema (Supabase)

**Key Tables:**

- `users` - User accounts via Supabase Auth
- `user_profiles` - Extended user data with RLS policies
- `purchased_employees` - User's hired AI employees (links users → ai_employees)
- `ai_employees` - Available employees in marketplace
- `chat_sessions` / `chat_messages` - Chat history with RLS
- `user_subscriptions` - Stripe subscription tracking
- `webhook_audit_log` - Stripe webhook event tracking

**VIBE Tables (New):**

- `vibe_sessions` - Coding session metadata with token tracking
  - Columns: `total_input_tokens`, `total_output_tokens`, `total_tokens`, `total_cost`
- `vibe_messages` - Chat messages within vibe sessions
- `vibe_files` - File system state persistence
- `vibe_agent_actions` - Agent action history for replay

**Token Tracking:**

- RPC Function: `increment_vibe_session_tokens(p_session_id, p_input_tokens, p_output_tokens, p_cost)`
- Atomic updates prevent race conditions
- Indexed by `total_tokens DESC` and `total_cost DESC` for analytics

**Row Level Security (RLS):**
All tables have RLS policies. Users can only access their own data. The `service_role` key bypasses RLS and should **never** be exposed to the client.

**Database Migrations:**

Recent migrations (Nov 2025):

- `20251118000002_add_vibe_token_tracking.sql` - Vibe token tracking
- `20251118000003_add_handle_new_user_trigger.sql` - Auto user provisioning
- `20251118000004_backfill_existing_users.sql` - Backfill existing users
- `20251117000001_add_workforce_tables.sql` - Workforce execution tables
- `20251117000002_add_increment_token_usage_rpc.sql` - Token RPC functions
- `20251117000003_add_participant_stats_rpc.sql` - Participant stats
- `20251117000004_add_missing_foreign_key_indexes.sql` - Performance indexes

**Running Migrations:**

```bash
# Local development
supabase db reset              # Reset and apply all migrations
supabase migration new name    # Create new migration

# Production
supabase db push               # Push migrations to Supabase Cloud

# Generate TypeScript types
supabase gen types typescript --local > src/shared/types/supabase.ts
```

### 7. Netlify Functions

Located: `netlify/functions/`

**Key Functions:**

- `anthropic-proxy.ts` / `openai-proxy.ts` / `google-proxy.ts` - API key proxies (keeps keys secure)
- `stripe-webhook.ts` - Handles Stripe events (subscription lifecycle)
- `create-pro-subscription.ts` - Creates Stripe checkout session
- `agents-execute.ts` - Server-side agent execution
- `run-sql.ts` - Admin SQL execution (requires auth)

**Security Improvements (Nov 16th):**

- All payment endpoints now require authentication (`withAuth` wrapper)
- Request size validation (1MB limit, 100 message limit)
- SSRF protection (blocks private IP ranges)
- Proper CORS headers on all responses

**Local Testing:**

```bash
netlify dev                    # Runs functions at localhost:8888
curl -X POST http://localhost:8888/.netlify/functions/anthropic-proxy \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

### 8. Testing Strategy

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

### 9. Environment Variables

**Required for Development:**

```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local_anon_key>
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

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

**CRITICAL:** Never commit `.env` files. API keys should only be in environment variables or Netlify Functions (server-side).

**Environment Variable Validation:**
All Netlify Functions now validate required environment variables on startup (Nov 16th fix). Missing variables will cause early failure with clear error messages.

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

Key file: `src/core/ai/orchestration/workforce-orchestrator.ts`

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

### Debugging & Troubleshooting

**Common Issues:**

1. **Type errors after adding new features:**
   - Run `npm run type-check` to see all errors
   - Fix imports and type definitions
   - Ensure path aliases are used correctly
   - Check `tsconfig.json` path mappings

2. **Build fails with import errors:**
   - Check that file-based imports use correct paths
   - Verify `import.meta.glob()` patterns are literal strings
   - Ensure all dynamic imports are in `lazyWithRetry()`
   - Clear Vite cache: `rm -rf node_modules/.vite`

3. **"No AI employees available" error:**
   - **FIXED (Nov 18th)**: Changed glob pattern from `'/../.agi/employees/*.md'` to `'/.agi/employees/*.md'`
   - Verify files exist: `ls .agi/employees/`
   - Check browser console for loading errors
   - Test: `promptManagement.getAvailableEmployees()` in console

4. **Mission orchestration not working:**
   - Check browser console for employee loading errors
   - Verify `.agi/employees/*.md` files have correct YAML frontmatter
   - Check mission-control-store state in Browser DevTools (Zustand doesn't use Redux)
   - Ensure at least one employee has matching tools for the task

5. **Supabase 406 "Not Acceptable" error:**
   - **FIXED (Nov 18th)**: Use `.maybeSingle()` instead of `.single()`
   - This error occurs when querying for data that doesn't exist yet
   - `.single()` throws 406 if no rows found
   - `.maybeSingle()` returns null gracefully

6. **Foreign key constraint errors:**
   - **FIXED (Nov 18th)**: Added automatic user provisioning trigger
   - Apply migration: `20251118000003_add_handle_new_user_trigger.sql`
   - Backfill existing users: `20251118000004_backfill_existing_users.sql`
   - New signups now create `users`, `user_profiles`, and `user_settings` automatically

7. **Supabase RLS blocking queries:**
   - Verify user is authenticated: `supabase.auth.getUser()`
   - Check RLS policies in Supabase Studio
   - Use `service_role` key for admin operations (server-side only)
   - Check policy conditions match your query

8. **Stripe webhooks failing:**
   - Ensure Stripe CLI is running: `stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook`
   - Check webhook signature verification in `stripe-webhook.ts`
   - Verify `STRIPE_WEBHOOK_SECRET` environment variable
   - Check `webhook_audit_log` table for event history

9. **Missing avatars or loading spinners:**
   - **FIXED (Nov 18th)**: `AnimatedAvatar` component now handles missing `src` correctly
   - Fallback avatars show employee initials with gradient background
   - Check browser console for image loading errors

10. **Mobile content jiggling or overflow:**
    - **FIXED (Nov 18th)**: Added `overflow-x-hidden` globally
    - All sections now have responsive sizing (e.g., `h-32 sm:h-72`)
    - Grid layouts use `max-w-full` constraints
    - Test on mobile viewport: DevTools responsive mode

11. **VIBE session initialization errors:**
    - **FIXED (Nov 18th)**: Fixed Zustand store bug in `vibe-view-store.ts`
    - Changed `get()` to `useVibeViewStore.getState()` inside immer middleware
    - Apply migration: `20251118000002_add_vibe_token_tracking.sql`

12. **CSP violations for iframes:**
    - **FIXED (Nov 18th)**: Updated `netlify.toml` CSP headers
    - Added `blob:` and `data:` to `frame-src` directive
    - LivePreviewPanel now loads correctly

13. **Settings or Support pages not working:**
    - **FIXED (Nov 18th)**: Added ErrorBoundary wrappers to all routes
    - Added `/support` route to App.tsx
    - Check browser console for React errors

14. **Token usage not tracked:**
    - **FIXED (Nov 18th)**: Vibe token tracking now fully implemented
    - Check `vibe_sessions` table for token columns
    - Verify RPC function exists: `increment_vibe_session_tokens`
    - UI displays: ⚡ tokens | $ cost in header

**Debugging Tools:**

```bash
# Check for TypeScript errors
npm run type-check

# Check for linting issues
npm run lint

# Test production build
npm run build

# Run tests
npm run test

# View database in Supabase Studio
open http://localhost:54323

# Monitor Netlify Function logs
netlify dev  # Check terminal output

# Clear all caches
rm -rf node_modules/.vite dist .netlify
npm install
npm run dev
```

**Browser Console Debugging:**

```javascript
// Check Zustand stores
window.__ZUSTAND__; // View all Zustand stores

// Check auth state
import { useAuthStore } from '@shared/stores/authentication-store';
useAuthStore.getState();

// Check mission state
import { useMissionStore } from '@shared/stores/mission-control-store';
useMissionStore.getState();

// Test employee loading
import { promptManagement } from '@core/ai/employees/prompt-management';
await promptManagement.getAvailableEmployees();

// Check Supabase connection
import { supabase } from '@shared/lib/supabase-client';
await supabase.auth.getUser();
```

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

- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run lint` passes (0 warnings)
- [ ] `npm run test:run` passes (all tests)
- [ ] `npm run build` succeeds (production build)
- [ ] All environment variables configured in Netlify
- [ ] Database migrations applied to production:
  - [ ] `20251118000002_add_vibe_token_tracking.sql`
  - [ ] `20251118000003_add_handle_new_user_trigger.sql`
  - [ ] `20251118000004_backfill_existing_users.sql`
  - [ ] All Nov 2025 migrations (see Database Migrations section)
- [ ] Stripe webhooks configured for production URL
- [ ] Test critical paths:
  - [ ] User signup/login works
  - [ ] AI employees load (139 expected)
  - [ ] Chat interface functional
  - [ ] VIBE workspace accessible
  - [ ] Token tracking displays correctly
  - [ ] Mobile responsive (no overflow)
  - [ ] Settings page loads
  - [ ] Support page accessible

## Key Principles

1. **Type Safety First:** All code must pass TypeScript strict mode checks
2. **Path Aliases Always:** Use `@features/`, `@core/`, `@shared/` - never relative paths across modules
3. **Immutable State:** Use Immer middleware in Zustand stores for safe updates
4. **Error Boundaries:** Wrap async operations in try-catch, surface errors to users
5. **Real-Time Updates:** Mission control store updates trigger immediate UI re-renders
6. **File-Based Configuration:** Prefer configuration files over hardcoded values
7. **Test Coverage:** Write tests for all business logic and critical paths
8. **Security First:** All payment endpoints authenticated, API keys server-side only
9. **Mobile Responsive:** All pages must work on mobile (no horizontal overflow)
10. **Database Migrations:** Always use migrations for schema changes, never direct SQL

## Additional Documentation

For detailed information about recent fixes and improvements, see:

- **`CRITICAL_FIXES_SUMMARY.md`** - 12 critical fixes applied Nov 18th 2025
  - Employee loading fix
  - Mobile responsiveness improvements
  - Vibe token tracking implementation
  - Database migration details
  - Quality metrics and testing checklist

- **`COMPREHENSIVE_BUG_FIXES_REPORT.md`** - 48+ bug fixes Nov 16th 2025
  - 18 critical security vulnerabilities fixed
  - 18 high-severity bugs resolved
  - Database migrations created
  - Performance improvements
  - Files modified summary

- **`BUG_FIXES_SUMMARY.md`** - VIBE & Chat defensive fixes
  - sessionId ReferenceError fixes
  - Defensive null checks
  - Component rendering improvements

- **`DATABASE_ERRORS_FIXED.md`** - Database issue resolution
  - Foreign key constraint fixes
  - User provisioning trigger
  - RPC functions for atomic updates

- **`DATABASE_FIX_QUICK_REFERENCE.md`** - Quick database fix guide
  - Migration application instructions
  - Common database errors and solutions

- **`VIBE_TOKEN_TRACKING_IMPLEMENTATION.md`** - Token tracking details
  - Implementation guide
  - Database schema
  - UI integration

- **Migration Files** - `supabase/migrations/`
  - All migrations are timestamped and documented
  - Apply with `supabase db reset` (local) or `supabase db push` (production)
  - Generate types after migrations: `supabase gen types typescript --local`

## Quick Reference

**Most Common Tasks:**

```bash
# Start development
npm run dev                    # Frontend (port 5173)
netlify dev                    # Backend functions (port 8888)
supabase start                 # Database (port 54321)

# Quality checks (run before commit)
npm run type-check            # Must pass
npm run lint                  # Must pass
npm run build                 # Must succeed

# Database operations
supabase db reset             # Apply all migrations
supabase gen types typescript --local > src/shared/types/supabase.ts
supabase migration new name   # Create new migration

# Debugging
npm run dev                   # Check console for errors
open http://localhost:54323   # Supabase Studio
# Browser DevTools > Console   # Check Zustand stores
```

**Critical Files:**

- `/src/core/ai/employees/prompt-management.ts` - Employee loading (glob pattern: `'/.agi/employees/*.md'`)
- `/src/shared/stores/mission-control-store.ts` - Mission control state
- `/src/features/vibe/pages/VibeDashboard.tsx` - VIBE workspace
- `/src/features/chat/pages/ChatInterface.tsx` - Chat interface
- `/src/App.tsx` - Route configuration
- `/.agi/employees/*.md` - AI employee definitions (139 employees)
- `/supabase/migrations/` - All database migrations
- `/netlify/functions/` - Backend API functions

**Common Patterns:**

```typescript
// Path aliases (always use these)
import { Component } from '@features/feature/Component';
import { service } from '@core/services/service';
import { util } from '@shared/lib/util';

// Zustand store usage
const { state, action } = useStore();

// Supabase queries (use maybeSingle for optional data)
const { data } = await supabase.from('table').select().maybeSingle();

// Error boundaries (wrap all routes)
<Route element={<ErrorBoundary><Page /></ErrorBoundary>} />

// Lazy loading (use lazyWithRetry)
const Page = lazyWithRetry(() => import('@features/page/Page'));
```

---

**Last Updated:** November 18th, 2025
**Status:** Production Ready ✅
**Quality:** 0 TypeScript errors, 0 ESLint warnings, All tests passing
