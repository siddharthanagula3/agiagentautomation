# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **AGI Agent Automation Platform** - a comprehensive AI workforce management system built with React, TypeScript, Vite, and Supabase. The platform enables users to hire, manage, and coordinate AI employees for various business tasks and automation workflows.

## Key Commands

### Development
```bash
npm run dev                # Start dev server (port 8080)
npm run build             # Production build
npm run build:dev         # Development build
npm run build:prod        # Production build with optimizations
npm run preview           # Preview production build
```

### Testing
```bash
npm test                  # Run tests
npm run test:run          # Run tests once (CI mode)
npm run test:watch        # Run tests in watch mode
npm run test:ui           # Run tests with UI
npm run test:coverage     # Generate coverage report
```

### Code Quality
```bash
npm run lint              # Lint code with ESLint
npm run type-check        # TypeScript type checking (npx tsc --noEmit)
```

### Maintenance
```bash
npm run clean             # Clean build artifacts
npm run clean:all         # Remove dist, node_modules, package-lock
npm run reinstall         # Clean reinstall dependencies
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn UI components
- **State Management**: Zustand (client) + React Query (server)
- **Database**: Supabase (PostgreSQL)
- **Routing**: React Router v6
- **AI Providers**: OpenAI, Anthropic, Google Gemini, Perplexity
- **Testing**: Vitest + Testing Library

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn base components
│   ├── automation/     # Workflow designer, integration panels
│   ├── chat/           # Multi-tab chat interface
│   ├── dashboard/      # Dashboard-specific components
│   ├── employees/      # Workforce management
│   └── auth/           # Authentication components
├── pages/              # Page-level components (routes)
├── layouts/            # Layout wrappers (Admin, Auth, Public)
├── stores/             # Zustand state stores
├── services/           # API services and business logic
├── integrations/       # Tool integration management
├── hooks/              # Custom React hooks
├── lib/                # Utilities (utils, api-client, auth, cache)
├── types/              # TypeScript type definitions
└── prompts/            # AI employee system prompts
```

### Core Systems

#### 1. State Management
- **Zustand stores** located in `src/stores/`:
  - `unified-auth-store.ts` - Authentication & user state
  - `chat-store.ts` - Chat conversations & messages
  - `workforce-store.ts` - AI workforce management
  - `ai-employee-store.ts` - Employee marketplace
  - `ui-store.ts` - UI state & theme
  - `app-store.ts` - Global app state
- All stores exported from `src/stores/index.ts`
- Server state managed by React Query (`@tanstack/react-query`)

#### 2. AI Chat Service
- Multi-provider support in `src/services/ai-chat-service.ts`
- Providers: OpenAI (GPT), Anthropic (Claude), Google (Gemini), Perplexity
- Environment variables for API keys: `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_GOOGLE_API_KEY`, `VITE_PERPLEXITY_API_KEY`
- Default Gemini model: `gemini-2.0-flash` (configurable via `VITE_GEMINI_MODEL`)

#### 3. Tool Integration System
- Centralized management in `src/integrations/tool-integrations.ts`
- `ToolIntegrationManager` singleton handles:
  - Integration registration/deactivation
  - Tool execution queue with rate limiting
  - Usage statistics and cost tracking
  - Authentication (API key, OAuth, Bearer token, Basic auth)
- Integration types: `ai_service`, `automation`, `communication`, `development`, `data_processing`, `monitoring`, `analytics`, `storage`, `security`

#### 4. Supabase Integration
- Client setup in `src/integrations/supabase/client.ts`
- Database migrations in `supabase/migrations/`
- Key tables: `users`, `ai_employees`, `chat_conversations`, `automation_workflows`, `integrations`
- Row-Level Security (RLS) policies enabled
- Real-time subscriptions via `src/services/realtimeService.ts`

#### 5. Visual Workflow Designer
- Node-based workflow builder: `src/components/automation/VisualWorkflowDesigner.tsx`
- Integration settings panel: `src/components/automation/IntegrationSettingsPanel.tsx`
- Multi-tab support for managing multiple workflows
- Tool execution and real-time monitoring

### Database Schema
The application uses Supabase with 5+ migration files:
1. `001_initial_schema.sql` - Core tables (users, employees, chat)
2. `003_settings_tables.sql` - Settings configuration
3. `004_complete_workforce_schema.sql` - Workforce management
4. `005_analytics_tables.sql` - Analytics and metrics
5. `006_automation_tables.sql` - Automation workflows

