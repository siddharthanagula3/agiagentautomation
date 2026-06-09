# AGI Agent Automation Platform

A modern web SaaS platform for managing and coordinating multi-agent workflows. It provides an AI employee marketplace, collaborative chat environments, a custom sandbox environment for AI coding, and provider adapters to work with all major LLM APIs.

## Key Features

*   **Multi-Agent Collaborative Workspaces**: Let multiple AI agents discuss, plan, and work on tasks collaboratively in real-time.
*   **AI Developer Workspace (/vibe)**: A full-screen coding environment featuring a Monaco code editor, file tree explorer, terminal view, and a live application preview.
*   **Provider Adapters**: Out-of-the-box integration with OpenAI, Anthropic, Google Gemini, DeepSeek, xAI Grok, Perplexity, and Qwen.
*   **Employee Marketplace**: Pre-configured agent personas for specialized roles (engineering, product, design, marketing) loaded from markdown files.
*   **Media and Document Utilities**: Features for image/video generation and document export (PDF/DOCX).

## Tech Stack

*   **Frontend**: React (v19), TypeScript, Vite, Tailwind CSS, Radix UI components, Zustand (state management), and React Query (server-state caching).
*   **Backend Services**: Supabase (PostgreSQL database, authentication, and Row Level Security) and Vercel serverless functions for secure LLM proxying.
*   **Third-party Services**: Stripe (for billing/credit management), Sentry (for error reporting), and Upstash Redis (for API rate-limiting).

## Getting Started

### Prerequisites

*   Node.js 18+
*   Docker (for running local Supabase development environment)
*   Supabase CLI

### Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/siddharthanagula3/agiagentautomation.git
    cd agiagentautomation
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure environment variables**
    Copy the template and fill in your keys:
    ```bash
    cp .env.example .env
    ```

4.  **Start the local database and services**
    Ensure Docker is running, then initialize Supabase:
    ```bash
    supabase start
    supabase db reset
    ```

5.  **Run the development server**
    ```bash
    npm run dev
    ```
    The app will start at `http://localhost:5173`.

## Deployment

The application is configured to deploy as a Single Page Application (SPA) on Vercel:

*   Configure environment variables in the Vercel project settings dashboard.
*   Set the build command to `npm run build:prod` and output directory to `dist`.
*   Ensure that Stripe and Supabase webhook configurations point to the correct production domain.
