# 🤖 AGI Agent Automation Platform

> **Replace $100K+ human employees with $19/month AI employees**. Save 99%+ on payroll costs while getting 24/7 productivity, zero downtime, and instant expertise across 165+ specializations.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-3ECF8E.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 💰 ROI in 60 Seconds

| Comparison | Human Employee | AI Employee | Your Savings |
|------------|----------------|-------------|--------------|
| **Cost** | $100,000/year | $228/year | **99.8%** |
| **Availability** | 40 hrs/week | 168 hrs/week | **320% more productive** |
| **Onboarding** | 3-6 months | Instant | **Immediate ROI** |
| **Benefits/Insurance** | $30K+/year | $0 | **100% savings** |
| **Sick Days** | 10+ days/year | 0 days | **Zero downtime** |
| **Expertise** | 1-2 specialties | 165+ specialties | **Unlimited skills** |

**Bottom Line:** One $19/month AI employee replaces a $100K+ human employee. A team of 10 AI employees ($190/month) replaces a team of 10 humans ($1M+/year). **That's $999,810 saved annually.**

## 🌟 Vision

AGI Agent Automation isn't just another AI tool—it's a **complete workforce replacement platform**. Your AI employees collaborate transparently like a human team, but they work 24/7, never get sick, never ask for raises, and start producing value in 60 seconds. Simply tell them what you need in natural language—they handle everything.

### Why Businesses Choose Us

- **💸 Dramatic Cost Savings**: 99%+ reduction vs human employees
- **⚡ Instant Hiring**: From "I need help" to "work complete" in minutes, not months
- **🎭 Transparent Collaboration**: Watch AI employees communicate and work together in real-time
- **💼 165+ Specialized Employees**: Frontend Engineers, Data Scientists, Architects, Marketers, Salespeople—all expert-level
- **🧠 Intelligent Model Routing**: Auto-selects best LLM (GPT-4o, Claude, Gemini) for each task
- **📊 Visual Work Streams**: See exactly what each AI is doing—their thought process, tools, and progress
- **🎨 ChatGPT-Level UX**: Modern interface you already know how to use
- **💳 Token Cost Transparency**: Market rates same as direct OpenAI/Anthropic/Google usage

## ✨ Key Features

### 1. Multi-Agent Chat Interface

Experience a **best-in-class chat interface** that rivals ChatGPT and Claude.ai, enhanced with multi-agent collaboration:

- **Rich Markdown Rendering**: Full support for tables, code blocks, math equations, and more
- **Document View Mode**: Long-form content (reports, code files) displayed in scrollable, exportable containers
- **Per-Code-Block Copy**: Every code snippet has its own copy button with syntax highlighting
- **Inline Work Streams**: Expand any AI response to see the collaborative work process that generated it

### 2. AI Employee Marketplace

Build your dream AI team:

- **165+ Specialized Employees**: From Frontend Engineers to Marketing Strategists
- **File-Based System**: Add custom employees by simply creating `.md` files (no code changes!)
- **Real-Time Status**: See who's working, thinking, or idle
- **Multi-Select**: Choose specific employees or let AI auto-select the best team

<details>
<summary><b>📦 Pre-Built AI Employees</b></summary>

- **🏗️ Software Architect** - System design & technical planning
- **💻 Frontend Engineer** - React, TypeScript, Tailwind UI
- **⚙️ Backend Engineer** - APIs, databases, serverless functions
- **🐛 Debugger** - Bug hunting & systematic problem solving
- **👀 Code Reviewer** - Quality assurance & security analysis

</details>

### 3. Task-Based Model Routing

Automatically select the best LLM for every task:

| Task Type | Recommended Model | Why |
|-----------|-------------------|-----|
| **Coding** | Claude 3.5 Sonnet | Superior reasoning for complex code |
| **General** | GPT-4o | Best all-around performance |
| **Creative** | Gemini 1.5 Pro | Optimized for creative content |
| **Research** | Perplexity Sonar | Real-time web access |
| **Data Analysis** | Claude 3 Opus | Advanced analytical capabilities |

**User Override**: Manual model selection available at any time via dropdown.

### 4. Transparent Multi-Agent Collaboration

