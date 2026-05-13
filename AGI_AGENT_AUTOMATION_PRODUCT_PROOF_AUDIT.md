# AGI Agent Automation Product-Proof Audit

Audit date: 2026-05-12  
Repository: `/Users/siddhartha/Desktop/agiagentautomation`  
Auditor stance: evidence-first, resume-safe, no exaggeration, no implication of independent hand-coding.

## Executive Summary

AGI Agent Automation is a Vite + React + TypeScript SaaS-style prototype for an AI workforce platform. The repository contains a public marketing site, protected dashboard, AI employee marketplace, chat interface, multi-agent orchestration modules, a Vibe-style coding workspace, Supabase migrations, Netlify serverless functions, Stripe billing code, and local test/e2e infrastructure.

The strongest verified claim is not "150+ autonomous AI employees are live." The strongest safe claim is: Siddhartha orchestrated AI-assisted development of a substantial AI workforce SaaS prototype with a 165-entry static agent catalog, 140 markdown prompt files, Supabase-backed auth/data models, Netlify LLM proxy functions, multi-agent orchestration prototypes, Stripe billing code, and a Vite production build that currently succeeds.

The repo builds and typechecks, but it is not cleanly production-proven. Unit tests currently fail: `19 failed | 2107 passed | 6 skipped`. Lint exits successfully but reports `665 warnings`. E2E could not execute browser flows because the local Playwright Chromium binary is missing. There is a verified public URL reference and the live site at https://www.agiworkforce.com/ was reachable during this audit, but the repo does not prove real users, revenue, uptime, analytics, usage logs, or paying customers.

The honest positioning is: AI-native product builder / AI Solutions Engineer candidate who can use Claude Code, Cursor, Codex, and related tools to design, assemble, audit, and ship complex AI product prototypes. Do not present this as a fully validated production agent company.

## Repository Overview

### What This Is

This is primarily a web SaaS/product prototype, not just a chatbot. It combines:

- Public marketing website for AGI Workforce / AGI Agent Automation.
- Protected React app with dashboard, chat, marketplace, workforce management, mission control, settings, billing, and support.
- AI employee/agent catalog and prompt library.
- Multi-agent orchestration and supervisor-pattern services.
- Netlify functions for LLM provider proxies, billing, auth/rate limiting, notifications, and utility operations.
- Supabase database migrations and edge functions.
- A Vibe-style AI coding workspace with Monaco/Sandpack-style file editing and preview.
- E2E, unit, security, bundle, and deployment configuration.

Classification: SaaS-style AI workforce automation prototype. It is closer to an "AI employee marketplace + multi-agent workflow/chat platform + coding workspace prototype" than a plain chatbot.

### Major Folder Map

| Path | What it does |
|---|---|
| `.agi/employees` | 140 markdown prompt/persona files for AI employees, including supervisor, engineers, designers, legal/medical/business roles. |
| `.github/workflows` | CI, security, CodeQL, test/build/lighthouse/bundle workflows. |
| `audit-findings` | Prior audit/security notes and reports. |
| `blogs` | Marketing/blog drafts. These are copy assets, not proof of product functionality. |
| `dist` | Built Vite output from prior/current builds. |
| `docs` | Integration and operations docs for media generation, web search, tools, environment variables. Some docs are stale versus code. |
| `e2e` | Playwright E2E specs and screenshot helpers; 164 files counted. |
| `netlify/functions` | 40 serverless function files for LLM proxies, payments, agents, notifications, utilities, auth/rate-limit helpers, and function tests. |
| `public` | Static assets, redirects, headers, sitemap, service worker. |
| `scripts` | Supabase migration scripts, Stripe setup/verification scripts, DB cleanup, blog and Vibe workflows. |
| `src/core` | AI/LLM/orchestration, auth, billing, integrations, monitoring, security, storage. |
| `src/features` | App features: auth, billing, chat, marketplace, mission control, settings, support, Vibe, workforce. |
| `src/pages` | Public site pages, resources, legal pages, dashboard landing. |
| `src/shared` | Shared UI, stores, hooks, services, config, types, utilities. |
| `supabase/migrations` | 67 migration files for users, subscriptions, employees, chat, multi-agent tables, Vibe tables, billing/token tables, support/content tables, RLS. |
| `supabase/functions` | Edge functions for chat, blog posts, contact form, newsletter, resource downloads, workforce execution. |
| `tests` | Additional test/support assets. |
| `windows-mcp-server` | Separate Python MCP server subproject for Windows automation, likely not integrated into the web app runtime. |

Counts gathered locally:

- `src` files: 605.
- `netlify/functions` files: 40.
- `supabase/migrations` files: 67.
- `.agi/employees/*.md`: 140.
- Static marketplace employees in `src/data/marketplace-employees.ts`: 165.

## Product Concept

Plain English: AGI Agent Automation is a prototype web app where users can browse or hire AI "employees", chat with one or more agents, route tasks through supervisor/orchestrator services, generate artifacts/media/documents, and use a coding-workspace-style interface to create or edit app files with AI assistance.

Likely target users:

- Founders and solo operators who want AI assistants for business tasks.
- Small businesses evaluating AI automation.
- Technical/product teams exploring multi-agent workflows.
- AI Solutions Engineer hiring managers looking for proof that the candidate can assemble AI product systems.

Main workflow:

1. User lands on public website or marketplace.
2. User signs up/logs in through Supabase auth.
3. User browses or hires AI employees.
4. User chats with an employee, team, or workflow mode.
5. Orchestration services select agents, call LLM providers through proxies, and synthesize responses.
6. User may generate documents, media/artifacts, or use the Vibe coding workspace.
7. Billing/settings/support flows exist around the product.

Closest category: multi-agent workflow automation and AI employee marketplace prototype, with AI chat and AI coding workspace features. It is not verified as a production-grade agent platform.

## Verified Claims

These are safe to say if phrased as prototype/product-building work:

- "Built/orchestrated an AI-assisted Vite + React + TypeScript SaaS prototype for an AI workforce platform."
- "Implemented a 165-entry static AI employee catalog and 140 markdown-based agent prompt definitions."
- "Created multi-provider LLM proxy architecture for OpenAI, Anthropic, Google/Gemini, Perplexity, Grok, DeepSeek, and Qwen via Netlify functions."
- "Prototyped supervisor-pattern multi-agent chat, role selection, and workflow orchestration services."
- "Integrated Supabase auth/data models, RLS migrations, chat/session tables, employee marketplace tables, billing/token tables, and Vibe workspace tables."
- "Added Stripe Checkout/webhook/token-pack billing code, with remaining schema and plan-handling risks identified."
- "Built a Vibe-style AI coding workspace prototype with chat, file parsing, in-browser file system, Monaco/Sandpack-style editing/preview, and Supabase sync code."
- "Configured Netlify, Vercel, GitHub Actions, Vitest, Playwright, ESLint, TypeScript, bundle analysis, and Lighthouse-related tooling."
- "Used AI development tools heavily and acted as product/system orchestrator, reviewer, and integrator."

## Risky Claims

These may be true in spirit but need careful wording:

- "150+ AI employees" is safe only as "150+ catalog entries/prompts", not as "150+ fully working autonomous employees."
- "Multi-agent orchestration" is safe as "prototype modules and flows", not "reliable production orchestration."
- "Streaming responses" is safe only as "streaming-style/simulated UX"; much of the code streams completed responses word-by-word.
- "Web search" is safe as "partial Perplexity/DuckDuckGo search integration"; Google search fallback looks mismatched, and Brave is not implemented.
- "Billing" is safe as "Stripe billing code exists"; do not claim paid users or fully reconciled billing.
- "Production deployment" is safe as "live site/config evidence exists"; do not claim production traction.
- "Secure architecture" is safe as "auth, RLS, rate limit, validation, and proxy patterns exist"; do not claim enterprise-grade security.

## Unsupported Claims

Do not say these unless new evidence is produced:

- "AGI Agent Automation has paying customers."
- "Real users are actively using the app."
- "150+ autonomous agents are fully operational in production."
- "The platform has validated uptime, observability, or production SLAs."
- "It has RAG/vector search."
- "It uses Brave Search in production."
- "It has true token-level SSE/WebSocket LLM streaming across providers."
- "It has voice transcription or voice agent interaction."
- "It is enterprise-ready, SOC 2-ready, HIPAA-ready, or compliance-ready."
- "Siddhartha hand-coded the whole system independently."

## Tech Stack Evidence