Run migrations via Supabase dashboard SQL Editor.

### Environment Variables
Required environment variables (see `.env.example`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- At least one AI API key: `VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_GOOGLE_API_KEY`, or `VITE_PERPLEXITY_API_KEY`
- Optional: `VITE_DEMO_MODE=true` for testing without API keys

### Build Configuration
- **Vite config**: `vite.config.ts`
  - Dev server on port 8080 with IPv6 support
  - API proxy: `/api` → `http://localhost:8000`
  - WebSocket proxy: `/ws` → `ws://localhost:8000`
  - Code splitting: react-vendor, router, ui, supabase, utils
  - Terser minification with console preservation
  - Path alias: `@` → `./src`

### Key Design Patterns

#### Component Architecture
- Functional components with hooks (no class components)
- Composition via props (className, children, etc.)
- Shadcn UI components as base layer
- Controlled components for forms (react-hook-form + zod)
- Error boundaries for graceful error handling

#### Data Fetching
- React Query for server state caching
- Optimistic updates where applicable
- Stale time: 5 minutes default
- Retry: 1 attempt
- Refetch on window focus: disabled

#### Authentication Flow
- Unified auth store manages session state
- Protected routes via `ProtectedRoute` component
- Admin routes via `AdminRoute` component
- Permission-based access via `PermissionGate`
- Auth service in `src/services/authService.ts`

#### AI Employee System
- Pre-configured system prompts in `src/prompts/`
- Employee types: Data Analyst, Content Writer, Code Assistant, etc.
- Tool invocation service: `src/services/tool-invocation-service.ts`
- MCP (Model Context Protocol) tools: `src/tools/mcp-tools.ts`

### Common Development Tasks

#### Adding a New Integration
1. Use `createIntegration()` from `src/integrations/tool-integrations.ts`
2. Register via `toolIntegrationManager.registerIntegration()`
3. Define authentication config and rate limits
4. Implement operation handlers in the manager

#### Creating a New Page
1. Add page component in `src/pages/{category}/`
2. Define route in `src/AppRouter.tsx`
3. Wrap with appropriate layout (AdminLayout, AuthLayout, PublicLayout)
4. Add to navigation if needed

#### Adding a Store
1. Create store file in `src/stores/`
2. Define store using Zustand's `create()`
3. Export store hook and types
4. Add export to `src/stores/index.ts`

#### Implementing AI Chat
1. Import `sendToOpenAI`, `sendToAnthropic`, or `sendToGoogleAI` from `src/services/ai-chat-service.ts`
2. Format messages as `AIMessage[]` (role + content)
3. Handle response and errors
4. Store conversation in Supabase via `src/services/supabase-chat.ts`

#### Working with Supabase
1. Use client from `src/integrations/supabase/client.ts`
2. Service functions in `src/services/supabase-*.ts`
3. Type definitions in `src/integrations/supabase/types.ts`
4. Always handle RLS policies

### Theme System
- Light/dark mode via `next-themes`
- Theme toggle: `src/components/ui/theme-toggle.tsx`
- CSS variables in `src/index.css` (`:root` and `.dark` selectors)
- Semantic tokens: `--primary`, `--secondary`, `--accent`, `--background`, `--foreground`, etc.
- All components support theme via Tailwind classes

### Deployment Notes
- Build target: ES2020
- Optimized for modern browsers
- Chunk size limit: 1000kb
- Source maps disabled in production
- Console logs preserved (errors only in production)
- Compatible with Netlify, Vercel, and static hosting

### Testing Strategy
- Vitest for unit/integration tests
- React Testing Library for component tests
- Test files colocated in `__tests__/` directories
- Coverage reports via `npm run test:coverage`
- UI test runner via `npm run test:ui`

### Important Files
- **Entry point**: `src/main.tsx` - App initialization with React Query, Router, Error Boundary
- **Router**: `src/AppRouter.tsx` - Route definitions
- **Stores index**: `src/stores/index.ts` - Central store exports
- **Tool integration**: `src/integrations/tool-integrations.ts` - Integration management
- **AI service**: `src/services/ai-chat-service.ts` - Multi-provider AI chat
- **Supabase client**: `src/integrations/supabase/client.ts` - Database connection

### Debugging
- React Query DevTools available in dev mode
- Supabase connection test: `src/utils/test-supabase.ts` (auto-runs in dev)
- Console logging enabled in dev mode
- Initial loader handling in `main.tsx`
