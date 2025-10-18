# Core Infrastructure Services

**Location:** `src/_core/`

This directory contains all infrastructure services that support the application. The underscore prefix (`_core`) makes it visually distinct for AI agents scanning the codebase.

## Service Categories

### 1. API Services (`api/`)

External service integrations and LLM providers.

**Key Files:**

- `llm/unified-llm-service.ts` - **Entry point** for all LLM operations
- `llm/anthropic-provider.ts` - Claude integration
- `llm/google-provider.ts` - Gemini integration
- `llm/openai-provider.ts` - GPT integration
- `llm/perplexity-provider.ts` - Perplexity integration
- `ai/ai-employee-executor.ts` - Orchestrates tool execution for AI employees
- `ai/ai-service.ts` - Core AI employee operations
- `tool-executor-service.ts` - Executes tools/actions
- `web-search-service.ts` - Web search integration

**Usage:**

```typescript
import { unifiedLLMService } from '@_core/api/llm/unified-llm-service';

// Send message
const response = await unifiedLLMService.sendMessage({
  provider: 'openai',
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'gpt-4'
});

// Stream message
for await (const chunk of unifiedLLMService.streamMessage({ ... })) {
  console.log(chunk.content);
}
```

### 2. Monitoring Services (`monitoring/`)

Analytics, performance tracking, SEO, and compliance.

**Services:**

- `monitoring-service.ts` - General monitoring orchestrator
- `analytics-service.ts` - User analytics (events, pageviews)
- `performance-service.ts` - Performance metrics, optimization
- `seo-service.ts` - SEO optimization, meta tags
- `accessibility-service.ts` - A11y compliance
- `scaling-service.ts` - Load balancing, caching
- `privacy-service.ts` - GDPR/privacy compliance

**All services initialized in `App.tsx` useEffect**

### 3. Orchestration Services (`orchestration/`)

Multi-agent coordination and task management.

**Key Files:**

- `multi-agent-orchestrator.ts` - Coordinates multiple AI employees
- `workforce-orchestrator.ts` - Manages workforce tasks
- `execution-coordinator.ts` - Task execution coordination
- `tool-manager.ts` - Manages available tools
- `reasoning/task-decomposer.ts` - Breaks down complex tasks
- `reasoning/agent-selector.ts` - Selects best agent for task
- `reasoning/nlp-processor.ts` - Natural language processing

**Usage:**

```typescript
import { multiAgentOrchestrator } from '@_core/orchestration/multi-agent-orchestrator';

const result = await multiAgentOrchestrator.executeTask({
  task: 'Build a React component',
  agents: selectedEmployees,
  context: { ... }
});
```

### 4. Security Services (`security/`)

Authentication and authorization.

**Files:**

- `auth-service.ts` - Wraps Supabase Auth
- `security/permissions.ts` - Permission checks

**Usage:**

```typescript
import { authService } from '@_core/security/auth-service';

await authService.signIn(email, password);
await authService.signOut();
const user = authService.getCurrentUser();
```

### 5. Storage Services (`storage/`)

Data persistence, caching, backup.

**Files:**

- `supabase/workforce-service.ts` - Supabase workforce operations
- `cache-service.ts` - In-memory caching
- `chat-persistence-service.ts` - Chat history storage
- `backup-service.ts` - Automated backups

## Import Guidelines

### ✅ DO

- Import from `@_core/*` in features
- Import from `@_core/*` in shared utilities
- Use specific imports: `import { unifiedLLMService } from '@_core/api/llm/unified-llm-service'`

### ❌ DON'T

- Import feature code into `@_core/*` (creates circular dependencies)
- Use relative imports: `import { ... } from '../../../_core/...`
- Import entire modules: `import * as core from '@_core/...'`

## Service Initialization Order

1. **Core:** monitoring, accessibility, SEO
2. **Analytics:** (100ms delay)
3. **Performance:** (200ms delay)
4. **Advanced:** backup, scaling, privacy (500ms delay)

See `App.tsx` for full initialization sequence.

## Environment Variables

Most services require environment variables:

- LLM providers: `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, etc.
- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Stripe: `VITE_STRIPE_PUBLISHABLE_KEY`

## Testing

All services have comprehensive error handling and logging. Check browser console for service initialization messages.