| Technology | Status | Evidence paths | Notes |
|---|---:|---|---|
| TypeScript | Verified | `package.json`, `tsconfig.json`, `src/**/*.ts`, `src/**/*.tsx`, `netlify/functions/**/*.ts` | `npm run type-check` passed. |
| JavaScript | Verified | `vite.config.ts`, `eslint.config.js`, `dist`, JS tooling in `package.json` | JS runtime/tooling used; source is mostly TS/TSX. |
| React | Verified | `package.json`, `src/main.tsx`, `src/App.tsx`, `src/features/**/**/*.tsx` | React 19.2.4 in installed package tree. |
| Next.js | Not present | `package.json` | No Next.js framework. `next-themes` dependency only. |
| Vite | Verified | `package.json`, `vite.config.ts`, `vitest.config.ts` | App builds with `vite build`. |
| Supabase | Verified | `src/shared/lib/supabase-client.ts`, `supabase/migrations`, `supabase/functions`, `package.json` | Auth/data/realtime/database patterns exist. |
| Firebase | Not found | Repository search | No Firebase integration found. |
| PostgreSQL | Verified via Supabase | `supabase/migrations/*.sql` | Tables, RLS, functions, indexes, full-text search. |
| Auth | Partially verified | `src/features/auth`, `src/core/auth`, `src/features/auth/components/ProtectedRoute.tsx`, Supabase migrations | Supabase auth exists; several route/link risks. |
| Stripe/billing | Partially verified | `src/features/billing`, `netlify/functions/payments`, `supabase/migrations/*token*`, `supabase/migrations/*subscription*` | Code exists; tests/schema/plan risks remain. |
| OpenAI | Verified code | `src/core/ai/llm/providers/openai-gpt.ts`, `netlify/functions/llm-proxies/openai-proxy.ts`, `package.json` | Proxy architecture exists. |
| Anthropic Claude | Verified code | `src/core/ai/llm/providers/anthropic-claude.ts`, `netlify/functions/llm-proxies/anthropic-proxy.ts`, `package.json` | Many orchestration paths default to Anthropic. |
| Google Gemini | Verified code | `src/core/ai/llm/providers/google-gemini.ts`, `netlify/functions/llm-proxies/google-proxy.ts`, `@google/genai` dependency | Gemini proxy exists. Google search fallback appears mismatched. |
| Perplexity | Verified code | `src/core/ai/llm/providers/perplexity-ai.ts`, `netlify/functions/llm-proxies/perplexity-proxy.ts`, `src/core/integrations/web-search-handler.ts` | LLM/search path exists; streaming disabled/TODO. |
| Brave Search | Unsupported | `src/core/ai/orchestration/reasoning/employee-selection.ts` only | Only a capability label references `brave`; no real Brave API integration found. |
| WebSocket/SSE streaming | Mostly unsupported | `src/core/ai/llm/unified-language-model.ts`, provider `streamMessage` methods, chat hooks | Supabase realtime exists; LLM streaming is often simulated or disabled. |
| RAG | Unsupported | Searches found docs/marketing mentions only | Employee memory is JSONB; no RAG pipeline verified. |
| Vector search | Unsupported | `supabase/migrations` | No `pgvector`/embedding/match-documents implementation found. |
| Agent orchestration | Verified prototype | `src/core/ai/orchestration`, `src/features/chat/services/employee-chat-service.ts`, `src/features/chat/services/multi-agent-collaboration-service.ts` | Substantial orchestration code exists. |
| Multi-agent chat | Partially verified | `src/shared/stores/multi-agent-chat-store.ts`, `src/features/chat/components/Main/MultiAgentChatInterface.tsx`, `supabase/migrations/20250113000002_add_multi_agent_chat_tables.sql` | UI/store/schema/services exist; E2E not verified. |
| Role-based agents | Verified catalog/prompt layer | `src/data/marketplace-employees.ts`, `.agi/employees/*.md`, `src/core/ai/employees/prompt-management.ts` | 165 catalog rows, 140 prompt files. |
| Prompt templates | Verified | `.agi/employees/*.md`, `src/core/ai/employees/prompt-management.ts` | Markdown frontmatter and prompt parsing. |
| Artifact generation | Partially verified | `src/features/chat/utils/artifact-detector.ts`, `src/features/chat/components/artifacts`, document/media services | Code exists; runtime not verified. |
| File management | Partially verified | `src/features/vibe/services/vibe-file-system.ts`, `src/features/vibe/services/vibe-file-sync.ts`, Vibe components | In-browser/localStorage/Supabase sync code exists; schema drift risk. |
| Deployment configs | Verified | `netlify.toml`, `vercel.json`, `.vercel/project.json`, `.netlify/state.json`, `.github/workflows` | Config/link evidence exists; deploy success not proven by repo. |

## Feature Verification Table

