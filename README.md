# AGI Agent Automation Platform

The AGI Agent Automation Platform is a multi-agent orchestration SaaS platform that enables users to hire, coordinate, and run tasks with over 140 specialized AI employee personas. The platform features two core workspaces:

1.  **`/chat`**: A collaborative environment where multiple AI agents converse and execute complex multi-step plans in parallel.
2.  **`/vibe`**: A full-featured AI coding sandbox integrating a Monaco code editor, file-tree navigation, a terminal, and a live web application preview.

---

## Core Capabilities

- **Multi-Agent Coordination**: Implements a Plan-Delegate-Execute design pattern. Tasks are parsed, split into logical sub-tasks, and delegated to specialized agents.
- **Unified LLM Router**: Secures and proxies requests to OpenAI, Anthropic, Google Gemini, DeepSeek, Perplexity, Qwen, and Grok.
- **Secure API Architecture**: All API keys are kept server-side. Frontend requests are authenticated using Supabase JWTs and routed through rate-limited serverless functions.
- **Hot-Reloadable Employee Marketplace**: AI employee personas are defined dynamically via markdown files with YAML frontmatter located in `.agi/employees/`. New employees can be added or updated without writing code.

---

## Technical Architecture Overview

- **Frontend**: React (v19), TypeScript, Vite, Tailwind CSS, Radix UI.
- **State Management**: Zustand with Immer middleware for immutable client state, combined with React Query for cached server state.
- **Backend & Database**: Supabase (PostgreSQL with Row Level Security, Auth, and Storage) and Netlify serverless function proxies.
- **Infrastructure & Tooling**:
  - **Joi Validation**: Schemas and build validation scripts (`scripts/validate-employees.ts`) using Joi to verify employee configuration files.
  - **Vercel Integration**: Live application telemetry using `@vercel/analytics` and `@vercel/speed-insights`.
  - **iOS Workspace**: Native iOS companion components (`ios/AGIWorkforceScanner.swift`) utilizing ARKit and AVFoundation.
  - **Fastlane**: Automation lanes (`fastlane/Fastfile`) for building and distributing mobile companions.
  - **Kubernetes**: Local and cloud deployment configurations (`k8s/deployment.yaml`, `k8s/service.yaml`).

---

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher.
- **Docker**: Required for running the local Supabase environment.
- **Supabase CLI**: Required for local database migrations.

### Installation

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/siddharthanagula3/agiagentautomation.git
    cd agiagentautomation
    ```

2.  **Install Project Dependencies**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Copy the example template to `.env` and fill in your Supabase configuration and provider API keys:

    ```bash
    cp .env.example .env
    ```

4.  **Start Local Database & Apply Migrations**
    Start the local Supabase containers (requires Docker) and reset the database state:

    ```bash
    supabase start
    supabase db reset
    ```

5.  **Run Development Server**
    Start the Vite bundler and development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## Project Structure

```
agiagentautomation/
├── .agi/                     # AI employee definition files (.md)
├── docs/                     # Guides, schemas, and skills evidence mapping
├── fastlane/                 # Fastlane mobile automation configurations
├── ios/                      # Native Swift iOS companion files (ARKit/AVFoundation)
├── k8s/                      # Kubernetes deployment manifests
├── netlify/functions/        # Serverless backend proxies & rate limiters
├── scripts/                  # Build scripts and Joi validation utilities
├── src/                      # Frontend Application
│   ├── core/                 # Unified LLM layers, authentication, and security
│   ├── features/             # Feature modules (/vibe, /chat, marketplace, billing)
│   ├── shared/               # Reusable UI components, hooks, utility libraries, and Zustand stores
│   └── main.tsx              # React entry point with Vercel telemetry
└── supabase/                 # PostgreSQL database schemas, configurations, and migrations
```

---

## Testing & Quality Controls

- **Type Checking**: Run `npm run type-check` to verify TypeScript files.
- **Linter**: Run `npm run lint` to enforce clean code guidelines.
- **Unit & Integration Tests**: Run `npm run test:run` to execute Vitest suites.
- **Employee Validation**: Run `npx tsx scripts/validate-employees.ts` to validate all employee frontmatter configurations using Joi.
