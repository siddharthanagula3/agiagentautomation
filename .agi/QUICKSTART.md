# Mission Control Quick Start Guide

## Overview

The AI Workforce Mission Control is a sophisticated orchestration system that:

1. **Plans** - Breaks down complex requests into structured tasks
2. **Delegates** - Assigns tasks to specialized AI employees based on skills
3. **Executes** - Runs tasks with employee-specific prompts and tools

---

## Adding New AI Employees

### 1. Create a Markdown File

Create a new file in `.agi/employees/` with this structure:

```markdown
---
name: unique-employee-id
description: Brief description of what this employee does (1-2 sentences)
tools: Tool1, Tool2, Tool3
model: inherit
---

You are a [role description].

Your responsibilities:

- Responsibility 1
- Responsibility 2
- Responsibility 3

When invoked, you should:

1. Step 1
2. Step 2
3. Step 3

[Additional instructions, guidelines, or examples]
```

### 2. Employee Template Examples

**Frontend Specialist:**

```markdown
---
name: frontend-developer
description: Expert React/TypeScript developer specializing in modern UI components and state management
tools: Read, Write, Edit, Glob, Grep
model: inherit
---

You are a senior frontend developer with expertise in React 18, TypeScript, and modern web technologies.

Your responsibilities:

- Build responsive, accessible UI components
- Implement state management with Zustand/React Query
- Follow design system guidelines (Tailwind + Shadcn/ui)
- Ensure TypeScript type safety

When building components:

1. Start with interface definitions
2. Use functional components with hooks
3. Implement proper error handling
4. Add loading states
5. Follow existing patterns in the codebase

Code standards:

- 2-space indentation
- Descriptive variable names
- Extract reusable logic into custom hooks
- Use path aliases (@features, @shared, @\_core)
```

**Backend Specialist:**

```markdown
---
name: backend-engineer
description: Expert backend developer specializing in API design, database schemas, and server-side logic
tools: Read, Write, Edit, Glob, Grep, Bash
model: inherit
---

You are a senior backend engineer with expertise in Node.js, Supabase, and API design.

Your responsibilities:

- Design RESTful APIs with proper error handling
- Create database schemas with proper indexing
- Implement Row Level Security (RLS) policies
- Write efficient SQL queries

When creating APIs:

1. Define TypeScript interfaces first
2. Implement input validation
3. Add proper error messages
4. Include usage examples
5. Write tests for edge cases

Database patterns:

- Use Supabase client from @shared/lib/supabase-client
- Always implement RLS policies
- Use transactions for multi-step operations
- Index foreign keys and frequently queried fields
```

**DevOps Specialist:**

```markdown
---
name: devops-engineer
description: DevOps expert handling CI/CD, containerization, and deployment automation
tools: Bash, Read, Write, Edit
model: inherit
---

You are a DevOps engineer specializing in modern deployment pipelines and infrastructure.

Your responsibilities:

- Set up CI/CD pipelines (GitHub Actions, Netlify)
- Create Docker configurations
- Automate deployment processes
- Monitor application health

When setting up pipelines:

1. Start with build verification (lint, type-check, test)
2. Add security scanning
3. Implement staging deployment
4. Add production deployment with approval gates
5. Set up monitoring and alerts

Best practices:

- Use environment variables for secrets
- Implement health checks
- Add rollback mechanisms
- Document deployment procedures
```

### 3. Field Descriptions

- **name**: Unique identifier (lowercase, hyphens only)
- **description**: What the employee does (shown in UI)
- **tools**: Comma-separated list of available tools
  - Common tools: `Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch`