| Feature | Evidence | Status | Appears to do | Safe claim | Cannot safely claim |
|---|---|---:|---|---|---|
| 150+ agents / agent catalog | `src/data/marketplace-employees.ts`, `.agi/employees`, `supabase/migrations/20250110000009_provider_optimized_ai_employees.sql` | Partially implemented | Static marketplace/data seed catalog plus prompt files. | "165 catalog entries and 140 prompt files." | "165 autonomous production agents." |
| Agent role selection | `src/features/chat/services/employee-chat-service.ts`, `src/core/ai/orchestration/intelligent-agent-router.ts`, `src/core/ai/orchestration/workforce-orchestrator.ts` | Partially implemented | Selects employees for simple/complex tasks and routes messages. | "Prototype role selection/routing." | "Validated optimal agent selection." |
| Supervisor/orchestrator agents | `.agi/employees/supervisor.md`, `src/core/ai/orchestration/workforce-orchestrator.ts`, `src/features/chat/services/multi-agent-collaboration-service.ts` | Partially implemented | Supervisor synthesis and Plan-Delegate-Execute style flows. | "Supervisor-pattern orchestration prototype." | "Reliable autonomous supervisor in production." |
| Multi-agent conversation | `src/shared/stores/multi-agent-chat-store.ts`, `src/core/storage/chat/multi-agent-chat-database.ts`, `src/features/chat/components/Main/MultiAgentChatInterface.tsx` | Partially implemented | Stores conversations, participants, collaboration metadata. | "Multi-agent chat UI/store/schema exist." | "End-to-end multi-agent chat is verified working." |
| LLM provider routing | `src/core/ai/llm/unified-language-model.ts`, `src/core/ai/llm/providers`, `netlify/functions/llm-proxies` | Partially implemented | Provider abstraction and proxies. | "Multi-provider routing architecture." | "Every listed provider/model works live." |
| Chat UI | `src/features/chat/pages/ChatInterface.tsx`, `src/features/chat/hooks/use-chat-interface.ts`, `src/features/chat/components` | Partially implemented | Sidebar, composer, messages, tools, modes, sessions. | "Built a chat interface and state flow." | "Chat is production-verified." |
| Streaming responses | `src/features/chat/hooks/use-chat-interface.ts`, `src/core/ai/llm/providers/openai-gpt.ts`, `src/core/ai/llm/providers/perplexity-ai.ts` | Stub/partial | Often streams full responses word-by-word; Perplexity streaming disabled. | "Streaming-style UX." | "True token streaming/SSE." |
| Web search | `src/core/integrations/web-search-handler.ts`, `docs/WEB_SEARCH_INTEGRATION.md` | Partial/brittle | Perplexity proxy search, Google fallback, DuckDuckGo fallback. | "Partial web search integration." | "Brave Search or robust multi-search working." |
| Artifact generation | `src/features/chat/utils/artifact-detector.ts`, `src/features/chat/components/artifacts`, document/media services | Partially implemented | Detects code/artifacts and previews/exports. | "Artifact detection and preview/export code." | "All artifact types work in production." |
| Voice input | `src/features/chat/hooks/use-voice-recording.ts`, `src/features/chat/components/messages/EnhancedMessageInput.tsx`, `netlify.toml` | Partial/risky | MediaRecorder audio attachment/preview. | "Voice recording component exists." | "Speech-to-text/voice agent works." |
| Authentication | `src/features/auth`, `src/core/auth`, `ProtectedRoute.tsx`, Supabase client/migrations | Partial | Supabase auth, protected routes, reset flow. | "Supabase auth integration." | "Auth flows are fully tested; route bugs exist." |
| Dashboard | `src/pages/DashboardHome.tsx`, `src/shared/components/DashboardLayout.tsx`, routes in `src/App.tsx` | Partially implemented | Protected dashboard shell and cards. | "Dashboard UI exists." | "Dashboard is E2E-verified." |
| Billing | `src/features/billing`, `netlify/functions/payments`, `supabase/migrations` | Partial/broken tests | Stripe checkout, webhooks, token packs, portal. | "Stripe billing code/prototype." | "Paying customers or reconciled billing." |
| Database | `supabase/migrations` | Partially implemented | Large schema with RLS for users, employees, chat, billing, Vibe. | "Supabase/Postgres schema migrations." | "Schema is clean/consistent; drift found." |
| User settings | `src/features/settings`, `src/core/auth/totp-2fa.ts`, user settings migrations | Partially implemented | Profile, preferences, security, AI config pages. | "Settings UI/services exist." | "Every setting persists correctly." |
| Deployment | `netlify.toml`, `vercel.json`, `.github/workflows`, `.vercel/project.json`, `.netlify/state.json` | Configured | Netlify/Vercel/CI configs. | "Configured for Netlify/Vercel." | "Deployment health or uptime." |
| Analytics/monitoring | `src/core/monitoring`, Sentry config in `vite.config.ts`, `src/main.tsx` | Partial | Sentry/performance/analytics code. | "Monitoring hooks/config exist." | "Real analytics data or active monitoring." |
| Real users/usage logs | Repo search | Unsupported | No data exports or logs proving usage. | None. | "Active users, usage, revenue." |
| RAG/vector search | Repo search, migrations | Unsupported | JSONB memory and full-text search only. | "JSONB memory and Postgres full-text indexes." | "RAG/vector search." |
| Vibe coding workspace | `src/features/vibe`, `netlify/functions/utilities/vibe-build.ts` | Partial/prototype | Chat, files, Monaco/Sandpack preview, code fence parsing. | "AI coding workspace prototype." | "Lovable/Bolt-equivalent production codegen." |
| File management | Vibe file services/components, `supabase/migrations/*vibe*` | Partial/risky | In-browser FS, localStorage, Supabase sync. | "File management prototype." | "Reliable persisted workspace; schema drift exists." |

## Build and Test Status

Package manager: npm. Evidence: `package-lock.json`, `package.json`.  
Install command inferred from repo scripts/config: `npm install` for local quick start, `npm ci --legacy-peer-deps` for Netlify/Vercel.

Commands run:

| Command | Result |
|---|---|
| `npm run type-check` | Passed. `tsc --noEmit` exited 0. |
| `npm run lint` | Exited 0 but reported `665 problems (0 errors, 665 warnings)`. Warnings are mostly `security/detect-object-injection`, non-literal regexp/fs, unsafe regex, and one React compiler/TanStack table warning. |
| `npm run test:run` | Failed. `2 failed | 68 passed` test files. `19 failed | 2107 passed | 6 skipped` tests. Failures are in CORS utility tests and token enforcement/billing tests. |
| `npm run build` | Passed. Vite transformed 5897 modules and built in 27.99s. Warnings: `gray-matter` uses `eval`, dynamic imports not chunking as expected, and large chunks over 1000 kB, including chat at about 1.76 MB minified. |
| `npm run e2e -- --project=chromium --reporter=list` | First sandbox run failed with `listen EPERM :::5173`. Escalated run started Playwright but all 141 Chromium specs failed before execution because the Playwright Chromium executable was missing from `/Users/siddhartha/Library/Caches/ms-playwright/...`. This is an environment/browser-install blocker, not proof that app E2E flows fail. |

