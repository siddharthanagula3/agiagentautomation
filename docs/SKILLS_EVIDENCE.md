# Skills Evidence Mapping

This document provides a mapping of specific engineering skills to their actual implementation files and components within the AGI Agent Automation Platform.

## Core AI & Agentic Skills

### 1. Generative AI & Large Language Models (LLMs)
*   **Implementation**: A unified, multi-provider model routing layer.
*   **Key Files**:
    *   [unified-language-model.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/core/ai/llm/unified-language-model.ts): Central router and interface for LLM requests.
    *   [google-gemini.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/core/ai/llm/providers/google-gemini.ts): Integration with Google's Gemini API.
    *   [anthropic-claude.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/core/ai/llm/providers/anthropic-claude.ts): Integration with Anthropic's Claude SDK.
    *   [openai-gpt.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/core/ai/llm/providers/openai-gpt.ts): Integration with OpenAI's GPT models.

### 2. AI Agents, Agent Orchestration & Agentic Workflows
*   **Implementation**: A Plan-Delegate-Execute multi-agent orchestration architecture.
*   **Key Files**:
    *   [workforce-orchestrator.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/core/ai/orchestration/workforce-orchestrator.ts): Coordinates planning, agent delegation, and parallel task execution.
    *   [workforce-store.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/shared/stores/workforce-store.ts): Manages state and metadata for hired AI employees.

### 3. Multi-Agent Orchestration & Collaboration
*   **Implementation**: Shared communication channels and workspace environments where multiple AI employees collaborate.
*   **Key Files**:
    *   [multi-agent-chat-store.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/shared/stores/multi-agent-chat-store.ts): Manages multi-agent group conversation streams.
    *   [vibe-tool-orchestrator.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/features/vibe/services/vibe-tool-orchestrator.ts): Coordinates tools and tasks across developers, testers, and operations agents.

### 4. Tool Calling & Tool Orchestration
*   **Implementation**: A secure execution sandbox for agents to run operations like file reading, grep searching, code execution, and web searches.
*   **Key Files**:
    *   [tool-executor.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/core/ai/tools/tool-executor.ts): Defines tool schemas, validates permissions, and executes system tools.
    *   [chat-tool-router.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/features/chat/services/chat-tool-router.ts): Decides when to trigger tools based on model outputs.

### 5. Prompt Engineering
*   **Implementation**: File-based system prompting with YAML frontmatter templating for 140+ distinct employee roles.
*   **Key Files**:
    *   [prompt-management.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/core/ai/employees/prompt-management.ts): Loads, parses, and validates system prompts.
    *   [.agi/employees/](file:///Users/siddhartha/Desktop/agiagentautomation/.agi/employees/): Markdown template definitions containing system instructions for each persona.

### 6. RAG (Retrieval-Augmented Generation)
*   **Implementation**: Context ingestion from documents (PDF/DOCX extraction) and real-time web searches to augment model prompts.
*   **Key Files**:
    *   [web-search-integration.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/features/chat/services/web-search-integration.ts): Routes user queries to Perplexity AI for web context retrieval.
    *   [document-generation-service.ts](file:///Users/siddhartha/Desktop/agiagentautomation/src/features/chat/services/document-generation-service.ts): Integrates context parsing from local database stores.

---

## Infrastructure & Mobile Skills

### 1. Vercel
*   **Implementation**: Deployment configuration, serverless backend proxying, and client-side web analytics.
*   **Key Files**:
    *   [vercel.json](file:///Users/siddhartha/Desktop/agiagentautomation/vercel.json): Route rewrites, SPA fallbacks, and serverless timeout settings.
    *   [main.tsx](file:///Users/siddhartha/Desktop/agiagentautomation/src/main.tsx): Client-side Vercel Web Analytics and Speed Insights instrumentation.

### 2. Joi (Schema Validation)
*   **Implementation**: Static code verification and employee metadata schema validation.
*   **Key Files**:
    *   [validate-employees.ts](file:///Users/siddhartha/Desktop/agiagentautomation/scripts/validate-employees.ts): Node.js build verification script utilizing Joi schemas.

### 3. ARKit & AVFoundation
*   **Implementation**: Native iOS components for camera frame processing and augmented reality tracking.
*   **Key Files**:
    *   [AGIWorkforceScanner.swift](file:///Users/siddhartha/Desktop/agiagentautomation/ios/AGIWorkforceScanner.swift): Core camera capture and plane detection coordinator.

### 4. Fastlane
*   **Implementation**: Build automation and beta distribution setups.
*   **Key Files**:
    *   [Fastfile](file:///Users/siddhartha/Desktop/agiagentautomation/fastlane/Fastfile): Automates versioning, code signing, building, and TestFlight uploads.
    *   [Appfile](file:///Users/siddhartha/Desktop/agiagentautomation/fastlane/Appfile): Apple Developer and App Store credentials configuration.

### 5. Kubernetes (Container Orchestration)
*   **Implementation**: Container orchestration and cluster routing resources.
*   **Key Files**:
    *   [deployment.yaml](file:///Users/siddhartha/Desktop/agiagentautomation/k8s/deployment.yaml): Pod replicas, resource constraints, and health probes.
    *   [service.yaml](file:///Users/siddhartha/Desktop/agiagentautomation/k8s/service.yaml): LoadBalancer service definition.
