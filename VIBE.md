# VIBE - Multi-Agent Collaborative Interface

**Ultimate Implementation Plan & Technical Specification**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Research Findings](#research-findings)
4. [Component Architecture](#component-architecture)
5. [UI/UX Design Specification](#uiux-design-specification)
6. [Agent Selection Algorithm](#agent-selection-algorithm)
7. [Collaboration Protocol](#collaboration-protocol)
8. [Parallel Execution Engine](#parallel-execution-engine)
9. [Tool Integration System](#tool-integration-system)
10. [File System Integration](#file-system-integration)
11. [Database Schema](#database-schema)
12. [API Endpoints](#api-endpoints)
13. [State Management](#state-management)
14. [Real-time Updates](#real-time-updates)
15. [Streaming Response Implementation](#streaming-response-implementation)
16. [Manual Employee Selection](#manual-employee-selection)
17. [Fallback Mechanism](#fallback-mechanism)
18. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### Vision

The `/vibe` interface transforms AGI Agent Automation into a **MetaGPT-inspired multi-agent collaborative workspace** where AI employees work together like a real software development team. Users interact through natural conversation while specialized agents orchestrate complex tasks through structured communication protocols.

### Key Differentiators from Current Chat

| Feature | Current Chat | VIBE Interface |
|---------|-------------|----------------|
| **Routing** | Stateless API | Intelligent agent selection (keyword + semantic) |
| **Agents** | Single generic response | Multiple specialized employees |
| **Execution** | Sequential | Parallel task execution |
| **Visibility** | Hidden | Real-time status indicators |
| **Context** | Per-message | Full conversation history |
| **Tools** | None | Code, files, documents, web |
| **Mode** | One-shot | Continuous collaboration |
| **UI** | Standard chat | Specialized workspace |

### Core Requirements

1. **Hybrid Agent Selection**: Auto-select via keywords + semantic analysis, manual override with `#`
2. **Context-Aware Switching**: Auto-switch agents when user changes topic
3. **Role Identification**: Show employee role on every message
4. **Visual Feedback**: "thinking..." indicator, status badges, streaming responses
5. **Complexity Analysis**: Single agent for simple tasks, supervisor orchestration for complex projects
6. **Full Memory**: All agents access complete conversation history
7. **Minimal UI**: Only Dashboard link in sidebar, clean chat-focused interface
8. **File Integration**: `@` syntax for file/folder selection
9. **Hired Employees Only**: Only show employees purchased from marketplace
10. **Fallback**: Stateless API response if no matching employee exists

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      /vibe Interface                         │
│                                                              │
│  ┌────────────┐                           ┌──────────────┐  │
│  │  Sidebar   │                           │ Chat Canvas  │  │
│  │            │                           │              │  │
│  │ Dashboard →│                           │  Messages    │  │
│  │            │                           │  Input       │  │
│  │            │                           │  Status      │  │
│  └────────────┘                           └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Agent Selection & Routing Layer                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Keyword    │  │   Semantic   │  │   Complexity     │  │
│  │   Matcher    │→ │   Analyzer   │→ │   Evaluator      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                              ↓                               │
│              [ Single Agent | Supervisor Team ]              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           Collaboration Protocol (MetaGPT-inspired)          │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Global Message Pool (Pub-Sub)                │  │
│  │                                                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │  │
│  │  │ Agent A │  │ Agent B │  │ Agent C │  ...         │  │
│  │  │ Publish │  │ Publish │  │ Publish │              │  │
│  │  │Subscribe│  │Subscribe│  │Subscribe│              │  │
│  │  └─────────┘  └─────────┘  └─────────┘              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Execution Layer                             │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Tool    │  │  File    │  │  Code    │  │   Web    │   │
│  │Execution │  │ System   │  │  Gen     │  │  Search  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Persistence Layer                           │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   Supabase     │  │   Zustand      │  │   Netlify    │  │
│  │   Database     │  │   State        │  │   Functions  │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**:
- React 18 with TypeScript
- Zustand for state management
- Tailwind CSS for styling
- Framer Motion for animations
- React Markdown for message rendering

**Backend**:
- Netlify Functions (serverless)
- Supabase (database + realtime)
- Existing workforce orchestrator
- Unified LLM service

**New Core Services**:
1. `vibe-agent-router.ts` - Agent selection & routing
2. `vibe-collaboration-protocol.ts` - Structured communication
3. `vibe-execution-coordinator.ts` - Parallel task execution
4. `vibe-message-pool.ts` - Global pub-sub message system
5. `vibe-complexity-analyzer.ts` - Task complexity evaluation
6. `vibe-tool-orchestrator.ts` - Tool execution coordination
7. `vibe-file-manager.ts` - File upload/reference system

---

## Research Findings

### MGX.dev Architecture Insights

**Agent Roles** (directly applicable to our system):
1. **Mike (Team Leader)**: Coordinates, delegates, retrieves real-time info
2. **Emma (Product Manager)**: PRDs, feature prioritization
3. **Bob (Architect)**: System design, technical blueprints
4. **Alex (Engineer)**: Full-stack development, deployment
5. **David (Data Analyst)**: ML, analytics, data processing
6. **Iris (Researcher)**: Deep research, market analysis

**UI Patterns**:
- `@agent` syntax for manual agent selection
- `#file` syntax for file references
- Streaming responses with visual indicators
- Real-time status badges
- Minimal sidebar (focus on chat)

**Modes**:
- **Engineer Mode**: Single agent, direct execution
- **Team Mode**: Supervisor + multi-agent orchestration
- **Race Mode**: Parallel execution, best result selection

### MetaGPT Framework Principles

**Core Innovation**: `Code = SOP(Team)`

**Key Concepts**:
1. **Structured Communication**: No freeform chat between agents, only standardized outputs
2. **Global Message Pool**: Centralized pub-sub system prevents information overload
3. **Role-Based Subscriptions**: Agents only receive relevant messages
4. **Assembly Line Paradigm**: Sequential workflow with clear handoffs
5. **SOP Encoding**: Each agent role has defined SOPs in their prompts

**Agent Workflow**:
```
User Input → PM (PRD) → Architect (Design) → PM (Tasks) → Engineer (Code) → QA (Test) → Output
```

**Benefits**:
- Reduced hallucinations (structured output prevents drift)
- Clear handoff protocols (no ambiguity)
- Reproducible workflows (SOP-based)
- Parallel execution (independent subtasks)

### Adaptation for AGI Agent Automation

We'll implement a **hybrid model**:

1. **Maintain our file-based employee system** (flexibility)
2. **Add MetaGPT's structured communication** (reliability)
3. **Use MGX's UI patterns** (usability)
4. **Integrate existing orchestrator** (leverage what works)

**Our Unique Advantages**:
- 140+ pre-built AI employees vs MGX's 6 agents
- Marketplace for hiring (scalability)
- User-owned employees (personalization)
- Existing token system (monetization)

---

## Component Architecture

### Directory Structure

```
src/features/vibe/
├── pages/
│   └── VibeDashboard.tsx              # Main /vibe route
│
├── components/
│   ├── layout/
│   │   ├── VibeSidebar.tsx            # Minimal sidebar (Dashboard link only)
│   │   └── VibeLayout.tsx             # Overall layout wrapper
│   │
│   ├── chat/
│   │   ├── VibeChatCanvas.tsx         # Main chat container
│   │   ├── VibeMessageList.tsx        # Scrollable message list
│   │   ├── VibeMessage.tsx            # Individual message bubble
│   │   ├── VibeMessageInput.tsx       # Input with # and @ autocomplete
│   │   ├── VibeAgentAvatar.tsx        # Employee avatar + role badge
│   │   ├── VibeThinkingIndicator.tsx  # "thinking..." animation
│   │   └── VibeStatusBar.tsx          # Active agents + task status
│   │
│   ├── agents/
│   │   ├── AgentSelector.tsx          # Manual agent selection (# trigger)
│   │   ├── AgentStatusCard.tsx        # Real-time agent status
│   │   └── AgentWorkstream.tsx        # Parallel execution visualization
│   │
│   ├── files/
│   │   ├── FileSelector.tsx           # File/folder picker (@ trigger)
│   │   ├── FileUpload.tsx             # Drag & drop upload
│   │   └── FilePreview.tsx            # Inline file preview
│   │
│   └── collaboration/
│       ├── TaskBreakdown.tsx          # Show decomposed tasks
│       ├── SupervisorPanel.tsx        # Supervisor orchestration UI
│       └── ExecutionTimeline.tsx      # Visual task timeline
│
├── services/
│   ├── vibe-agent-router.ts           # Agent selection logic
│   ├── vibe-collaboration-protocol.ts # Structured communication
│   ├── vibe-execution-coordinator.ts  # Parallel execution
│   ├── vibe-message-pool.ts           # Global message system
│   ├── vibe-complexity-analyzer.ts    # Task complexity evaluation
│   ├── vibe-tool-orchestrator.ts      # Tool execution
│   ├── vibe-file-manager.ts           # File handling
│   └── vibe-streaming-handler.ts      # SSE streaming
│
├── hooks/
│   ├── use-vibe-chat.ts               # Main chat hook
│   ├── use-agent-selection.ts         # Agent routing hook
│   ├── use-file-upload.ts             # File management hook
│   ├── use-autocomplete.ts            # # and @ autocomplete
│   └── use-streaming-response.ts      # Streaming message hook
│
├── stores/
│   ├── vibe-chat-store.ts             # Vibe chat state (Zustand)
│   ├── vibe-agent-store.ts            # Active agents state
│   └── vibe-file-store.ts             # File references state
│
└── types/
    ├── vibe-message.ts                # Message types
    ├── vibe-agent.ts                  # Agent types
    └── vibe-task.ts                   # Task types
```

### Key Component Specifications

#### 1. `VibeDashboard.tsx` - Main Page Component

**Purpose**: Entry point for `/vibe` route, accessible from "Start Building" button in `/workforce`

**Structure**:
```tsx
const VibeDashboard: React.FC = () => {
  return (
    <VibeLayout>
      <VibeSidebar />
      <VibeChatCanvas />
    </VibeLayout>
  );
};
```

**Routing**:
```tsx
// In AppRouter.tsx
<Route
  path="/vibe"
  element={
    <ProtectedRoute>
      <VibeDashboard />
    </ProtectedRoute>
  }
/>
```

**Access Control**:
- Requires authentication
- Checks if user has hired employees
- Shows onboarding if no employees exist

---

#### 2. `VibeSidebar.tsx` - Minimal Sidebar

**Purpose**: Clean, focused sidebar with only Dashboard navigation

**Design**:
```tsx
<aside className="w-16 bg-card border-r border-border flex flex-col items-center py-4">
  {/* Logo */}
  <Link to="/" className="mb-8">
    <Logo size="sm" />
  </Link>

  {/* Dashboard Link */}
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/dashboard"
          className="p-3 rounded-lg hover:bg-muted transition-colors"
        >
          <LayoutDashboard size={20} />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Back to Dashboard</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  {/* Spacer */}
  <div className="flex-1" />

  {/* User Profile (bottom) */}
  <UserProfileMenu />
</aside>
```

**Styling Reference**: MGX minimal sidebar from screenshots

---

#### 3. `VibeChatCanvas.tsx` - Main Chat Container

**Purpose**: Primary chat interface with messages, input, and status

**Layout**:
```tsx
<div className="flex-1 flex flex-col h-screen">
  {/* Header */}
  <header className="border-b border-border px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold">AI Workforce Vibe</h1>
        <p className="text-sm text-muted-foreground">
          {activeAgents.length} {activeAgents.length === 1 ? 'agent' : 'agents'} active
        </p>
      </div>
      <VibeStatusBar agents={activeAgents} />
    </div>
  </header>

  {/* Messages */}
  <div className="flex-1 overflow-y-auto">
    <VibeMessageList messages={messages} />
  </div>

  {/* Input */}
  <div className="border-t border-border p-4">
    <VibeMessageInput
      onSend={handleSend}
      onFileSelect={handleFileSelect}
      hiredEmployees={hiredEmployees}
    />
  </div>
</div>
```

---

#### 4. `VibeMessage.tsx` - Message Bubble Component

**Purpose**: Display individual messages with agent identity

**Message Types**:
1. **User Message**: Right-aligned, primary color
2. **Agent Message**: Left-aligned, with avatar + role
3. **System Message**: Center-aligned, muted
4. **Thinking Message**: Animated "thinking..." indicator

**Agent Message Structure**:
```tsx
<div className="flex gap-3 mb-4">
  {/* Agent Avatar */}
  <VibeAgentAvatar
    employee={message.employee}
    status={message.employee.status}
  />

  <div className="flex-1">
    {/* Role Badge */}
    <div className="flex items-center gap-2 mb-1">
      <span className="text-sm font-medium">{message.employee.name}</span>
      <Badge variant="outline" className="text-xs">
        {message.employee.role}
      </Badge>
    </div>

    {/* Message Content */}
    <div className="bg-card rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
      <ReactMarkdown>{message.content}</ReactMarkdown>
    </div>

    {/* Timestamp */}
    <span className="text-xs text-muted-foreground mt-1">
      {formatTimestamp(message.timestamp)}
    </span>
  </div>
</div>
```

**Streaming Support**:
```tsx
{message.isStreaming && (
  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
)}
```

---

#### 5. `VibeMessageInput.tsx` - Enhanced Input Component

**Purpose**: Chat input with autocomplete for `#` (agents) and `@` (files)

**Features**:
- `#` triggers agent selector dropdown
- `@` triggers file selector dropdown
- Drag & drop file upload
- Multi-line support (Shift+Enter for newline, Enter to send)
- Token usage indicator

**Autocomplete Logic**:
```tsx
const handleInputChange = (value: string) => {
  const lastChar = value[value.length - 1];
  const cursorPosition = inputRef.current?.selectionStart || 0;

  // Find trigger character before cursor
  const textBeforeCursor = value.slice(0, cursorPosition);
  const lastTrigger = textBeforeCursor.match(/(#|@)\w*$/);

  if (lastTrigger) {
    const [fullMatch, trigger, query] = lastTrigger;

    if (trigger === '#') {
      // Show agent autocomplete
      setAutocompleteType('agent');
      setAutocompleteQuery(query);
      setShowAutocomplete(true);
    } else if (trigger === '@') {
      // Show file autocomplete
      setAutocompleteType('file');
      setAutocompleteQuery(query);
      setShowAutocomplete(true);
    }
  } else {
    setShowAutocomplete(false);
  }
};
```

**Autocomplete Dropdown**:
```tsx
{showAutocomplete && (
  <Popover>
    <PopoverContent className="w-80 p-2">
      {autocompleteType === 'agent' ? (
        <AgentSelector
          employees={hiredEmployees}
          query={autocompleteQuery}
          onSelect={handleAgentSelect}
        />
      ) : (
        <FileSelector
          files={uploadedFiles}
          query={autocompleteQuery}
          onSelect={handleFileSelect}
        />
      )}
    </PopoverContent>
  </Popover>
)}
```

---

#### 6. `VibeAgentAvatar.tsx` - Agent Identity Component

**Purpose**: Display employee avatar, name, and status

**Design**:
```tsx
<div className="relative">
  {/* Avatar */}
  <Avatar className="h-10 w-10">
    <AvatarImage src={employee.avatar} alt={employee.name} />
    <AvatarFallback>{employee.name[0]}</AvatarFallback>
  </Avatar>

  {/* Status Indicator */}
  <div className="absolute -bottom-1 -right-1">
    {employee.status === 'active' && (
      <div className="h-3 w-3 bg-success rounded-full border-2 border-background animate-pulse" />
    )}
    {employee.status === 'thinking' && (
      <div className="h-3 w-3 bg-warning rounded-full border-2 border-background animate-spin" />
    )}
    {employee.status === 'idle' && (
      <div className="h-3 w-3 bg-muted rounded-full border-2 border-background" />
    )}
  </div>
</div>
```

**Status Types**:
- `active`: Solid green, pulsing (agent is responding)
- `thinking`: Yellow, spinning (agent is processing)
- `idle`: Gray (agent waiting/finished)
- `error`: Red (agent encountered error)

---

#### 7. `VibeThinkingIndicator.tsx` - Loading State

**Purpose**: Show "thinking..." state before agent responds

**Design**:
```tsx
<div className="flex items-center gap-2 text-muted-foreground">
  <div className="flex gap-1">
    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
  </div>
  <span className="text-sm">thinking...</span>
</div>
```

**When to Show**:
1. User sends message → Show immediately
2. Agent selection in progress → Show
3. Complexity analysis in progress → Show
4. First token hasn't arrived yet → Show
5. Hide when streaming starts

---

#### 8. `VibeStatusBar.tsx` - Active Agents Display

**Purpose**: Show which agents are currently working

**Design**:
```tsx
<div className="flex items-center gap-2">
  {activeAgents.map((agent) => (
    <div key={agent.id} className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
      <VibeAgentAvatar employee={agent} size="xs" />
      <span className="text-xs">{agent.role}</span>
    </div>
  ))}
</div>
```

**Updates**:
- Real-time via Zustand store
- Shows agents in "active" or "thinking" status
- Removes agents when they finish

---

## UI/UX Design Specification

### Design System

**Color Palette** (extends existing theme):
```css
:root {
  /* Agent Status Colors */
  --agent-active: 142 71% 45%;      /* Green */
  --agent-thinking: 38 92% 50%;     /* Yellow */
  --agent-idle: 0 0% 65%;           /* Gray */
  --agent-error: 0 84% 60%;         /* Red */

  /* Message Bubbles */
  --message-user: 217 91% 60%;      /* Primary blue */
  --message-agent: 0 0% 100%;       /* White (light mode) */
  --message-agent-dark: 0 0% 7%;    /* Dark gray (dark mode) */
  --message-system: 0 0% 96%;       /* Light gray */
}
```

### Typography

**Message Font Stack**:
```css
.vibe-message {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 15px;
  line-height: 1.6;
}

.vibe-message code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
}
```

### Spacing & Layout

**Chat Canvas**:
- Max width: Full viewport
- Message max-width: 85% of container
- Padding: 24px horizontal, 16px vertical
- Gap between messages: 16px

**Sidebar**:
- Width: 64px (fixed)
- Padding: 16px
- Icon size: 20px

### Animations

**Message Entry**:
```css
@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.agent-message {
  animation: slideInFromLeft 0.3s ease-out;
}
```

**Thinking Indicator**:
```css
@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
}

.thinking-dot {
  animation: bounce 1.4s infinite ease-in-out;
}
```

### Responsive Design

**Breakpoints**:
- Desktop: 1024px+ (full layout)
- Tablet: 768px-1023px (collapsed sidebar)
- Mobile: <768px (sidebar as drawer)

**Mobile Adjustments**:
- Sidebar becomes bottom sheet
- Message max-width: 95%
- Touch-optimized file upload
- Swipe gestures for navigation

---

## Agent Selection Algorithm

### Three-Stage Selection Process

```
User Input
    ↓
┌─────────────────────────────────────┐
│  Stage 1: Keyword Matching          │
│  - Fast pattern matching             │
│  - Confidence: 0-100%                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Stage 2: Semantic Analysis          │
│  - LLM-based intent classification   │
│  - Confidence: 0-100%                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Stage 3: Complexity Evaluation      │
│  - Single agent vs Supervisor        │
│  - Task breakdown if complex         │
└─────────────────────────────────────┘
    ↓
Selected Agent(s)
```

### Implementation: `vibe-agent-router.ts`

```typescript
import { AIEmployee } from '@core/types/ai-employee';
import { unifiedLLMService } from '@core/ai/llm/unified-language-model';

interface AgentMatch {
  employee: AIEmployee;
  confidence: number;
  reason: string;
}

interface RoutingResult {
  mode: 'single' | 'supervisor';
  primaryAgent?: AIEmployee;
  supervisorPlan?: SupervisorPlan;
  confidence: number;
}

export class VibeAgentRouter {
  /**
   * Main routing function
   * Determines which agent(s) should handle the user's message
   */
  async routeMessage(
    userMessage: string,
    conversationHistory: VibeMessage[],
    hiredEmployees: AIEmployee[]
  ): Promise<RoutingResult> {
    // Stage 1: Keyword matching (fast path)
    const keywordMatch = this.keywordMatch(userMessage, hiredEmployees);

    if (keywordMatch.confidence >= 0.9) {
      // High confidence keyword match - use it
      return {
        mode: 'single',
        primaryAgent: keywordMatch.employee,
        confidence: keywordMatch.confidence,
      };
    }

    // Stage 2: Semantic analysis (for ambiguous cases)
    const semanticMatch = await this.semanticMatch(
      userMessage,
      conversationHistory,
      hiredEmployees
    );

    if (semanticMatch.confidence >= 0.8) {
      return {
        mode: 'single',
        primaryAgent: semanticMatch.employee,
        confidence: semanticMatch.confidence,
      };
    }

    // Stage 3: Complexity evaluation
    const complexityResult = await this.analyzeComplexity(
      userMessage,
      conversationHistory,
      hiredEmployees
    );

    return complexityResult;
  }

  /**
   * Stage 1: Keyword Matching
   * Fast pattern matching against employee descriptions and keywords
   */
  private keywordMatch(
    userMessage: string,
    hiredEmployees: AIEmployee[]
  ): AgentMatch {
    const normalizedMessage = userMessage.toLowerCase();

    // Define keyword patterns for common domains
    const keywordPatterns = {
      health: ['health', 'medical', 'healthcare', 'doctor', 'nurse', 'patient', 'diagnosis'],
      email: ['email', 'message', 'reply', 'professional', 'business email'],
      code: ['code', 'programming', 'bug', 'debug', 'function', 'class', 'api'],
      design: ['design', 'ui', 'ux', 'interface', 'mockup', 'wireframe'],
      data: ['data', 'analytics', 'chart', 'graph', 'sql', 'database'],
      marketing: ['marketing', 'campaign', 'seo', 'social media', 'content'],
      legal: ['legal', 'contract', 'attorney', 'law', 'compliance'],
      finance: ['finance', 'budget', 'investment', 'tax', 'accounting'],
    };

    let bestMatch: AgentMatch = {
      employee: hiredEmployees[0],
      confidence: 0,
      reason: 'No match found',
    };

    for (const employee of hiredEmployees) {
      const employeeKeywords = this.extractKeywords(employee);
      let matchCount = 0;
      let totalKeywords = employeeKeywords.length;

      for (const keyword of employeeKeywords) {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }

      const confidence = totalKeywords > 0 ? matchCount / totalKeywords : 0;

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          employee,
          confidence,
          reason: `Matched ${matchCount} keywords: ${employeeKeywords.slice(0, 3).join(', ')}`,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Extract keywords from employee description and role
   */
  private extractKeywords(employee: AIEmployee): string[] {
    const keywords: string[] = [];

    // Add from description
    const descWords = employee.description.toLowerCase().split(/\s+/);
    keywords.push(...descWords.filter((w) => w.length > 4));

    // Add from name
    const nameWords = employee.name.toLowerCase().split('-');
    keywords.push(...nameWords);

    // Remove duplicates
    return [...new Set(keywords)];
  }

  /**
   * Stage 2: Semantic Analysis
   * Uses LLM to understand user intent when keywords are ambiguous
   */
  private async semanticMatch(
    userMessage: string,
    conversationHistory: VibeMessage[],
    hiredEmployees: AIEmployee[]
  ): Promise<AgentMatch> {
    const employeeDescriptions = hiredEmployees
      .map(
        (emp, idx) => `${idx + 1}. ${emp.name}: ${emp.description} (role: ${emp.role || 'specialist'})`
      )
      .join('\n');

    const prompt = `You are an intelligent routing system. Analyze the user's message and determine which AI employee should handle it.

User message: "${userMessage}"

Available employees:
${employeeDescriptions}

Respond in JSON format:
{
  "employeeIndex": <number (1-based)>,
  "confidence": <number (0-1)>,
  "reason": "<explanation>"
}`;

    try {
      const response = await unifiedLLMService.sendMessage([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const result = JSON.parse(response.content);

      return {
        employee: hiredEmployees[result.employeeIndex - 1],
        confidence: result.confidence,
        reason: result.reason,
      };
    } catch (error) {
      console.error('Semantic matching failed:', error);
      // Fallback to first employee
      return {
        employee: hiredEmployees[0],
        confidence: 0.5,
        reason: 'Fallback to default employee',
      };
    }
  }

  /**
   * Stage 3: Complexity Analysis
   * Determines if task needs single agent or supervisor orchestration
   */
  private async analyzeComplexity(
    userMessage: string,
    conversationHistory: VibeMessage[],
    hiredEmployees: AIEmployee[]
  ): Promise<RoutingResult> {
    const prompt = `Analyze this user request and determine its complexity.

User request: "${userMessage}"

Classify as:
- SIMPLE: Can be handled by a single specialist (e.g., "What are the symptoms of flu?", "Write a professional email", "Fix this bug")
- COMPLEX: Requires multiple specialists working together (e.g., "Build a website", "Create a marketing campaign", "Develop a full app")

Respond in JSON:
{
  "complexity": "SIMPLE" | "COMPLEX",
  "reasoning": "<explanation>",
  "estimatedSteps": <number>,
  "requiredSkills": ["<skill1>", "<skill2>"]
}`;

    try {
      const response = await unifiedLLMService.sendMessage([
        {
          role: 'user',
          content: prompt,
        },
      ]);

      const result = JSON.parse(response.content);

      if (result.complexity === 'SIMPLE') {
        // Find best matching employee for required skills
        const match = await this.semanticMatch(
          userMessage,
          conversationHistory,
          hiredEmployees
        );

        return {
          mode: 'single',
          primaryAgent: match.employee,
          confidence: match.confidence,
        };
      } else {
        // Complex task - invoke supervisor
        const supervisorPlan = await this.createSupervisorPlan(
          userMessage,
          result.requiredSkills,
          hiredEmployees
        );

        return {
          mode: 'supervisor',
          supervisorPlan,
          confidence: 0.95,
        };
      }
    } catch (error) {
      console.error('Complexity analysis failed:', error);
      // Default to simple mode
      return {
        mode: 'single',
        primaryAgent: hiredEmployees[0],
        confidence: 0.5,
      };
    }
  }

  /**
   * Create supervisor execution plan for complex tasks
   */
  private async createSupervisorPlan(
    userMessage: string,
    requiredSkills: string[],
    hiredEmployees: AIEmployee[]
  ): Promise<SupervisorPlan> {
    // This will integrate with existing workforce orchestrator
    // For now, return a basic plan structure
    return {
      mainGoal: userMessage,
      tasks: [],
      assignedAgents: [],
      estimatedDuration: 0,
    };
  }

  /**
   * Context-aware switching
   * Detects when user changes topic mid-conversation
   */
  detectContextSwitch(
    newMessage: string,
    currentAgent: AIEmployee,
    conversationHistory: VibeMessage[]
  ): boolean {
    // Extract last few messages
    const recentMessages = conversationHistory.slice(-5);
    const recentTopics = recentMessages.map((m) => this.extractTopic(m.content));

    const newTopic = this.extractTopic(newMessage);

    // Check if new topic significantly different from current agent's domain
    const currentDomain = this.extractKeywords(currentAgent);
    const topicMatch = currentDomain.some((keyword) =>
      newTopic.toLowerCase().includes(keyword.toLowerCase())
    );

    return !topicMatch;
  }

  /**
   * Extract main topic from message using simple heuristics
   */
  private extractTopic(message: string): string {
    // Remove common words
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'can', 'you'];
    const words = message.toLowerCase().split(/\s+/);
    const meaningfulWords = words.filter(
      (w) => !stopWords.includes(w) && w.length > 3
    );

    return meaningfulWords.slice(0, 3).join(' ');
  }
}

// Export singleton instance
export const vibeAgentRouter = new VibeAgentRouter();
```

### Context Switching Logic

**When to Switch**:
1. User explicitly mentions new domain ("Now let's talk about marketing...")
2. Keywords shift significantly (health → finance)
3. User uses `#` to manually select different agent

**How to Switch**:
```typescript
// In use-vibe-chat.ts hook
useEffect(() => {
  if (!currentAgent) return;

  const shouldSwitch = vibeAgentRouter.detectContextSwitch(
    currentMessage,
    currentAgent,
    conversationHistory
  );

  if (shouldSwitch) {
    // Route to new agent
    const newRouting = await vibeAgentRouter.routeMessage(
      currentMessage,
      conversationHistory,
      hiredEmployees
    );

    setCurrentAgent(newRouting.primaryAgent);

    // Add system message
    addSystemMessage(
      `Switched to ${newRouting.primaryAgent.name} (${newRouting.primaryAgent.role})`
    );
  }
}, [currentMessage]);
```

---

## Collaboration Protocol

### MetaGPT-Inspired Structured Communication

**Core Principles**:
1. **No Freeform Agent Chat**: Agents don't "talk" to each other in natural language
2. **Structured Outputs**: Each agent produces standardized deliverables
3. **Global Message Pool**: Centralized pub-sub system for messages
4. **Role-Based Subscriptions**: Agents only receive relevant messages
5. **Clear Handoff Protocols**: Defined input/output contracts

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Global Message Pool                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Message Queue (In-Memory + Supabase Persistence)    │  │
│  │                                                       │  │
│  │  [Message 1] [Message 2] [Message 3] ...             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↑   ↓                              │
│              ┌───────────┘   └───────────┐                 │
│              │ Publish            Subscribe│                 │
└──────────────┼──────────────────────────┼─────────────────┘
               │                          │
       ┌───────┴────┐              ┌─────┴────────┐
       │  Agent A   │              │   Agent B    │
       │  Publishes │              │  Subscribes  │
       │  Results   │              │  to A's msgs │
       └────────────┘              └──────────────┘
```

### Implementation: `vibe-collaboration-protocol.ts`

```typescript
import { EventEmitter } from 'events';
import { create } from 'zustand';
import { supabase } from '@shared/lib/supabase-client';

// Message Types
export interface StructuredMessage {
  id: string;
  type: MessageType;
  from: string; // employee name
  to: string[]; // employee names or 'broadcast'
  timestamp: Date;
  content: MessageContent;
  metadata: MessageMetadata;
}

export type MessageType =
  | 'task_assignment'
  | 'task_result'
  | 'status_update'
  | 'question'
  | 'resource_request'
  | 'handoff';

export interface MessageContent {
  // For task assignments
  task?: {
    id: string;
    description: string;
    requirements: string[];
    deadline?: Date;
  };

  // For results
  result?: {
    taskId: string;
    output: any;
    artifacts: Artifact[];
    status: 'success' | 'partial' | 'failed';
  };

  // For status updates
  status?: {
    state: 'idle' | 'thinking' | 'executing' | 'waiting';
    progress: number; // 0-100
    currentStep: string;
  };

  // For questions (rare - agents should be autonomous)
  question?: {
    text: string;
    context: string;
    urgency: 'low' | 'medium' | 'high';
  };
}

export interface MessageMetadata {
  correlationId?: string; // Link related messages
  priority: number; // 1-10
  retryCount: number;
  expiresAt?: Date;
}

export interface Artifact {
  type: 'code' | 'document' | 'data' | 'image' | 'file';
  name: string;
  content: string | Buffer;
  metadata: Record<string, any>;
}

/**
 * Global Message Pool
 * Centralized pub-sub system for agent communication
 */
class MessagePool extends EventEmitter {
  private messages: Map<string, StructuredMessage>;
  private subscriptions: Map<string, Set<string>>; // agentName -> messageTypes[]

  constructor() {
    super();
    this.messages = new Map();
    this.subscriptions = new Map();
  }

  /**
   * Publish a message to the pool
   */
  async publish(message: StructuredMessage): Promise<void> {
    // Store in memory
    this.messages.set(message.id, message);

    // Persist to database
    await this.persistMessage(message);

    // Notify subscribers
    this.notifySubscribers(message);

    // Emit event for real-time UI updates
    this.emit('message', message);
  }

  /**
   * Subscribe an agent to specific message types
   */
  subscribe(agentName: string, messageTypes: MessageType[]): void {
    if (!this.subscriptions.has(agentName)) {
      this.subscriptions.set(agentName, new Set());
    }

    const agentSubs = this.subscriptions.get(agentName)!;
    messageTypes.forEach((type) => agentSubs.add(type));
  }

  /**
   * Unsubscribe an agent
   */
  unsubscribe(agentName: string): void {
    this.subscriptions.delete(agentName);
  }

  /**
   * Get messages for an agent based on subscriptions
   */
  getMessagesFor(agentName: string): StructuredMessage[] {
    const agentSubs = this.subscriptions.get(agentName);
    if (!agentSubs) return [];

    return Array.from(this.messages.values()).filter((msg) => {
      // Message is for this agent directly
      const isDirect = msg.to.includes(agentName);

      // Message type is subscribed
      const isSubscribed = agentSubs.has(msg.type);

      // Broadcast messages
      const isBroadcast = msg.to.includes('broadcast');

      return (isDirect || isBroadcast) && isSubscribed;
    });
  }

  /**
   * Notify subscribers of new message
   */
  private notifySubscribers(message: StructuredMessage): void {
    for (const [agentName, subs] of this.subscriptions.entries()) {
      if (subs.has(message.type)) {
        this.emit(`message:${agentName}`, message);
      }
    }
  }

  /**
   * Persist message to Supabase
   */
  private async persistMessage(message: StructuredMessage): Promise<void> {
    try {
      await supabase.from('vibe_messages').insert({
        id: message.id,
        type: message.type,
        from_agent: message.from,
        to_agents: message.to,
        timestamp: message.timestamp.toISOString(),
        content: message.content,
        metadata: message.metadata,
      });
    } catch (error) {
      console.error('Failed to persist message:', error);
    }
  }

  /**
   * Clear old messages (garbage collection)
   */
  async cleanup(olderThan: Date): Promise<void> {
    for (const [id, msg] of this.messages.entries()) {
      if (msg.timestamp < olderThan) {
        this.messages.delete(id);
      }
    }

    // Also clean database
    await supabase
      .from('vibe_messages')
      .delete()
      .lt('timestamp', olderThan.toISOString());
  }
}

// Singleton instance
export const messagePool = new MessagePool();

/**
 * Agent Collaboration Manager
 * Handles agent-to-agent communication via structured messages
 */
export class AgentCollaborationManager {
  constructor(private employeeName: string) {
    // Subscribe to relevant message types
    messagePool.subscribe(employeeName, [
      'task_assignment',
      'question',
      'resource_request',
      'handoff',
    ]);

    // Listen for messages
    messagePool.on(`message:${employeeName}`, this.handleMessage.bind(this));
  }

  /**
   * Send a structured message
   */
  async send(type: MessageType, to: string[], content: MessageContent): Promise<void> {
    const message: StructuredMessage = {
      id: crypto.randomUUID(),
      type,
      from: this.employeeName,
      to,
      timestamp: new Date(),
      content,
      metadata: {
        priority: 5,
        retryCount: 0,
      },
    };

    await messagePool.publish(message);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: StructuredMessage): void {
    switch (message.type) {
      case 'task_assignment':
        this.handleTaskAssignment(message);
        break;
      case 'question':
        this.handleQuestion(message);
        break;
      case 'resource_request':
        this.handleResourceRequest(message);
        break;
      case 'handoff':
        this.handleHandoff(message);
        break;
    }
  }

  /**
   * Handle task assignment
   */
  private async handleTaskAssignment(message: StructuredMessage): Promise<void> {
    const task = message.content.task!;

    // Update status
    await this.send('status_update', ['supervisor'], {
      status: {
        state: 'executing',
        progress: 0,
        currentStep: `Starting task: ${task.description}`,
      },
    });

    // Execute task (delegated to employee executor)
    // ...

    // Report result
    await this.send('task_result', ['supervisor'], {
      result: {
        taskId: task.id,
        output: {}, // Actual result
        artifacts: [],
        status: 'success',
      },
    });
  }

  /**
   * Handle question from another agent
   */
  private async handleQuestion(message: StructuredMessage): Promise<void> {
    // For now, questions escalate to user
    // In future, agents could answer each other
    console.log('Question from', message.from, ':', message.content.question);
  }

  /**
   * Handle resource request
   */
  private async handleResourceRequest(message: StructuredMessage): Promise<void> {
    // Handle requests for files, data, etc.
  }

  /**
   * Handle handoff from another agent
   */
  private async handleHandoff(message: StructuredMessage): Promise<void> {
    // Previous agent passing work to this agent
    console.log('Received handoff from', message.from);
  }

  /**
   * Cleanup on agent completion
   */
  destroy(): void {
    messagePool.unsubscribe(this.employeeName);
    messagePool.removeAllListeners(`message:${this.employeeName}`);
  }
}
```

### Standard Operating Procedures (SOPs)

Each employee type has **encoded SOPs** in their system prompt:

**Example: Software Engineer SOP**

```markdown
You are a Software Engineer AI employee. Follow these SOPs:

## Input Format
You will receive task assignments in this structure:
{
  "task": {
    "id": "<task_id>",
    "description": "<what to build>",
    "requirements": ["<req1>", "<req2>"],
    "design": "<link to architecture design>"
  }
}

## Your Workflow
1. Review design document from Architect
2. Break down into implementation steps
3. Write code following requirements
4. Self-test code
5. Document code inline
6. Report results

## Output Format
Provide results in this structure:
{
  "result": {
    "taskId": "<task_id>",
    "output": {
      "files": [
        {
          "path": "<file_path>",
          "content": "<code>"
        }
      ],
      "tests": "<test results>",
      "documentation": "<README>"
    },
    "artifacts": [<artifacts>],
    "status": "success"
  }
}

## Handoff Protocol
When finished, publish task_result message to supervisor.
Do NOT wait for acknowledgment - move to next task.
```

### Assembly Line Workflow

**Example: "Build a Website" Task**

```
User: "Build a simple portfolio website"
    ↓
Supervisor receives request
    ↓
    ┌──────────────────────────────────────────────┐
    │ Step 1: Product Manager Creates PRD          │
    │ Output: requirements.json                    │
    │ Publish to: [Architect]                      │
    └──────────────────────────────────────────────┘
    ↓
    ┌──────────────────────────────────────────────┐
    │ Step 2: Architect Designs System             │
    │ Output: architecture.json, components.json   │
    │ Publish to: [Engineer]                       │
    └──────────────────────────────────────────────┘
    ↓
    ┌──────────────────────────────────────────────┐
    │ Step 3: Engineer Implements                  │
    │ Output: index.html, styles.css, script.js    │
    │ Publish to: [QA Engineer]                    │
    └──────────────────────────────────────────────┘
    ↓
    ┌──────────────────────────────────────────────┐
    │ Step 4: QA Tests                             │
    │ Output: test_report.json                     │
    │ Publish to: [Supervisor]                     │
    └──────────────────────────────────────────────┘
    ↓
Supervisor compiles final result
    ↓
Present to user
```

**Parallel Execution** (when tasks are independent):

```
                    Supervisor
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
    Engineer A      Engineer B      Engineer C
    (Frontend)      (Backend)       (Database)
        ↓               ↓               ↓
    component.tsx   api.ts          schema.sql
        └───────────────┼───────────────┘
                        ↓
                    Supervisor
                  (Merge Results)
```

---

## Parallel Execution Engine

### Execution Coordinator

**Implementation: `vibe-execution-coordinator.ts`**

```typescript
import { AIEmployee } from '@core/types/ai-employee';
import { messagePool, StructuredMessage } from './vibe-collaboration-protocol';
import { employeeExecutor } from '@core/ai/employees/employee-executor';

export interface ExecutionTask {
  id: string;
  description: string;
  assignedTo: AIEmployee;
  dependencies: string[]; // Task IDs this depends on
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: Error;
}

export interface ExecutionPlan {
  id: string;
  mainGoal: string;
  tasks: ExecutionTask[];
  parallelGroups: ExecutionTask[][];
}

/**
 * Parallel Execution Coordinator
 * Executes tasks in parallel when possible, respecting dependencies
 */
export class VibeExecutionCoordinator {
  private activeTasks: Map<string, ExecutionTask> = new Map();
  private completedTasks: Map<string, ExecutionTask> = new Map();

  /**
   * Execute a plan with maximum parallelism
   */
  async executePlan(plan: ExecutionPlan): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    // Group tasks by dependency level
    const dependencyGraph = this.buildDependencyGraph(plan.tasks);
    const executionLevels = this.topologicalSort(dependencyGraph);

    // Execute level by level
    for (const level of executionLevels) {
      // All tasks in a level can run in parallel
      const promises = level.map((task) => this.executeTask(task));

      // Wait for all tasks in this level to complete
      const levelResults = await Promise.allSettled(promises);

      // Collect results
      levelResults.forEach((result, idx) => {
        const task = level[idx];
        if (result.status === 'fulfilled') {
          results.set(task.id, result.value);
          this.completedTasks.set(task.id, {
            ...task,
            status: 'completed',
            result: result.value,
          });
        } else {
          this.completedTasks.set(task.id, {
            ...task,
            status: 'failed',
            error: result.reason,
          });
        }
      });

      // If any task failed in this level, stop execution
      const hasFailures = levelResults.some((r) => r.status === 'rejected');
      if (hasFailures) {
        throw new Error('Execution failed at level ' + executionLevels.indexOf(level));
      }
    }

    return results;
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: ExecutionTask): Promise<any> {
    this.activeTasks.set(task.id, { ...task, status: 'running' });

    try {
      // Publish task assignment via message pool
      await messagePool.publish({
        id: crypto.randomUUID(),
        type: 'task_assignment',
        from: 'supervisor',
        to: [task.assignedTo.name],
        timestamp: new Date(),
        content: {
          task: {
            id: task.id,
            description: task.description,
            requirements: [],
          },
        },
        metadata: {
          priority: 5,
          retryCount: 0,
        },
      });

      // Execute via employee executor
      const result = await employeeExecutor.executeTask(
        task.assignedTo,
        task.description,
        {} // context
      );

      this.activeTasks.delete(task.id);
      return result;
    } catch (error) {
      this.activeTasks.delete(task.id);
      throw error;
    }
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(
    tasks: ExecutionTask[]
  ): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    tasks.forEach((task) => {
      if (!graph.has(task.id)) {
        graph.set(task.id, new Set());
      }

      task.dependencies.forEach((depId) => {
        graph.get(task.id)!.add(depId);
      });
    });

    return graph;
  }

  /**
   * Topological sort to determine execution order
   * Returns tasks grouped by level (all tasks in a level can run in parallel)
   */
  private topologicalSort(
    graph: Map<string, Set<string>>
  ): ExecutionTask[][] {
    const levels: ExecutionTask[][] = [];
    const completed = new Set<string>();
    const taskMap = new Map<string, ExecutionTask>();

    // Build task map
    this.activeTasks.forEach((task) => taskMap.set(task.id, task));
    this.completedTasks.forEach((task) => taskMap.set(task.id, task));

    while (completed.size < graph.size) {
      const currentLevel: ExecutionTask[] = [];

      // Find tasks with all dependencies completed
      for (const [taskId, deps] of graph.entries()) {
        if (completed.has(taskId)) continue;

        const allDepsCompleted = Array.from(deps).every((depId) =>
          completed.has(depId)
        );

        if (allDepsCompleted || deps.size === 0) {
          const task = taskMap.get(taskId);
          if (task) {
            currentLevel.push(task);
            completed.add(taskId);
          }
        }
      }

      if (currentLevel.length === 0) {
        throw new Error('Circular dependency detected');
      }

      levels.push(currentLevel);
    }

    return levels;
  }

  /**
   * Get execution status
   */
  getStatus(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.activeTasks.size + this.completedTasks.size,
      running: this.activeTasks.size,
      completed: Array.from(this.completedTasks.values()).filter(
        (t) => t.status === 'completed'
      ).length,
      failed: Array.from(this.completedTasks.values()).filter(
        (t) => t.status === 'failed'
      ).length,
    };
  }
}

export const vibeExecutionCoordinator = new VibeExecutionCoordinator();
```

### Real-Time Progress Tracking

**Zustand Store: `vibe-execution-store.ts`**

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ExecutionState {
  activeTasks: Map<string, ExecutionTask>;
  completedTasks: Map<string, ExecutionTask>;
  overallProgress: number;

  // Actions
  startTask: (task: ExecutionTask) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  completeTask: (taskId: string, result: any) => void;
  failTask: (taskId: string, error: Error) => void;
  reset: () => void;
}

export const useExecutionStore = create<ExecutionState>()(
  devtools(
    immer((set) => ({
      activeTasks: new Map(),
      completedTasks: new Map(),
      overallProgress: 0,

      startTask: (task) =>
        set((state) => {
          state.activeTasks.set(task.id, { ...task, status: 'running' });
        }),

      updateTaskProgress: (taskId, progress) =>
        set((state) => {
          const task = state.activeTasks.get(taskId);
          if (task) {
            task.progress = progress;
          }
        }),

      completeTask: (taskId, result) =>
        set((state) => {
          const task = state.activeTasks.get(taskId);
          if (task) {
            state.activeTasks.delete(taskId);
            state.completedTasks.set(taskId, {
              ...task,
              status: 'completed',
              result,
            });

            // Update overall progress
            const total =
              state.activeTasks.size + state.completedTasks.size;
            state.overallProgress =
              (state.completedTasks.size / total) * 100;
          }
        }),

      failTask: (taskId, error) =>
        set((state) => {
          const task = state.activeTasks.get(taskId);
          if (task) {
            state.activeTasks.delete(taskId);
            state.completedTasks.set(taskId, {
              ...task,
              status: 'failed',
              error,
            });
          }
        }),

      reset: () =>
        set((state) => {
          state.activeTasks.clear();
          state.completedTasks.clear();
          state.overallProgress = 0;
        }),
    })),
    { name: 'VibeExecutionStore' }
  )
);
```

---

## Tool Integration System

### Available Tools

1. **File System Tools**
   - Read files
   - Write files
   - Create directories
   - List directory contents

2. **Code Tools**
   - Execute code (sandboxed)
   - Lint code
   - Format code
   - Generate code

3. **Web Tools**
   - Web search
   - Fetch URLs
   - Scrape content

4. **Data Tools**
   - Query databases
   - Process CSV/JSON
   - Generate charts

5. **Communication Tools**
   - Send emails
   - Create documents
   - Generate PDFs

### Tool Execution Flow

```
Agent needs tool
    ↓
Request tool via structured message
    ↓
Tool Orchestrator receives request
    ↓
Validate permissions & safety
    ↓
Execute tool in sandbox
    ↓
Return result to agent
    ↓
Agent continues work
```

### Implementation: `vibe-tool-orchestrator.ts`

```typescript
import { toolExecutionEngine } from '@core/ai/tools/tool-execution-engine';

export interface ToolRequest {
  id: string;
  agentName: string;
  toolName: string;
  parameters: Record<string, any>;
  timestamp: Date;
}

export interface ToolResult {
  requestId: string;
  success: boolean;
  output?: any;
  error?: string;
  executionTime: number;
}

/**
 * Tool Orchestrator
 * Manages tool execution for AI employees
 */
export class VibeToolOrchestrator {
  /**
   * Execute a tool on behalf of an agent
   */
  async executeTool(request: ToolRequest): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      // Validate tool exists
      if (!this.isValidTool(request.toolName)) {
        throw new Error(`Unknown tool: ${request.toolName}`);
      }

      // Check permissions
      if (!this.hasPermission(request.agentName, request.toolName)) {
        throw new Error(`Agent ${request.agentName} not authorized for tool ${request.toolName}`);
      }

      // Execute tool
      const output = await toolExecutionEngine.execute(
        request.toolName,
        request.parameters
      );

      return {
        requestId: request.id,
        success: true,
        output,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        requestId: request.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check if tool is valid
   */
  private isValidTool(toolName: string): boolean {
    const validTools = [
      'read_file',
      'write_file',
      'list_directory',
      'execute_code',
      'web_search',
      'fetch_url',
      'send_email',
      'generate_pdf',
      'query_database',
    ];

    return validTools.includes(toolName);
  }

  /**
   * Check if agent has permission to use tool
   */
  private hasPermission(agentName: string, toolName: string): boolean {
    // For now, all hired employees have access to all tools
    // In future, could restrict based on employee role
    return true;
  }
}

export const vibeToolOrchestrator = new VibeToolOrchestrator();
```

---

## File System Integration

### File Upload & Management

**Upload Methods**:
1. Drag & drop on chat canvas
2. Click upload button
3. `@` autocomplete selector

**File Storage**:
- Uploaded files stored in Supabase Storage
- References stored in `vibe_files` table
- Max file size: 100MB
- Supported types: All (no restrictions)

### Implementation: `vibe-file-manager.ts`

```typescript
import { supabase } from '@shared/lib/supabase-client';

export interface VibeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string; // user ID
  sessionId: string; // vibe chat session
}

/**
 * File Manager for Vibe Interface
 */
export class VibeFileManager {
  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    file: File,
    userId: string,
    sessionId: string
  ): Promise<VibeFile> {
    // Upload to Supabase Storage
    const filePath = `vibe/${userId}/${sessionId}/${file.name}`;

    const { data, error } = await supabase.storage
      .from('vibe-files')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('vibe-files')
      .getPublicUrl(filePath);

    // Save reference to database
    const vibeFile: VibeFile = {
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: urlData.publicUrl,
      uploadedAt: new Date(),
      uploadedBy: userId,
      sessionId,
    };

    await supabase.from('vibe_files').insert({
      id: vibeFile.id,
      name: vibeFile.name,
      type: vibeFile.type,
      size: vibeFile.size,
      url: vibeFile.url,
      uploaded_at: vibeFile.uploadedAt.toISOString(),
      uploaded_by: vibeFile.uploadedBy,
      session_id: vibeFile.sessionId,
    });

    return vibeFile;
  }

  /**
   * Get files for a session
   */
  async getFiles(sessionId: string): Promise<VibeFile[]> {
    const { data, error } = await supabase
      .from('vibe_files')
      .select('*')
      .eq('session_id', sessionId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      size: row.size,
      url: row.url,
      uploadedAt: new Date(row.uploaded_at),
      uploadedBy: row.uploaded_by,
      sessionId: row.session_id,
    }));
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    // Get file record
    const { data: file } = await supabase
      .from('vibe_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (!file) throw new Error('File not found');

    // Delete from storage
    const filePath = `vibe/${file.uploaded_by}/${file.session_id}/${file.name}`;
    await supabase.storage.from('vibe-files').remove([filePath]);

    // Delete record
    await supabase.from('vibe_files').delete().eq('id', fileId);
  }

  /**
   * Download file content for agent use
   */
  async getFileContent(fileId: string): Promise<string | Buffer> {
    const { data: file } = await supabase
      .from('vibe_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (!file) throw new Error('File not found');

    const filePath = `vibe/${file.uploaded_by}/${file.session_id}/${file.name}`;

    const { data, error } = await supabase.storage
      .from('vibe-files')
      .download(filePath);

    if (error) throw error;

    // For text files, convert to string
    if (file.type.startsWith('text/')) {
      return await data.text();
    }

    // For binary files, return as buffer
    return Buffer.from(await data.arrayBuffer());
  }
}

export const vibeFileManager = new VibeFileManager();
```

### File Reference in Messages

When user uploads or references a file using `@`:

```typescript
// User message
{
  role: 'user',
  content: 'Review this code @app.tsx and suggest improvements',
  files: [
    {
      id: 'file-123',
      name: 'app.tsx',
      type: 'text/typescript',
      url: 'https://...',
    }
  ]
}

// Agent receives file content automatically
{
  role: 'assistant',
  name: 'Code Reviewer',
  content: 'I reviewed app.tsx. Here are my suggestions...',
  context: {
    files: [
      {
        name: 'app.tsx',
        content: '<file content>'
      }
    ]
  }
}
```

---

## Database Schema

### New Tables for Vibe Interface

```sql
-- Vibe chat sessions
CREATE TABLE vibe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Vibe messages
CREATE TABLE vibe_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  employee_id UUID REFERENCES ai_employees(id),
  employee_name TEXT,
  employee_role TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_streaming BOOLEAN DEFAULT FALSE
);

-- Vibe files
CREATE TABLE vibe_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Vibe agent messages (structured communication)
CREATE TABLE vibe_agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('task_assignment', 'task_result', 'status_update', 'question', 'resource_request', 'handoff')),
  from_agent TEXT NOT NULL,
  to_agents TEXT[] NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Vibe execution tasks
CREATE TABLE vibe_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES vibe_sessions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  assigned_to UUID NOT NULL REFERENCES ai_employees(id),
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_vibe_sessions_user ON vibe_sessions(user_id);
CREATE INDEX idx_vibe_messages_session ON vibe_messages(session_id);
CREATE INDEX idx_vibe_messages_timestamp ON vibe_messages(timestamp);
CREATE INDEX idx_vibe_files_session ON vibe_files(session_id);
CREATE INDEX idx_vibe_agent_messages_session ON vibe_agent_messages(session_id);
CREATE INDEX idx_vibe_tasks_session ON vibe_tasks(session_id);

-- RLS Policies
ALTER TABLE vibe_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_tasks ENABLE ROW LEVEL SECURITY;

-- Users can only access their own vibe sessions
CREATE POLICY vibe_sessions_policy ON vibe_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access messages in their sessions
CREATE POLICY vibe_messages_policy ON vibe_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_messages.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

-- Same for files
CREATE POLICY vibe_files_policy ON vibe_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_files.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

-- Same for agent messages
CREATE POLICY vibe_agent_messages_policy ON vibe_agent_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_agent_messages.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );

-- Same for tasks
CREATE POLICY vibe_tasks_policy ON vibe_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM vibe_sessions
      WHERE vibe_sessions.id = vibe_tasks.session_id
      AND vibe_sessions.user_id = auth.uid()
    )
  );
```

---

## API Endpoints

### Netlify Functions for Vibe

**New Functions**:

1. **`vibe-chat.ts`** - Main chat endpoint
2. **`vibe-upload.ts`** - File upload handler
3. **`vibe-execute.ts`** - Task execution coordinator

### 1. `vibe-chat.ts` - Main Chat Endpoint

```typescript
// netlify/functions/vibe-chat.ts
import { Handler } from '@netlify/functions';
import { vibeAgentRouter } from '@core/ai/orchestration/vibe-agent-router';
import { employeeExecutor } from '@core/ai/employees/employee-executor';
import { vibeFileManager } from '@core/storage/vibe-file-manager';
import { supabase } from '@shared/lib/supabase-client';

interface VibeChatRequest {
  sessionId: string;
  message: string;
  files?: string[]; // File IDs
  manualAgentId?: string; // If user used # to select agent
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const request: VibeChatRequest = JSON.parse(event.body!);

    // Authenticate user
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) {
      return { statusCode: 401, body: 'Unauthorized' };
    }

    // Get hired employees
    const { data: hiredEmployees } = await supabase
      .from('purchased_employees')
      .select('*, ai_employees(*)')
      .eq('user_id', user.id);

    if (!hiredEmployees || hiredEmployees.length === 0) {
      // Fallback to stateless API
      return {
        statusCode: 200,
        body: JSON.stringify({
          mode: 'stateless',
          response: await handleStatelessChat(request.message),
        }),
      };
    }

    const employees = hiredEmployees.map((pe) => pe.ai_employees);

    // Get conversation history
    const { data: messages } = await supabase
      .from('vibe_messages')
      .select('*')
      .eq('session_id', request.sessionId)
      .order('timestamp', { ascending: true });

    // Get file content if files referenced
    const fileContents = [];
    if (request.files && request.files.length > 0) {
      for (const fileId of request.files) {
        const content = await vibeFileManager.getFileContent(fileId);
        const { data: file } = await supabase
          .from('vibe_files')
          .select('*')
          .eq('id', fileId)
          .single();

        fileContents.push({
          name: file.name,
          content: content.toString(),
        });
      }
    }

    let selectedAgent;
    let executionMode;

    if (request.manualAgentId) {
      // User manually selected agent with #
      selectedAgent = employees.find((e) => e.id === request.manualAgentId);
      executionMode = 'single';
    } else {
      // Auto-route
      const routing = await vibeAgentRouter.routeMessage(
        request.message,
        messages || [],
        employees
      );

      selectedAgent = routing.primaryAgent;
      executionMode = routing.mode;
    }

    if (!selectedAgent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No matching agent found' }),
      };
    }

    // Save user message
    await supabase.from('vibe_messages').insert({
      session_id: request.sessionId,
      role: 'user',
      content: request.message,
      timestamp: new Date().toISOString(),
    });

    // Execute task
    const result = await employeeExecutor.executeTask(
      selectedAgent,
      request.message,
      {
        conversationHistory: messages || [],
        files: fileContents,
      }
    );

    // Save agent response
    await supabase.from('vibe_messages').insert({
      session_id: request.sessionId,
      role: 'assistant',
      content: result.output,
      employee_id: selectedAgent.id,
      employee_name: selectedAgent.name,
      employee_role: selectedAgent.description,
      timestamp: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        mode: executionMode,
        agent: {
          id: selectedAgent.id,
          name: selectedAgent.name,
          role: selectedAgent.description,
        },
        response: result.output,
      }),
    };
  } catch (error) {
    console.error('Vibe chat error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

async function handleStatelessChat(message: string): Promise<string> {
  // Fallback to basic LLM response
  const { unifiedLLMService } = await import(
    '@core/ai/llm/unified-language-model'
  );

  const response = await unifiedLLMService.sendMessage([
    { role: 'user', content: message },
  ]);

  return response.content;
}
```

---

## State Management

### Zustand Stores

**1. `vibe-chat-store.ts` - Main Chat State**

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface VibeMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  employeeName?: string;
  employeeRole?: string;
  employeeAvatar?: string;
  timestamp: Date;
  isStreaming?: boolean;
  files?: VibeFile[];
}

interface VibeChatState {
  sessionId: string | null;
  messages: VibeMessage[];
  currentAgent: AIEmployee | null;
  isThinking: boolean;
  hiredEmployees: AIEmployee[];

  // Actions
  setSessionId: (id: string) => void;
  addMessage: (message: VibeMessage) => void;
  updateMessage: (id: string, updates: Partial<VibeMessage>) => void;
  setCurrentAgent: (agent: AIEmployee | null) => void;
  setThinking: (thinking: boolean) => void;
  setHiredEmployees: (employees: AIEmployee[]) => void;
  clearMessages: () => void;
}

export const useVibeChatStore = create<VibeChatState>()(
  devtools(
    persist(
      immer((set) => ({
        sessionId: null,
        messages: [],
        currentAgent: null,
        isThinking: false,
        hiredEmployees: [],

        setSessionId: (id) =>
          set((state) => {
            state.sessionId = id;
          }),

        addMessage: (message) =>
          set((state) => {
            state.messages.push(message);
          }),

        updateMessage: (id, updates) =>
          set((state) => {
            const message = state.messages.find((m) => m.id === id);
            if (message) {
              Object.assign(message, updates);
            }
          }),

        setCurrentAgent: (agent) =>
          set((state) => {
            state.currentAgent = agent;
          }),

        setThinking: (thinking) =>
          set((state) => {
            state.isThinking = thinking;
          }),

        setHiredEmployees: (employees) =>
          set((state) => {
            state.hiredEmployees = employees;
          }),

        clearMessages: () =>
          set((state) => {
            state.messages = [];
          }),
      })),
      {
        name: 'vibe-chat-storage',
        partialize: (state) => ({
          sessionId: state.sessionId,
          messages: state.messages.slice(-50), // Only persist last 50 messages
        }),
      }
    ),
    { name: 'VibeChatStore' }
  )
);
```

**2. `vibe-file-store.ts` - File Management State**

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface VibeFileState {
  files: VibeFile[];
  uploadProgress: Map<string, number>;

  // Actions
  addFile: (file: VibeFile) => void;
  removeFile: (fileId: string) => void;
  setUploadProgress: (fileId: string, progress: number) => void;
  clearFiles: () => void;
}

export const useVibeFileStore = create<VibeFileState>()(
  devtools(
    immer((set) => ({
      files: [],
      uploadProgress: new Map(),

      addFile: (file) =>
        set((state) => {
          state.files.push(file);
        }),

      removeFile: (fileId) =>
        set((state) => {
          state.files = state.files.filter((f) => f.id !== fileId);
          state.uploadProgress.delete(fileId);
        }),

      setUploadProgress: (fileId, progress) =>
        set((state) => {
          state.uploadProgress.set(fileId, progress);
        }),

      clearFiles: () =>
        set((state) => {
          state.files = [];
          state.uploadProgress.clear();
        }),
    })),
    { name: 'VibeFileStore' }
  )
);
```

---

## Real-time Updates

### Supabase Realtime Subscriptions

**Subscribe to message updates**:

```typescript
// In use-vibe-chat.ts hook
useEffect(() => {
  if (!sessionId) return;

  const channel = supabase
    .channel(`vibe:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'vibe_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const newMessage: VibeMessage = {
          id: payload.new.id,
          role: payload.new.role,
          content: payload.new.content,
          employeeName: payload.new.employee_name,
          employeeRole: payload.new.employee_role,
          timestamp: new Date(payload.new.timestamp),
          isStreaming: payload.new.is_streaming,
        };

        addMessage(newMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [sessionId]);
```

---

## Streaming Response Implementation

### Server-Sent Events (SSE)

**Netlify Function: `vibe-stream.ts`**

```typescript
import { Handler } from '@netlify/functions';
import { unifiedLLMService } from '@core/ai/llm/unified-language-model';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { message, agentId } = JSON.parse(event.body!);

  // Set up SSE headers
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
    body: await streamResponse(message, agentId),
  };
};

async function* streamResponse(message: string, agentId: string) {
  // Get agent
  const agent = await getAgent(agentId);

  // Stream response
  const stream = await unifiedLLMService.streamMessage([
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: message },
  ]);

  for await (const chunk of stream) {
    yield `data: ${JSON.stringify({ content: chunk })}\n\n`;
  }

  yield 'data: [DONE]\n\n';
}
```

**Client-side handling**:

```typescript
// In use-streaming-response.ts
export function useStreamingResponse() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const startStreaming = async (message: string, agentId: string) => {
    setIsStreaming(true);
    setContent('');

    const response = await fetch('/.netlify/functions/vibe-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, agentId }),
    });

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            setIsStreaming(false);
            return;
          }

          const { content: newContent } = JSON.parse(data);
          setContent((prev) => prev + newContent);
        }
      }
    }
  };

  return { content, isStreaming, startStreaming };
}
```

---

## Manual Employee Selection

### `#` Syntax for Agent Selection

**Autocomplete Component: `AgentSelector.tsx`**

```typescript
interface AgentSelectorProps {
  employees: AIEmployee[];
  query: string;
  onSelect: (employee: AIEmployee) => void;
}

export function AgentSelector({
  employees,
  query,
  onSelect,
}: AgentSelectorProps) {
  const filtered = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(query.toLowerCase()) ||
      emp.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-1">
      {filtered.map((employee) => (
        <button
          key={employee.id}
          onClick={() => onSelect(employee)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback>{employee.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <p className="text-sm font-medium">{employee.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {employee.description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
```

**Usage in Input**:

```typescript
// When user types #
if (input.startsWith('#')) {
  setShowAgentSelector(true);
  setAgentQuery(input.slice(1)); // Remove #
}

// When agent selected
function handleAgentSelect(employee: AIEmployee) {
  setManuallySelectedAgent(employee);
  setInput(''); // Clear input
  setShowAgentSelector(false);

  // Show confirmation
  addSystemMessage(`Switched to ${employee.name}`);
}
```

---

## Fallback Mechanism

### Stateless API Fallback

**When No Matching Employee**:

1. Check if user has hired employees
2. If no employees → Use stateless LLM response
3. Show message: "No specialist available for this topic. Here's a general response:"

**Implementation**:

```typescript
// In vibe-agent-router.ts
async routeMessage(userMessage: string, hiredEmployees: AIEmployee[]) {
  if (hiredEmployees.length === 0) {
    // No employees - fallback
    return {
      mode: 'stateless',
      response: await this.statelessResponse(userMessage),
    };
  }

  // Try to find matching employee
  const match = await this.semanticMatch(userMessage, hiredEmployees);

  if (match.confidence < 0.6) {
    // Low confidence - fallback
    return {
      mode: 'stateless',
      response: await this.statelessResponse(userMessage),
      suggestedEmployees: this.suggestEmployeesToHire(userMessage),
    };
  }

  // Proceed with employee
  return {
    mode: 'single',
    primaryAgent: match.employee,
    confidence: match.confidence,
  };
}

private async statelessResponse(message: string): Promise<string> {
  const response = await unifiedLLMService.sendMessage([
    {
      role: 'system',
      content: 'You are a helpful AI assistant. Provide clear, concise answers.',
    },
    { role: 'user', content: message },
  ]);

  return response.content;
}

private suggestEmployeesToHire(message: string): AIEmployee[] {
  // Suggest relevant employees from marketplace
  // Based on message content
  return [];
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goals**: Basic infrastructure and routing

**Tasks**:
1. Create `/vibe` route and basic layout
2. Implement `VibeSidebar` and `VibeChatCanvas`
3. Build `vibe-agent-router` with keyword matching
4. Set up database schema and migrations
5. Create Zustand stores (`vibe-chat-store`, `vibe-file-store`)

**Deliverables**:
- `/vibe` page accessible with minimal UI
- Agent routing working (keyword-based)
- Messages persisted to database

---

### Phase 2: Chat Interface (Week 3-4)

**Goals**: Complete chat UI with autocomplete

**Tasks**:
1. Build `VibeMessage` component with employee avatars
2. Implement `VibeMessageInput` with `#` and `@` autocomplete
3. Add `VibeThinkingIndicator` and status badges
4. Create `AgentSelector` and `FileSelector` dropdowns
5. Implement drag & drop file upload

**Deliverables**:
- Fully functional chat interface
- Manual agent selection with `#`
- File upload and reference with `@`

---

### Phase 3: Agent Intelligence (Week 5-6)

**Goals**: Semantic routing and complexity analysis

**Tasks**:
1. Implement semantic matching in `vibe-agent-router`
2. Build `vibe-complexity-analyzer`
3. Add context switching detection
4. Integrate with existing workforce orchestrator
5. Test with various user queries

**Deliverables**:
- Smart agent selection (90%+ accuracy)
- Automatic context switching
- Complex task detection

---

### Phase 4: Collaboration Protocol (Week 7-8)

**Goals**: Multi-agent communication

**Tasks**:
1. Build `vibe-collaboration-protocol` with message pool
2. Implement structured message types
3. Create `AgentCollaborationManager`
4. Add supervisor orchestration
5. Build task dependency graph

**Deliverables**:
- Agents can communicate via structured messages
- Supervisor can coordinate multiple agents
- Tasks execute based on dependencies

---

### Phase 5: Parallel Execution (Week 9-10)

**Goals**: Concurrent task execution

**Tasks**:
1. Build `vibe-execution-coordinator`
2. Implement topological sort for task ordering
3. Add real-time progress tracking
4. Create execution visualization UI
5. Test with complex multi-step tasks

**Deliverables**:
- Tasks execute in parallel when possible
- Real-time progress updates
- Visual task timeline

---

### Phase 6: Tool Integration (Week 11-12)

**Goals**: Enable agents to use tools

**Tasks**:
1. Build `vibe-tool-orchestrator`
2. Integrate file system tools
3. Add code execution tools
4. Implement web search tools
5. Create document generation tools

**Deliverables**:
- Agents can read/write files
- Agents can execute code
- Agents can search web
- Agents can create documents

---

### Phase 7: Streaming & Polish (Week 13-14)

**Goals**: Streaming responses and UI polish

**Tasks**:
1. Implement SSE streaming
2. Add streaming response visualization
3. Polish animations and transitions
4. Optimize performance
5. Add error handling and retry logic

**Deliverables**:
- Smooth streaming responses
- Polished UI with animations
- Production-ready error handling

---

### Phase 8: Testing & Launch (Week 15-16)

**Goals**: Comprehensive testing and deployment

**Tasks**:
1. Write unit tests for all services
2. Write integration tests for workflows
3. Conduct user acceptance testing
4. Performance optimization
5. Deploy to production

**Deliverables**:
- 80%+ test coverage
- Performance benchmarks met
- Production deployment
- User documentation

---

## Success Metrics

### Technical Metrics

1. **Agent Selection Accuracy**: >90% correct first selection
2. **Response Time**: <3s for simple tasks, <30s for complex
3. **Streaming Latency**: <100ms first token
4. **Uptime**: >99.9%
5. **Error Rate**: <1%

### User Experience Metrics

1. **User Satisfaction**: >4.5/5 rating
2. **Task Completion Rate**: >85%
3. **Average Tasks per Session**: >3
4. **Return User Rate**: >60%
5. **Time to First Value**: <1 minute

### Business Metrics

1. **Employee Hiring Rate**: >30% of vibe users
2. **Token Usage**: >50% increase
3. **Subscription Conversion**: >20%
4. **Active Users**: >1000 in first month
5. **Feature Adoption**: >50% of workforce users

---

## Conclusion

This plan provides a comprehensive blueprint for building the `/vibe` interface, inspired by MGX.dev's multi-agent approach and MetaGPT's structured communication protocol. The system will transform AGI Agent Automation into a powerful collaborative AI workspace where specialized employees work together seamlessly.

**Key Innovations**:
1. **Hybrid Routing**: Combines speed of keyword matching with intelligence of semantic analysis
2. **Structured Communication**: MetaGPT-inspired message pool prevents agent hallucination
3. **Parallel Execution**: Maximizes efficiency through dependency-aware task coordination
4. **Flexible Architecture**: File-based employees + structured protocols = best of both worlds
5. **User Control**: Auto-selection with manual override gives users full control

**Next Steps**:
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Iterate based on user feedback

This implementation will position AGI Agent Automation as a leader in multi-agent collaborative AI systems, offering capabilities that rival and exceed existing solutions like MGX.dev and MetaGPT.