Dev command:

- `npm run dev` maps to `vite`.
- Playwright's `webServer` uses `npm run dev` at `http://localhost:5173`.
- Standalone dev server was not left running.

Build/deploy commands from config:

- Netlify: `npm ci --legacy-peer-deps && npm run build`, publish `dist`, functions `netlify/functions`.
- Vercel: `npm run build:prod`, output `dist`, install `npm ci --legacy-peer-deps`.
- No deploy command was run. Public deployment actions should not be inferred from config alone.

Known blockers:

- Unit tests fail in billing/token enforcement and CORS.
- E2E cannot run until Playwright browsers are installed with `npx playwright install`.
- Lint warnings are numerous and include security-oriented warnings in sensitive areas.
- Bundle is large, especially chat/Vibe/AI chunks.

## Production Evidence

| Evidence type | Finding |
|---|---|
| Live URL | The repo references `https://agiworkforce.com/`, and `https://www.agiworkforce.com/` was reachable during this audit. This proves a public site exists, not active usage. |
| Public demo | No separate demo recording or stable demo script artifact found. |
| Deploy configs | `netlify.toml`, `vercel.json`, `.netlify/state.json`, `.vercel/project.json`. These prove deployment configuration/linkage, not successful current deploys. |
| Analytics | Sentry/analytics code exists under `src/core/monitoring` and `vite.config.ts`; no production analytics dashboard/export found. |
| User database | Supabase schema/code exists; no user table dump or active-user evidence found. |
| Waitlist/leads | Newsletter/contact/sales tables/functions exist; no lead counts or exports found. |
| Paying users | Stripe code exists; no Stripe event exports, customer list, invoices, MRR, or webhook logs proving payment. |
| GitHub releases | No release evidence was established in the local audit. |
| Uptime/errors | No uptime dashboard or production error logs found. |

Production-safe statement: "There is a public site and deployment configuration for the prototype."  
Unsafe statement: "This is production-proven with users/revenue."

## Code Quality and Risk Audit

### High-Signal Risks

- Fake marketplace metrics: `src/features/marketplace/pages/EmployeeMarketplace.tsx` generates ratings, reviews, success rates, and response times with `Math.random()`. These cannot be represented as real usage metrics.
- Billing/token tests fail: `src/core/billing/token-enforcement-service.test.ts` has 17 failures. Billing/token enforcement is not resume-safe as "fully working" until fixed.
- CORS tests fail: `netlify/functions/__tests__/cors.test.ts` has 2 failures around `www` production domain and localhost port policy.
- E2E unverified: local Playwright browser binary missing. No browser flows were actually executed.
- Schema drift around Vibe files: migrations define `vibe_files` with conflicting shapes across `20251116000001_add_vibe_interface_tables.sql` and `20260227000001_create_vibe_files.sql`.
- Billing schema mismatch: code references tables like `token_credits` / `chat_session_tokens` while migrations emphasize `user_token_balances` and other token tables. This may depend on an external/shared Supabase DB not fully represented in repo.
- Max plan mismatch risk: Stripe subscription code includes Max pricing, while some frontend billing types/limits treat only `free`, `pro`, and `enterprise`.
- Route bugs: multiple CTAs/components use `/login`, `/register`, or `/forgot-password` while app routes are `/auth/login`, `/auth/register`, `/auth/forgot-password`.
- Streaming is mostly simulated: several flows animate completed responses word-by-word, and some provider streaming paths are disabled or not true SSE.
- Web search docs/code drift: docs mention client-side VITE API keys, while code uses proxies; Google search fallback appears to call a Gemini generation proxy with a search-shaped payload.
- Brave Search not implemented: only a capability label was found.
- RAG/vector not implemented: JSONB memory and Postgres full-text search exist, but no pgvector/embedding retrieval pipeline was found.
- Client-side secret-pattern risk: `.env.example`, `src/env.example`, docs, and config mention client-facing `VITE_*` API keys and `VITE_JWT_SECRET`. `VITE_JWT_SECRET` is especially inappropriate as a public env var.
- Secret history artifact: `scripts/clean-secrets-from-history.sh` and `.ps1` include a specific webhook-secret-like string as part of cleanup/redaction scripts. Treat as evidence of prior secret exposure risk.
- Permissions conflict for voice: `netlify.toml` Permissions-Policy disables microphone, while voice recording UI code exists.
- Several Vibe tool operations are simulated: `src/features/vibe/services/vibe-agent-tools.ts`, `vibe-tool-orchestrator.ts`, and deployment manager include mock/simulated operations.

### TODOs / Stubs / Mock-like Areas

