# Agents Architecture

## Core Orchestration

- `src/core/orchestration/multi-agent-orchestrator.ts` builds capability maps from the 165+ AI employees in `@/data/ai-employees`, plans work, manages task queues, and streams updates back to the UI. It also coordinates MCP tool usage through `mcp-tools-service`.
- `src/core/orchestration/reasoning` contains the decision making pipeline. Notably, `agent-selector.ts` scores available agents against task intent, domain, complexity, cost, and reliability to pick a primary agent and fallbacks, while `task-decomposer.ts` (and related NLP processors) break user intents into actionable tasks.
- `src/core/orchestration/agent-protocol.ts` defines the inter-agent messaging contract. Agents communicate via typed messages (request, response, handoff, etc.), and the protocol tracks pending requests, retries, response times, and broadcasts to keep the workforce in sync.

## Agent Catalog

- `src/data/ai-employees.ts` is the definitive catalog of the AI employees. Each entry captures provider (ChatGPT, Claude, Gemini, Perplexity), pricing, specialty, skills, and default MCP tool access. This drives the orchestrator's capability map.
- `supabase/seed-agents.sql` seeds the `ai_agents` table with production-ready metadata (skills, capabilities, limitations, hourly rates, performance scores) and keeps the database aligned with the TypeScript catalog.
- `public/` provides avatars and other static assets the UI uses to render each agent.

## Runtime Integrations

- `src/integrations/agents/cursor-agent.ts` wraps Google Gemini for the Cursor IDE-style agent. It streams responses, emits progress updates, estimates token costs, and validates API credentials.
- `src/integrations/agents/replit-agent.ts` provides a full-stack project automation agent that focuses on environment setup, dependency installation, and deployment guidance using the same Gemini backend.
- Additional provider adapters live under `src/core/api/llm` (for example, the `UnifiedLLMService`) and are orchestrated by the multi-agent pipeline.

## Serverless Entry Points

- `netlify/functions/agents-session.ts` provisions OpenAI Assistants sessions per agent. It authenticates via Supabase, creates assistant plus thread pairs, and persists session metadata.
- `netlify/functions/agents-execute.ts` handles conversational turns: it appends user messages to OpenAI threads, polls run status, stores assistant responses, and updates conversation timestamps.

## State and Telemetry

- `src/shared/stores/agent-metrics-store.ts` (Zustand) maintains live metrics: session counts, token usage, task outcomes, agent status maps, and recent activity logs. It serializes key stats for persistence and powers dashboards.
- `coverage/`, `tests/`, and `playwright-report/` contain QA artifacts used to monitor agent quality across end-to-end and integration scenarios.

## UI and Experience

- `src/features` and `src/layouts` wire the orchestrator into React views such as task planners, dashboards, and chat surfaces. Components subscribe to the metrics store and render per-agent panels.
- `docs/` houses high-level architectural narratives, migration summaries, and audit reports that complement this document.

## Extending the System

1. **Add a new agent**: extend `AI_EMPLOYEES`, augment Supabase seeds if needed, and register capabilities in `agent-selector.ts`.
2. **Integrate a new provider**: add a wrapper under `src/core/api/llm`, expose it through `UnifiedLLMService`, and update orchestrator selection logic.
3. **Expose tooling**: declare default MCP tools on the agent record and implement handlers within `mcp-tools-service`.
4. **Observe metrics**: expand `agent-metrics-store.ts` if new signals are required, ensuring persistence configuration captures the additional fields.

## Related Automation

- Background orchestration services rely on the MCP tool registry, job queues, and the agent protocol to route work.
- Supabase tables (`conversations`, `messages`, `ai_agents`) store chat history, tool runs, and agent performance, allowing analytics jobs to retrain selection weights.
- Netlify functions act as the external API boundary, making it safe to expose agent chat endpoints without revealing internal orchestration logic.