- **model**: Usually `inherit` (uses user's configured model)

---

## Using the System

### Method 1: Mission Control (Complex Tasks)

Navigate to `/mission-control` for multi-step tasks requiring coordination:

```
User Input: "Build a user profile page with settings"

↓ PLANNING
Tasks Generated:
1. Design UI layout
2. Create React components
3. Add state management
4. Implement API calls
5. Add form validation

↓ DELEGATION
Employees Assigned:
- Frontend Developer → Tasks 1, 2
- Backend Engineer → Task 4
- QA Engineer → Task 5

↓ EXECUTION
Tasks Execute in Order
Real-time progress updates shown
```

**Good for:**

- Building complete features
- Multi-file changes
- Cross-domain tasks (frontend + backend)
- Tasks requiring multiple specialists

### Method 2: Standard Chat (Simple Tasks)

Navigate to `/chat` for direct conversations:

```
User: "Explain how authentication works in this app"
AI: [Detailed explanation with code examples]

User: "Add a loading spinner to the login button"
AI: [Makes the specific change]
```

**Good for:**

- Quick questions
- Single-file edits
- Code explanations
- Debugging assistance

---

## Example Workflows

### Workflow 1: Add New Feature

**Input:**

```
"Add a dark mode toggle to the settings page with persistent storage"
```

**What Happens:**

1. **Planner** analyzes request → Creates 4 tasks:
   - Task 1: Add dark mode state management
   - Task 2: Create toggle UI component
   - Task 3: Implement theme switching logic
   - Task 4: Save preference to localStorage

2. **Delegator** assigns employees:
   - Frontend Developer → Tasks 1, 2, 3
   - QA Engineer → Task 4 (testing)

3. **Executor** runs tasks sequentially:
   - Shows progress for each task
   - Updates UI in real-time
   - Displays results

**UI Display:**

```
┌─ Workforce Status ─────┐  ┌─ Mission Log ──────────────────┐
│ Frontend Developer     │  │ 🔍 Analyzing your request...   │
│ Status: Working        │  │                                │
│ Progress: [████▓░░░] 75%│  │ ✅ Plan Created (4 tasks)      │
│ Tool: Write            │  │                                │
│                        │  │ 📋 Task Breakdown:             │
│ QA Engineer            │  │ ▸ Add dark mode state (Done)   │
│ Status: Idle           │  │ ▸ Create toggle UI (Working)   │
│ Progress: [░░░░░░░░] 0%│  │ ▸ Implement switching (Pending)│
│                        │  │ ▸ Add persistence (Pending)    │
└────────────────────────┘  └────────────────────────────────┘
```

### Workflow 2: Fix Bug

**Input:**

```
"The login button is not disabled during loading, causing double submissions"
```

**What Happens:**

1. **Debugger employee** investigates:
   - Reads LoginPage component
   - Identifies missing disabled prop
   - Checks loading state

2. **Frontend Developer** fixes:
   - Adds disabled={isLoading} to button
   - Adds loading spinner
   - Updates button text

3. **QA Engineer** verifies:
   - Checks edge cases
   - Tests loading state transitions
   - Confirms no regressions

### Workflow 3: Code Review

**Input:**

```
"Review the recent changes to the authentication system"
```

**What Happens:**

1. **Code Reviewer** activates automatically:
   - Runs `git diff` to see changes
   - Analyzes modified files
   - Checks against review checklist

2. **Provides Feedback:**

   ```
   Critical Issues:
   - ❌ API key exposed in auth-service.ts:42

   Warnings:
   - ⚠️ Missing error handling in login function
   - ⚠️ No input validation on email field

   Suggestions:
   - 💡 Consider adding rate limiting
   - 💡 Add logging for failed login attempts
   ```

---

## Available Tools

Employees can use these tools (specified in `tools:` field):

### File Operations

- **Read** - Read file contents
- **Write** - Create new files
- **Edit** - Modify existing files
- **Glob** - Find files by pattern (e.g., `**/*.tsx`)
- **Grep** - Search file contents with regex

### System Operations

- **Bash** - Execute shell commands
  - Git operations
  - Build commands
  - File system operations

### Web Operations

- **WebFetch** - Fetch web pages for analysis
- **WebSearch** - Search the web for information

### Specialized

- **Task** - Launch sub-agents for complex tasks

---

## Best Practices

### 1. Employee Design

**DO:**
✅ Give specific, actionable instructions
✅ Include checklists and step-by-step procedures
✅ Provide code examples for common patterns
✅ Define clear scope and responsibilities

**DON'T:**
❌ Make descriptions too vague
❌ Overlap responsibilities with other employees
❌ Include unnecessary tools
❌ Write overly long system prompts (keep under 2000 tokens)

### 2. Task Requests

**Good Requests:**

```
"Build a user dashboard with:
- Recent activity feed
- Usage statistics chart
- Quick action buttons
- Settings link
Use existing design system components"
```

**Poor Requests:**

```
"Make the dashboard better"
"Fix the thing"
"Add features"
```

**Why:** Specific requests → Better plans → Better results

### 3. Employee Specialization

Create focused specialists rather than generalists:

**Good:**

- Frontend Developer (React/UI only)
- Backend Developer (APIs/DB only)
- DevOps Engineer (Deploy/CI only)

**Less Effective:**

- Full-Stack Developer (tries to do everything)
- General Developer (unclear scope)

**Why:** Specialization → Better prompts → Better results

---

## Troubleshooting

### Employee Not Loading

**Problem:** Employee markdown file not appearing

**Check:**

1. File is in `.agi/employees/` directory
2. File has `.md` extension
3. YAML frontmatter is valid (proper `---` delimiters)
4. Required fields present: `name`, `description`, `tools`, `model`

**Test:**

```typescript
import { systemPromptsService } from '@_core/api/system-prompts-service';

const employees = await systemPromptsService.getAvailableEmployees();
console.log('Loaded employees:', employees);
```

### Task Failing

**Problem:** Task marked as failed

**Debug:**

1. Check employee has required tools in `tools:` field
2. Verify system prompt is clear and actionable
3. Check for syntax errors in markdown
4. Look at error message in mission log

### No Employees Assigned

**Problem:** Plan created but no employees assigned

**Causes:**

1. No employees match the required skills
2. Employee descriptions don't align with task
3. Task description too vague

**Fix:**

- Add more specialized employees
- Improve task descriptions
- Update employee `description:` fields

---

## File Locations

```
.agi/
├── employees/           # Employee definitions
│   ├── code-reviewer.md
│   ├── debugger.md
│   └── [your-new-employee].md
│
└── QUICKSTART.md       # This file

src/
├── _core/
│   └── orchestration/
│       └── workforce-orchestrator-refactored.ts  # Main orchestrator
│
└── shared/
    └── stores/
        └── mission-store.ts                     # State management
```

---

## Next Steps

1. **Add More Employees:**
   - Copy existing `.md` files as templates
   - Customize for your needs
   - Test with simple tasks first

2. **Test the System:**
   - Start with simple requests
   - Watch the orchestration in action
   - Iterate on employee prompts

3. **Monitor Performance:**
   - Check task success rates
   - Identify which employees are most effective
   - Refine prompts based on results

4. **Expand Capabilities:**
   - Add specialized tools
   - Create domain-specific employees
   - Build task templates

---

**Happy Building! 🚀**

For questions or issues, check [MISSION_CONTROL_IMPLEMENTATION.md](../MISSION_CONTROL_IMPLEMENTATION.md)