- `supabase/functions/newsletter-subscribe/index.ts`: TODO welcome email / marketing integration.
- `supabase/functions/contact-form/index.ts`: TODO notification email / CRM integration.
- `src/features/billing/pages/BillingDashboard.tsx`: invoice download "coming soon".
- `src/features/workforce/hooks/use-workforce-queries.ts`: task tracking TODO.
- `src/features/settings/pages/AIConfiguration.tsx`: simulated API test and "usage tracking coming soon".
- `src/features/vibe/pages/VibeDashboard.tsx`: save/new-file shortcuts toast "coming soon".
- `netlify/functions/agents/agents-execute.ts`: placeholder agent response / full tool integration pending.

## LinkedIn-Ready Content

### Short LinkedIn Project Description

AI-assisted build of AGI Agent Automation, a Vite/React/Supabase prototype for an AI workforce platform with a 165-role agent catalog, markdown prompt library, multi-provider LLM proxy architecture, Stripe billing code, and prototype multi-agent chat/workflow orchestration.

### Long LinkedIn Project Description

Built and orchestrated AGI Agent Automation as an AI-native product prototype using Claude Code, Cursor, Codex, and other LLM tools. The project combines a Vite + React + TypeScript frontend, Supabase auth/database migrations, Netlify serverless LLM proxies, Stripe billing flows, a 165-entry AI employee catalog, 140 markdown prompt definitions, and prototype multi-agent chat/orchestration services. The current repository proves a substantial product architecture and successful production bundle, while remaining honest about unfinished areas: simulated streaming, partial web search, failing billing/CORS tests, unverified E2E browser flows, and no repo evidence of users or revenue.

### LinkedIn Experience Bullets

- Orchestrated AI-assisted development of a Vite + React + TypeScript SaaS prototype for an AI workforce platform spanning marketplace, chat, billing, settings, dashboard, and coding-workspace flows.
- Built a 165-entry AI employee catalog and 140 markdown prompt definitions for role-based agents across engineering, business, legal, healthcare, creative, and operations use cases.
- Implemented a multi-provider LLM proxy architecture using Netlify functions for OpenAI, Anthropic, Gemini, Perplexity, Grok, DeepSeek, and Qwen, with Supabase auth and token-tracking hooks.
- Prototyped supervisor-pattern multi-agent orchestration, role selection, sequential workflows, and synthesized responses for complex user tasks.
- Audited the product for resume-safe proof, identifying failing billing/CORS tests, simulated streaming, schema drift, fake marketplace metrics, and unsupported production-usage claims.

### Resume Bullets

- Developed an AI workforce SaaS prototype with React 19, TypeScript, Vite, Supabase, Netlify Functions, and Stripe across 600+ frontend/core source files.
- Designed a role-based agent system with 165 marketplace entries, 140 markdown prompt files, prompt parsing, provider metadata, and Supabase seed/migration support.
- Built authenticated LLM proxy functions and provider abstractions for major model vendors, reducing direct client exposure of server-side AI keys.
- Prototyped multi-agent chat and workflow orchestration services with supervisor synthesis, task routing, memory context, and mission-control-style state.
- Established engineering verification with TypeScript, ESLint, Vitest, Playwright, CI configs, and production build checks; identified 19 current unit test failures and E2E environment blockers.

### Phrases To Avoid

- "150+ autonomous AI employees are fully working."
- "Production-ready AGI workforce."
- "Fully functional multi-agent company."
- "True real-time LLM streaming."
- "RAG/vector search platform."
- "Paying customers" or "revenue-generating" without external proof.
- "Enterprise-grade security/compliance."
- "Built entirely by hand."
- "Replaces human employees."
- "Validated at scale."

### Keywords To Include

React, TypeScript, Vite, Supabase, PostgreSQL, Netlify Functions, Stripe, LLM provider routing, multi-agent orchestration, prompt engineering, AI-assisted development, Claude Code, Cursor, Codex, product prototyping, RLS, serverless proxies, SaaS architecture, AI workforce, agent catalog, technical audit.

## Demo Scripts

### 30-Second Pitch

AGI Agent Automation is an AI-assisted SaaS prototype for an AI workforce platform. It has a 165-role employee catalog, 140 prompt definitions, Supabase auth and data models, Netlify LLM proxies, Stripe billing code, and prototype multi-agent chat and orchestration flows. I built it with heavy use of Claude Code, Cursor, Codex, and other LLM tools, so the honest story is not "I hand-coded every line"; it is "I can direct AI tools, integrate systems, audit output, and turn a product concept into a working technical architecture."

### 2-Minute Demo Script

1. Start with the repository proof: show `src/data/marketplace-employees.ts` and `.agi/employees` counts.
2. Show the public app or local Vite app and explain the product: hire AI employees, chat with them, route complex work to a team.
3. Open marketplace code and show Supabase-backed marketplace/hire flow.
4. Open chat/orchestration code: `employee-chat-service.ts`, `multi-agent-collaboration-service.ts`, and `workforce-orchestrator.ts`.
5. Show LLM proxy architecture in `netlify/functions/llm-proxies`.
6. Be explicit: "Build and typecheck pass; unit tests currently have billing/CORS failures; E2E needs Playwright browser install."
7. Close with what this proves for AI Solutions Engineering: model integration, product thinking, system design, testing, and honest audit discipline.

### 5-Minute Demo Script