Inspired by [mgx.dev](https://mgx.dev), see AI employees collaborate:

```
📋 User Request: "Build a React dashboard with real-time data"

🏗️ Software Architect:
   └─ Designing system architecture...
   └─ Creating component structure...
   └─ ✅ Architecture complete

💻 Frontend Engineer:
   └─ Creating Dashboard.tsx component...
   └─ Implementing real-time data hooks...
   └─ ✅ UI implementation done

⚙️ Backend Engineer:
   └─ Setting up WebSocket connection...
   └─ Creating data stream API...
   └─ ✅ Backend ready

👀 Code Reviewer:
   └─ Reviewing code for best practices...
   └─ ✅ All checks passed

✨ Mission Complete!
```

### 5. Enterprise-Ready Infrastructure

- **🔐 Supabase Auth**: Secure authentication with Row Level Security
- **💳 Stripe Integration**: Subscription billing & payment processing
- **📊 Real-Time Monitoring**: Token usage, costs, and performance tracking
- **🚀 Serverless Architecture**: Netlify Functions for scalable backend
- **📦 Code Splitting**: Optimized bundle sizes with lazy loading

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Stripe account (optional, for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agiagentautomation.git
cd agiagentautomation

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start local Supabase (requires Docker)
supabase start

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file with:

```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# AI Providers (Optional - proxied through Netlify Functions)
VITE_OPENAI_API_KEY=sk-...
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_GOOGLE_API_KEY=...
VITE_PERPLEXITY_API_KEY=...

# Stripe (Optional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **State** | Zustand + Immer |
| **Backend** | Netlify Functions (serverless) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth + RLS |
| **Payments** | Stripe |
| **AI** | Multi-provider (OpenAI, Anthropic, Google, Perplexity) |

### Directory Structure

```
src/
├── core/                      # Business logic
│   ├── ai/                    # AI orchestration & LLMs
│   │   ├── llm/               # LLM providers (OpenAI, Claude, Gemini)
│   │   ├── orchestration/     # Multi-agent coordination
│   │   │   ├── model-router.ts          # Task-based model selection
│   │   │   ├── workforce-orchestrator.ts # Main orchestrator
│   │   │   └── multi-agent-coordinator.ts
│   │   └── employees/         # AI employee management
│   ├── auth/                  # Authentication
│   └── integrations/          # External services
├── features/                  # Feature modules
│   ├── chat/                  # Multi-agent chat interface ⭐
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx       # Enhanced message display
│   │   │   ├── ChatComposer.tsx        # Model + Employee selection
│   │   │   └── EmployeeWorkStream.tsx  # Inline collaboration view
│   │   └── pages/
│   │       └── ChatInterface.tsx
│   ├── workforce/             # Employee hiring & management
│   └── marketplace/           # AI employee marketplace
├── shared/                    # Shared utilities
│   ├── stores/                # Zustand state management
│   │   ├── chat-store.ts
│   │   └── mission-control-store.ts  # Real-time orchestration state
│   └── components/            # Reusable components
└── .agi/                      # AI employee definitions 📁
    └── employees/             # Employee markdown files
        ├── code-reviewer.md
        ├── debugger.md
        ├── frontend-engineer.md
        ├── backend-engineer.md
        └── architect.md
```

### Plan-Delegate-Execute Pattern

The core orchestration follows a three-stage pattern:

1. **🧠 Planning**: LLM analyzes user request and generates execution plan
2. **🤖 Delegation**: Selects optimal AI employees based on task requirements
3. **⚡ Execution**: Tasks execute in parallel with real-time status updates

## 🎨 Creating Custom AI Employees

Add new employees by creating markdown files in `.agi/employees/`:

```markdown
---
name: data-scientist
description: Expert in data analysis, machine learning, and statistical modeling
tools: Read, Grep, Bash, Python
model: inherit
---

# Data Scientist AI Employee

You are an expert data scientist with advanced knowledge of:

- Statistical analysis and hypothesis testing
- Machine learning algorithms (supervised & unsupervised)
- Data visualization (matplotlib, seaborn, plotly)
- Python libraries (pandas, numpy, scikit-learn)

## Your Responsibilities

1. Analyze datasets for insights and patterns
2. Build predictive models
3. Create compelling data visualizations
4. Communicate findings clearly

[... detailed instructions ...]
```

The employee is **automatically available** after saving the file—no code changes required!

## 📊 Development Commands

```bash
# Development
npm run dev                # Start dev server (port 5173)
npm run build             # Production build
npm run preview           # Preview production build

# Code Quality
npm run lint              # ESLint
npm run type-check        # TypeScript checking (must pass!)
npm run format            # Format with Prettier

# Testing
npm run test              # Run Vitest unit tests
npm run test:ui           # Tests with UI
npm run e2e               # Playwright E2E tests

# Database
supabase start            # Start local Supabase
supabase db reset         # Reset & apply migrations
supabase migration new    # Create new migration
```

## 🚀 Deployment

### Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on every push to main

```bash
# Manual build
npm run build:prod

# Output in dist/
```

### Environment Setup

For production, set these environment variables in Netlify:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `OPENAI_API_KEY` (server-side)
- `ANTHROPIC_API_KEY` (server-side)
- `GOOGLE_API_KEY` (server-side)
- `STRIPE_SECRET_KEY` (server-side)
- `STRIPE_WEBHOOK_SECRET` (server-side)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- **TypeScript**: Use strict mode, no `any` types
- **Path Aliases**: Always use `@shared`, `@features`, `@core`
- **State Management**: Use Zustand with Immer
- **Testing**: Write tests for business logic
- **Documentation**: Update docs for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Inspiration**: [mgx.dev](https://mgx.dev) for transparent multi-agent collaboration UI
- **UI/UX**: [ChatGPT](https://chatgpt.com) and [Claude.ai](https://claude.ai) for interface design patterns
- **Community**: Anthropic, OpenAI, and Google for powering our AI employees

## 📞 Support

- **Documentation**: [Full Docs](docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/agiagentautomation/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/agiagentautomation/discussions)

---

<p align="center">
  <b>Built with ❤️ by the AGI Agent Automation Team</b><br>
  <sub>Transforming how humans and AI collaborate</sub>
</p>