1. Product framing: "This is a prototype AI workforce SaaS, not a finished production company."
2. Marketplace proof: show 165 catalog entries and 140 prompt files; explain role metadata and provider preferences.
3. Chat/orchestration flow: show `/chat` route, `ChatInterface`, `use-chat-interface`, `employee-chat-service`, and supervisor synthesis.
4. Provider architecture: show `unified-language-model.ts`, provider wrappers, and Netlify LLM proxies with auth/rate/token hooks.
5. Vibe workspace: show `src/features/vibe`, in-browser file system, code-fence parsing, preview/build function, and simulated tool caveats.
6. Supabase/Stripe: show migrations, auth, purchased employees, chat tables, multi-agent tables, billing functions, webhook handler.
7. Quality audit: show the command results: typecheck/build pass, lint warnings, unit test failures, E2E browser blocker.
8. Finish with roadmap: fix tests, consolidate migrations, remove fake metrics, convert simulated streaming to SSE, verify live flows, add real analytics.

### Best Live Demo Path

Use local demo only after installing Playwright browsers and confirming auth/env:

1. `npm run dev`
2. Open `http://localhost:5173`
3. Show public landing/pricing/marketplace pages.
4. Log in or register through `/auth/login`.
5. Show `/marketplace`, hire an employee, then `/workforce`.
6. Show `/chat` with a safe prompt that does not require paid API calls if keys are uncertain.
7. Show `/vibe` as a coding workspace prototype and explain simulated areas.

### Safest Backup Demo If App Fails

Use a repo-backed walkthrough:

1. Show this report.
2. Show static catalog count and prompt folder.
3. Show `src/core/ai/llm/unified-language-model.ts`.
4. Show one Netlify proxy such as `openai-proxy.ts`.
5. Show `workforce-orchestrator.ts` and `multi-agent-collaboration-service.ts`.
6. Show `supabase/migrations`.
7. Show command outputs: typecheck/build pass, unit/E2E limitations.

## Interview Prep

| Question | Honest answer | Evidence to show | Learn before saying it confidently |
|---|---|---|---|
| What did you personally build? | I orchestrated AI-assisted development, integrated features, audited code, and shaped product architecture using Claude Code, Cursor, Codex, and related tools. | Repo structure, commits if available, this audit. | Be ready to explain specific files and tradeoffs without overclaiming hand-coding. |
| Are there really 150+ agents? | There are 165 catalog entries and 140 prompt files. I would not claim all are production-verified autonomous agents. | `src/data/marketplace-employees.ts`, `.agi/employees`. | How catalog entries map to runtime execution. |
| Is this production-ready? | No. It builds and has a public site/config, but tests fail and production usage is not proven. | Build/test section. | Deployment status, env setup, live DB status. |
| How does provider routing work? | A unified LLM service chooses provider wrappers, which call authenticated Netlify proxy functions. | `unified-language-model.ts`, provider files, proxies. | Error handling and provider-specific request/response formats. |
| Is streaming real? | Mostly no. The UI often simulates streaming by rendering full responses word-by-word. | `use-chat-interface.ts`, provider stream methods. | SSE/WebSocket streaming implementation patterns. |
| Does it have RAG? | Not in verified code. It has JSONB employee memory and full-text indexes, not vector retrieval. | migrations for memories/search. | pgvector, embeddings, retrieval evaluation. |
| Does billing work? | Stripe checkout/webhook code exists, but token enforcement tests fail and schema/plan risks remain. | billing functions/tests/migrations. | Stripe webhooks, idempotency, reconciliation, billing state machines. |
| How secure is it? | It has good patterns: Supabase auth, RLS, server-side proxies, rate limiting, validation. It also has risks: env/docs, lint security warnings, secret cleanup artifacts. | `ProtectedRoute`, migrations, proxy utils, lint output. | Threat modeling and secret management. |
| What is the database design? | Supabase/Postgres migrations cover users, subscriptions, employees, chat, multi-agent, Vibe, support/content, and RLS. Some schema drift exists. | `supabase/migrations`. | Migration ordering, drift resolution, local reset. |
| How does web search work? | Perplexity proxy and DuckDuckGo fallback exist; Google search fallback appears mismatched; Brave is unsupported. | `web-search-handler.ts`, proxy files. | Search APIs and source citation quality. |
| What is Vibe? | A coding workspace prototype with chat, file parsing, local/Supabase file sync, editor, preview, and simulated tool/deploy areas. | `src/features/vibe`. | Sandpack, real build isolation, secure execution. |
| What tests pass? | Typecheck and build pass; lint has warnings; unit tests currently fail 19 cases; E2E blocked by missing browser. | command results. | Fix failing tests and run full E2E. |
| Biggest technical risk? | Billing/token enforcement and fake marketplace metrics are highest resume/demo risks, followed by schema drift and simulated features. | test failures, marketplace file, migrations. | Billing correctness and data integrity. |
| What would you fix first? | Remove fake metrics, fix auth routes, fix billing/CORS tests, consolidate schema, install/run E2E, replace simulated streaming. | risk section. | Prioritization and regression testing. |
| Why is this relevant to AI Solutions Engineer roles? | It shows ability to integrate LLM APIs, auth, billing, databases, serverless proxies, prompts, orchestration, and product UX while auditing limitations honestly. | feature and tech evidence. | Customer discovery, deployment ops, observability. |

## File Path Appendix

Core app:

- `package.json`
- `vite.config.ts`
- `tsconfig.json`
- `eslint.config.js`
- `vitest.config.ts`
- `playwright.config.ts`
- `src/main.tsx`
- `src/App.tsx`
- `src/AppRouter.tsx`

Marketplace and agents:

- `src/data/marketplace-employees.ts`
- `.agi/employees/*.md`
- `.agi/employees/supervisor.md`
- `src/core/ai/employees/prompt-management.ts`
- `src/features/marketplace/pages/EmployeeMarketplace.tsx`
- `src/features/marketplace/components/EmployeeCard.tsx`
- `src/shared/components/HireButton.tsx`
- `src/features/workforce/services/employee-database.ts`
- `src/shared/stores/workforce-store.ts`

Chat and orchestration:

- `src/features/chat/pages/ChatInterface.tsx`
- `src/features/chat/hooks/use-chat-interface.ts`
- `src/features/chat/services/employee-chat-service.ts`
- `src/features/chat/services/multi-agent-collaboration-service.ts`
- `src/features/chat/services/chat-tool-router.ts`
- `src/features/chat/components/Main/MultiAgentChatInterface.tsx`
- `src/shared/stores/multi-agent-chat-store.ts`
- `src/core/ai/orchestration/workforce-orchestrator.ts`
- `src/core/ai/orchestration/agent-conversation-protocol.ts`
- `src/core/ai/orchestration/sequential-workflow-orchestrator.ts`
- `src/core/ai/orchestration/consulting-orchestrator.ts`
- `src/core/ai/orchestration/intelligent-agent-router.ts`

LLM providers and proxies:

- `src/core/ai/llm/unified-language-model.ts`
- `src/core/ai/llm/providers/openai-gpt.ts`
- `src/core/ai/llm/providers/anthropic-claude.ts`
- `src/core/ai/llm/providers/google-gemini.ts`
- `src/core/ai/llm/providers/perplexity-ai.ts`
- `src/shared/config/supported-models.ts`
- `netlify/functions/llm-proxies/openai-proxy.ts`
- `netlify/functions/llm-proxies/anthropic-proxy.ts`
- `netlify/functions/llm-proxies/google-proxy.ts`
- `netlify/functions/llm-proxies/perplexity-proxy.ts`
- `netlify/functions/llm-proxies/grok-proxy.ts`
- `netlify/functions/llm-proxies/deepseek-proxy.ts`
- `netlify/functions/llm-proxies/qwen-proxy.ts`

Search, artifacts, media, voice:

- `src/core/integrations/web-search-handler.ts`
- `docs/WEB_SEARCH_INTEGRATION.md`
- `src/features/chat/utils/artifact-detector.ts`
- `src/features/chat/components/artifacts`
- `src/features/chat/services/document-generation-service.ts`
- `src/features/chat/services/document-export-service.ts`
- `src/core/integrations/media-generation-handler.ts`
- `src/core/integrations/google-imagen-service.ts`
- `src/core/integrations/google-veo-service.ts`
- `src/features/chat/hooks/use-voice-recording.ts`
- `src/features/chat/components/messages/EnhancedMessageInput.tsx`

Vibe coding workspace:

- `src/features/vibe/pages/VibeDashboard.tsx`
- `src/features/vibe/services/vibe-file-system.ts`
- `src/features/vibe/services/vibe-file-sync.ts`
- `src/features/vibe/services/vibe-message-handler.ts`
- `src/features/vibe/services/vibe-agent-tools.ts`
- `src/features/vibe/services/vibe-tool-orchestrator.ts`
- `src/features/vibe/components/redesign/CodeEditorPanel.tsx`
- `src/features/vibe/components/redesign/LivePreviewPanel.tsx`
- `netlify/functions/utilities/vibe-build.ts`

Auth, billing, database:

- `src/shared/lib/supabase-client.ts`
- `src/shared/utils/env-validation.ts`
- `src/features/auth`
- `src/core/auth`
- `src/features/auth/components/ProtectedRoute.tsx`
- `src/features/billing`
- `netlify/functions/payments/create-pro-subscription.ts`
- `netlify/functions/payments/buy-token-pack.ts`
- `netlify/functions/payments/stripe-webhook.ts`
- `netlify/functions/payments/get-billing-portal.ts`
- `supabase/migrations/*.sql`
- `supabase/functions`

Deployment and operations:

- `netlify.toml`
- `vercel.json`
- `.vercel/project.json`
- `.netlify/state.json`
- `.github/workflows/simple-ci.yml`
- `.github/workflows/codeql-analysis.yml`
- `public/sitemap.xml`
- `public/sitemap-pages.xml`
- `docs/operations/ENVIRONMENT_VARIABLES.md`

Testing:

- `src/**/*.test.ts`
- `src/**/*.test.tsx`
- `netlify/functions/__tests__`
- `e2e/*.spec.ts`
- `test-results`

