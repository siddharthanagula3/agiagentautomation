# MASTER IMPLEMENTATION PLAN
## Chat Interface Overhaul - November 2025

**Project:** AGI Agent Automation Platform - Modern Chat Interface
**Document Version:** 1.0
**Created:** November 13, 2025
**Status:** READY FOR IMPLEMENTATION

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Research Findings](#research-findings)
3. [Architecture Overview](#architecture-overview)
4. [Features Specification](#features-specification)
5. [Component Breakdown](#component-breakdown)
6. [State Management Strategy](#state-management-strategy)
7. [AI Employee Integration](#ai-employee-integration)
8. [Collaboration Protocols](#collaboration-protocols)
9. [LLM Model Integration](#llm-model-integration)
10. [UI/UX Specifications](#uiux-specifications)
11. [File Structure](#file-structure)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Testing Strategy](#testing-strategy)
14. [Documentation Updates](#documentation-updates)
15. [Deployment Checklist](#deployment-checklist)

---

## 🎯 EXECUTIVE SUMMARY

### Project Goal
Transform the AGI Agent Automation chat interface into a world-class, production-ready AI chat experience that rivals Claude.ai, ChatGPT, Google Gemini, and Grok while maintaining our unique multi-agent orchestration capabilities.

### Key Deliverables
1. **Full-Screen Modern Chat Interface** - Three-panel layout with collapsible sidebars
2. **Advanced LLM Model Support** - GPT-5.1 Thinking, Claude Sonnet 4.5, Gemini 2.5 Pro, Kimi K2 Thinking
3. **Thinking Mode Visualization** - Real-time reasoning process display
4. **Multi-Agent Collaboration UI** - Enhanced Mission Control integration
5. **Tool Execution Display** - Collapsible tool call visualization
6. **Artifact System** - Code preview with live rendering
7. **Complete Documentation** - Updated README, CLAUDE.md, and developer docs

### Success Criteria
- ✅ TypeScript compilation with 0 errors
- ✅ Production build completes successfully
- ✅ All features from competitive analysis implemented
- ✅ Maintains backward compatibility with existing backend
- ✅ WCAG AA accessibility compliance
- ✅ 60fps performance with 1000+ messages
- ✅ Comprehensive test coverage (80%+)

---

## 🔍 RESEARCH FINDINGS

### Competitive Analysis Summary

Based on comprehensive research of Claude.ai, ChatGPT, Google Gemini, and Grok AI (November 2025), the following features are now **table stakes** for modern AI chat interfaces:

#### Must-Have Features
1. **Extended Reasoning Modes** - "Thinking" modes with visible reasoning steps
2. **Multi-Modal Support** - Text, images, voice, file uploads
3. **Real-Time Token Tracking** - With cost estimation
4. **Tool Execution Visualization** - Collapsible displays showing parameters and results
5. **Workspace Organization** - Projects/Collections for complex workflows
6. **Advanced Search** - Full-text search across all conversations
7. **Export Capabilities** - Multiple formats (Markdown, PDF, JSON, HTML)
8. **Temporary Chat Mode** - Ephemeral conversations
9. **Model Selection** - Easy switching between providers
10. **Full-Screen Layout** - Immersive, distraction-free interface

#### Competitive Positioning

| Feature | Claude.ai | ChatGPT | Gemini | Grok | **Our Platform** |
|---------|-----------|---------|--------|------|------------------|
| Multi-Agent Orchestration | ❌ | ❌ | ❌ | ❌ | ✅ **UNIQUE** |
| AI Employee Marketplace | ❌ | ❌ | ❌ | ❌ | ✅ **UNIQUE** |
| Thinking Mode | ✅ | ✅ | ✅ Deep Think | ✅ Big Brain | ✅ **PLANNED** |
| Artifacts/Canvas | ✅ | ✅ Canvas | ⚠️ Code Editor | ❌ | ✅ **PLANNED** |
| Voice Mode | ⚠️ Mobile | ✅ Advanced | ✅ Gemini Live | ⚠️ Limited | ⚠️ **FUTURE** |
| Screen Sharing | ❌ | ✅ | ✅ | ❌ | ❌ **FUTURE** |
| Tool Integration | ✅ | ✅ | ✅ | ✅ | ✅ **EXISTING** |
| Context Window | 200K-1M | 400K | 1M | 256K | **Depends on model** |

### Latest LLM Models (November 2025)

| Model | Provider | Best For | Cost ($/M tokens) | Context Window |
|-------|----------|----------|-------------------|----------------|
| **GPT-5.1 Thinking** | OpenAI | General-purpose, adaptive | $3-5 / $15-20 | 400K |
| **o3** | OpenAI | High-stakes reasoning, visual | $10 / $40 | 128K |
| **o4-mini** | OpenAI | Cost-effective reasoning | $2 / $8 | 128K |
| **Claude Sonnet 4.5** | Anthropic | **Best coding** (77.2% SWE-bench) | $3 / $15 | 200K |
| **Claude Opus 4.1** | Anthropic | Advanced reasoning | $4.50 / $22.50 | 200K |
| **Gemini 2.5 Pro** | Google | **Best reasoning** (86.4% GPQA) | $2.50 / $10 | **1M** |
| **Gemini 3.0 Pro** | Google | Next-gen (preview) | TBD | **1M** |
| **Kimi K2 Thinking** | Moonshot | **Open-source**, 300 tool cycles | **$0.55 / $2.25** | 256K |
| **Grok 4** | xAI | Real-time X integration | $10-30 | 128K |

**Recommendation for Default Models:**
1. **Coding Tasks**: Claude Sonnet 4.5 (best SWE-bench score)
2. **Scientific Reasoning**: Gemini 2.5 Pro (best GPQA score)
3. **General Purpose**: GPT-5.1 Thinking (adaptive, warm tone)
4. **Cost-Sensitive**: Kimi K2 Thinking (open-source, $0.55/$2.25)

### React Component Library Analysis

**Selected Library:** **assistant-ui** (https://github.com/assistant-ui/assistant-ui)

**Rationale:**
- ✅ **100% tech stack compatibility** (React 18, Vite, TypeScript, Tailwind, shadcn/ui, Zustand)
- ✅ **Production-ready** (streaming, auto-scroll, accessibility, keyboard shortcuts)
- ✅ **15+ LLM providers** (OpenAI, Anthropic, Google, Perplexity, etc.)
- ✅ **Composable architecture** (Radix-style primitives)
- ✅ **Active development** (Y Combinator backed, 400k+ monthly downloads)
- ✅ **Generative UI** (custom tool rendering for Mission Control)
- ✅ **Chat history** (integrates with Supabase)

**Installation:**
```bash
npm install \
  @assistant-ui/react \
  @assistant-ui/react-markdown \
  @assistant-ui/react-ai-sdk \
  @radix-ui/react-avatar \
  @radix-ui/react-dialog \
  @radix-ui/react-slot \
  @radix-ui/react-tooltip \
  motion \
  remark-gfm
```

---

## 🏗️ ARCHITECTURE OVERVIEW

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         ModernChatInterface (Full-Screen)                     │  │
│  │  ┌────────┬──────────────────────────────┬────────────────┐  │  │
│  │  │ Left   │  Main Chat Area              │  Right Panel   │  │  │
│  │  │ Side   │  - Message List              │  - Artifacts   │  │  │
│  │  │ bar    │  - Thinking Mode Display     │  - Tools       │  │  │
│  │  │        │  - Tool Execution Display    │  - Context     │  │  │
│  │  │ Conv   │  - Chat Input                │  - Settings    │  │  │
│  │  │ List   │                              │                │  │  │
│  │  └────────┴──────────────────────────────┴────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       STATE MANAGEMENT LAYER                        │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐    │
│  │ Chat         │ Conversation │ Message      │ Chat         │    │
│  │ Interface    │ History      │ Processing   │ Config       │    │
│  │ Store        │ Store        │ Store        │ Store        │    │
│  │ (Zustand)    │ (Zustand)    │ (Zustand)    │ (Zustand)    │    │
│  └──────────────┴──────────────┴──────────────┴──────────────┘    │
│  ┌──────────────┬──────────────┬──────────────────────────────┐   │
│  │ Mission      │ Artifact     │ Employee                     │   │
│  │ Control      │ Store        │ Management                   │   │
│  │ Store        │ (Zustand)    │ Store (Zustand)              │   │
│  │ (Existing)   │              │ (Existing)                   │   │
│  └──────────────┴──────────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              Unified LLM Service (Existing)                   │ │
│  │  - Multi-provider support (OpenAI, Anthropic, Google, etc.)  │ │
│  │  - Streaming handler                                          │ │
│  │  - Token tracking                                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │          Workforce Orchestrator (Existing)                    │ │
│  │  - Plan-Delegate-Execute pattern                             │ │
│  │  - AI Employee management                                     │ │
│  │  - Tool execution                                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │          Chat Services (New + Enhanced)                       │ │
│  │  - Message streaming                                          │ │
│  │  - Thinking mode processor                                    │ │
│  │  - Artifact generation                                        │ │
│  │  - Export service                                             │ │
│  │  - Search service                                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                  │
│  ┌──────────────────┬──────────────────┬────────────────────────┐  │
│  │ Supabase         │ Netlify          │ Browser Storage        │  │
│  │ - chat_sessions  │ Functions        │ - Session storage      │  │
│  │ - chat_messages  │ - chat-proxy     │   (temp chat)          │  │
│  │ - RLS policies   │ - Rate limiting  │ - localStorage         │  │
│  └──────────────────┴──────────────────┴────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

#### 1. Hybrid Approach: assistant-ui + Custom Components

**Rationale:** Use assistant-ui for standard chat UX while maintaining custom components for unique features (Mission Control, AI employees).

**Implementation:**
- **Standard Chat (`/chat`)**: Use assistant-ui for 90% of functionality
- **Mission Control (`/mission-control`)**: Custom UI with assistant-ui Tool UI system
- **Employee Chat**: Hybrid - assistant-ui base + custom employee selector

#### 2. Backward Compatibility

**Preserve Existing Services:**
- ✅ `unified-llm-service.ts` - Keep as-is, add adapter layer
- ✅ `workforce-orchestrator.ts` - Integrate via custom Tool UI
- ✅ `mission-control-store.ts` - Keep for orchestration state
- ✅ Supabase schema - No breaking changes

**Migration Path:**
1. Add new components alongside existing
2. Feature flag for gradual rollout
3. A/B test with users
4. Full cutover after validation

#### 3. State Management Architecture

**6 Zustand Stores (Separation of Concerns):**

```typescript
// NEW STORES
1. chat-interface-store.ts      // UI state (sidebars, panels, focus)
2. conversation-history-store.ts // Conversation list, search, folders
3. message-processing-store.ts   // Streaming, thinking mode, tools
4. chat-configuration-store.ts   // Model, mode, temperature, etc.

// EXISTING STORES (Keep)
5. mission-control-store.ts     // Orchestration state
6. employee-management-store.ts  // Hired employees
```

**Store Interaction Pattern:**
```
chat-configuration-store (independent)
    ↓ provides config to
message-processing-store
    ↓ processes messages for
chat-interface-store (orchestrates UI)
    ↓ persists to
conversation-history-store
    ↓ syncs with
Supabase (chat_sessions, chat_messages)
```

---

## ✨ FEATURES SPECIFICATION

### Feature Priority Matrix

| Feature | Priority | Complexity | Impact | Est. Time | Phase |
|---------|----------|------------|--------|-----------|-------|
| **Full-Screen Layout** | 🔴 Critical | Low | High | 1 week | 1 |
| **Model Selection** | 🔴 Critical | Low | High | 3 days | 1 |
| **Thinking Mode Display** | 🔴 Critical | Medium | High | 1 week | 2 |
| **Tool Execution Display** | 🔴 Critical | Medium | High | 1 week | 2 |
| **Token Usage Tracking** | 🔴 Critical | Low | High | 3 days | 2 |
| **Conversation Management** | 🟡 High | Medium | High | 1 week | 3 |
| **Search Functionality** | 🟡 High | Medium | Medium | 5 days | 3 |
| **Export System** | 🟡 High | Medium | Medium | 5 days | 3 |
| **Artifact System** | 🟡 High | High | High | 1.5 weeks | 4 |
| **Code Preview** | 🟡 High | High | High | 1 week | 4 |
| **Temporary Chat** | 🟢 Medium | Low | Low | 2 days | 3 |
| **Voice Input** | 🔵 Low | High | Medium | **Future** | - |
| **Screen Sharing** | 🔵 Low | High | Medium | **Future** | - |

### Detailed Feature Specifications

#### 1. Full-Screen Chat Layout

**Description:** Immersive three-panel layout maximizing screen real estate

**Layout Breakdown:**
```
┌──────────────────────────────────────────────────────────────────┐
│  Top Bar (64px fixed)                                            │
│  [Model ▼] [Mode Toggle] [Tokens: 1.2K] [⚙] [Dashboard →]      │
├──────┬───────────────────────────────────────────────┬───────────┤
│      │                                               │           │
│ Left │            Main Chat Area                     │   Right   │
│ Side │                                               │   Panel   │
│ bar  │  ┌─────────────────────────────────────────┐ │ (Optional)│
│      │  │                                         │ │           │
│ 280px│  │   Messages (virtualized)                │ │   320px   │
│      │  │                                         │ │           │
│ Conv │  │   • User message                        │ │ • Artifact│
│ List │  │   • AI response                         │ │ • Tools   │
│      │  │     - Thinking process (collapsible)    │ │ • Context │
│      │  │     - Tool execution (collapsible)      │ │ • Settings│
│      │  │     - Message content                   │ │           │
│      │  │                                         │ │           │
│ Toggle│  └─────────────────────────────────────────┘ │  Toggle   │
│ < >  │                                               │   < >     │
│      │  ┌─────────────────────────────────────────┐ │           │
│      │  │ Chat Input (auto-resize, max 200px)     │ │           │
│      │  │ [📎 Attach] [🎤 Voice] [Send] [Stop]    │ │           │
│      │  └─────────────────────────────────────────┘ │           │
└──────┴───────────────────────────────────────────────┴───────────┘
```

**Responsive Behavior:**
- **Desktop (>1024px)**: Full three-panel layout
- **Tablet (768-1024px)**: Left sidebar + main area (right panel as overlay)
- **Mobile (<768px)**: Main area only (sidebars as slide-in overlays)

**Keyboard Shortcuts:**
- `Ctrl/Cmd + B` - Toggle left sidebar
- `Ctrl/Cmd + .` - Toggle right panel
- `Ctrl/Cmd + N` - New conversation
- `Ctrl/Cmd + K` - Search conversations
- `Ctrl/Cmd + L` - Focus input
- `Escape` - Stop generation

**Implementation:**
```typescript
// src/features/chat-interface/pages/ModernChatInterface.tsx
interface LayoutState {
  leftSidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: 'artifacts' | 'tools' | 'context' | 'settings';
}
```

#### 2. Model Selection System

**Description:** Dropdown to select from multiple LLM providers and models

**Available Models:**

```typescript
const AVAILABLE_MODELS: ModelOption[] = [
  // OpenAI
  { id: 'gpt-5.1-thinking', provider: 'openai', name: 'GPT-5.1 Thinking',
    contextWindow: 400000, cost: { input: 5, output: 20 },
    capabilities: ['text', 'vision', 'thinking', 'tool-use'] },
  { id: 'gpt-4o', provider: 'openai', name: 'GPT-4o',
    contextWindow: 128000, cost: { input: 2.50, output: 10 },
    capabilities: ['text', 'vision', 'tool-use'] },
  { id: 'o3', provider: 'openai', name: 'o3',
    contextWindow: 128000, cost: { input: 10, output: 40 },
    capabilities: ['text', 'vision', 'thinking', 'tool-use'] },
  { id: 'o4-mini', provider: 'openai', name: 'o4-mini',
    contextWindow: 128000, cost: { input: 2, output: 8 },
    capabilities: ['text', 'thinking', 'tool-use'] },

  // Anthropic
  { id: 'claude-sonnet-4.5', provider: 'anthropic', name: 'Claude Sonnet 4.5',
    contextWindow: 200000, cost: { input: 3, output: 15 },
    capabilities: ['text', 'vision', 'thinking', 'tool-use'],
    badge: 'Best Coding' },
  { id: 'claude-opus-4.1', provider: 'anthropic', name: 'Claude Opus 4.1',
    contextWindow: 200000, cost: { input: 4.50, output: 22.50 },
    capabilities: ['text', 'vision', 'thinking', 'tool-use'] },

  // Google
  { id: 'gemini-2.5-pro', provider: 'google', name: 'Gemini 2.5 Pro',
    contextWindow: 1000000, cost: { input: 2.50, output: 10 },
    capabilities: ['text', 'vision', 'thinking', 'tool-use'],
    badge: 'Best Reasoning' },
  { id: 'gemini-3.0-pro', provider: 'google', name: 'Gemini 3.0 Pro (Preview)',
    contextWindow: 1000000, cost: { input: 3, output: 12 },
    capabilities: ['text', 'vision', 'thinking', 'tool-use'],
    badge: 'Next-Gen' },

  // Moonshot AI
  { id: 'kimi-k2-thinking', provider: 'moonshot', name: 'Kimi K2 Thinking',
    contextWindow: 256000, cost: { input: 0.55, output: 2.25 },
    capabilities: ['text', 'thinking', 'tool-use'],
    badge: 'Open-Source' },

  // Perplexity
  { id: 'perplexity-sonar-pro', provider: 'perplexity', name: 'Perplexity Sonar Pro',
    contextWindow: 128000, cost: { input: 3, output: 15 },
    capabilities: ['text', 'web-search', 'tool-use'],
    badge: 'Real-Time Web' },
];
```

**UI Design:**
```tsx
<Select value={selectedModel} onValueChange={setSelectedModel}>
  <SelectTrigger className="w-[280px]">
    <SelectValue>
      {selectedModel.name}
      {selectedModel.badge && <Badge>{selectedModel.badge}</Badge>}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>OpenAI</SelectLabel>
      <SelectItem value="gpt-5.1-thinking">
        GPT-5.1 Thinking
        <Badge variant="secondary">Adaptive</Badge>
        <span className="text-xs text-muted-foreground">
          $5/$20 per M tokens
        </span>
      </SelectItem>
      {/* ... more options */}
    </SelectGroup>

    <SelectGroup>
      <SelectLabel>Anthropic</SelectLabel>
      <SelectItem value="claude-sonnet-4.5">
        Claude Sonnet 4.5
        <Badge variant="secondary">Best Coding</Badge>
        <span className="text-xs text-muted-foreground">
          $3/$15 per M tokens
        </span>
      </SelectItem>
      {/* ... more options */}
    </SelectGroup>

    {/* Google, Moonshot, Perplexity groups */}
  </SelectContent>
</Select>
```

**Model Selection Logic:**
```typescript
// Automatic model recommendation based on task type
function suggestModel(userQuery: string): ModelOption {
  const query = userQuery.toLowerCase();

  // Coding keywords
  if (query.match(/\b(code|function|debug|implement|refactor|api)\b/)) {
    return MODELS['claude-sonnet-4.5']; // Best coding
  }

  // Scientific/math keywords
  if (query.match(/\b(math|calculation|science|research|proof)\b/)) {
    return MODELS['gemini-2.5-pro']; // Best reasoning
  }

  // Cost-sensitive
  if (userTier === 'free' || preferLowCost) {
    return MODELS['kimi-k2-thinking']; // Lowest cost
  }

  // Default
  return MODELS['gpt-5.1-thinking']; // General-purpose
}
```

**Provider Availability Indicator:**
```tsx
<div className="flex items-center gap-1">
  <div className={cn(
    "w-2 h-2 rounded-full",
    provider.status === 'operational' && "bg-green-500",
    provider.status === 'degraded' && "bg-yellow-500",
    provider.status === 'outage' && "bg-red-500"
  )} />
  <span className="text-xs">
    {provider.status === 'operational' ? 'Available' :
     provider.status === 'degraded' ? 'Slow' : 'Unavailable'}
  </span>
</div>
```

#### 3. Mode Selection (Fast / Balanced / Thinking)

**Description:** Toggle between speed-optimized and reasoning-optimized modes

**Mode Definitions:**

| Mode | Description | Use Cases | Cost Multiplier | Response Time |
|------|-------------|-----------|-----------------|---------------|
| **Fast** | Minimal processing, quick responses | Simple questions, casual chat | 1x | <2s |
| **Balanced** | Default, balances quality and speed | General use | 1x | 2-5s |
| **Thinking** | Extended reasoning, shows thought process | Complex problems, coding, research | 2-3x | 5-30s |

**UI Component:**
```tsx
<ToggleGroup type="single" value={mode} onValueChange={setMode}>
  <ToggleGroupItem value="fast" aria-label="Fast mode">
    <Zap className="h-4 w-4 mr-2" />
    Fast
  </ToggleGroupItem>
  <ToggleGroupItem value="balanced" aria-label="Balanced mode">
    <Scale className="h-4 w-4 mr-2" />
    Balanced
  </ToggleGroupItem>
  <ToggleGroupItem value="thinking" aria-label="Thinking mode">
    <Brain className="h-4 w-4 mr-2" />
    Thinking
  </ToggleGroupItem>
</ToggleGroup>
```

**Auto-Suggestion Logic:**
```typescript
function suggestMode(query: string, conversationContext: Message[]): ChatMode {
  const complexity = analyzeComplexity(query);
  const hasCode = /```|function|class|import/.test(query);
  const needsReasoning = /why|how|explain|analyze|compare/.test(query.toLowerCase());

  if (complexity.score > 0.7 || hasCode || needsReasoning) {
    return 'thinking';
  }

  if (complexity.score < 0.3 && conversationContext.length < 3) {
    return 'fast';
  }

  return 'balanced';
}
```

**Thinking Mode Visualization:**

When thinking mode is active, display a collapsible section showing reasoning steps:

```tsx
{mode === 'thinking' && message.thinkingProcess && (
  <Collapsible>
    <CollapsibleTrigger className="flex items-center gap-2">
      <Brain className="h-4 w-4 animate-pulse" />
      <span>View reasoning ({message.thinkingProcess.length} steps)</span>
      <ChevronDown className="h-4 w-4" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Card className="mt-2 bg-muted/50">
        <CardContent className="pt-4">
          {message.thinkingProcess.map((step, idx) => (
            <div key={step.id} className="flex gap-3 mb-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  step.completedAt ? "bg-green-500" : "bg-yellow-500"
                )}>
                  {step.completedAt ?
                    <Check className="h-4 w-4 text-white" /> :
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  }
                </div>
                {idx < message.thinkingProcess.length - 1 && (
                  <div className="w-px h-full bg-border mt-2" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">Step {step.step}: {step.description}</div>
                {step.reasoning && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {step.reasoning}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {step.completedAt ?
                    `Completed in ${formatDuration(step.startedAt, step.completedAt)}` :
                    'In progress...'
                  }
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </CollapsibleContent>
  </Collapsible>
)}
```

#### 4. Real-Time Token Usage Display

**Description:** Live token counting with cost estimation and usage warnings

**Display Locations:**
1. **Top Bar**: Compact counter showing total session tokens
2. **Bottom Bar**: Detailed breakdown with cost
3. **Per-Message**: Individual message token counts
4. **Warning Alerts**: When approaching limits (85%, 95%)

**UI Components:**

**Top Bar (Compact):**
```tsx
<div className="flex items-center gap-2 text-sm">
  <Coins className="h-4 w-4" />
  <span className="font-mono">{formatNumber(totalTokens)}</span>
  <span className="text-muted-foreground">tokens</span>
  <Progress value={usagePercentage} className="w-20 h-2" />
</div>
```

**Bottom Bar (Detailed):**
```tsx
<div className="flex items-center gap-4 text-xs text-muted-foreground">
  <span>
    In: {formatNumber(inputTokens)} • Out: {formatNumber(outputTokens)}
  </span>
  <Separator orientation="vertical" className="h-4" />
  <span className="font-medium text-foreground">
    ${estimatedCost.toFixed(4)}
  </span>
  {subscription?.tier === 'free' && (
    <>
      <Separator orientation="vertical" className="h-4" />
      <span>Credits: {remainingCredits} remaining</span>
    </>
  )}
</div>
```

**Per-Message Token Display:**
```tsx
<div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
  <Sparkles className="h-3 w-3" />
  <span>{message.metadata.tokenUsage.inputTokens} in</span>
  <span>•</span>
  <span>{message.metadata.tokenUsage.outputTokens} out</span>
  <span>•</span>
  <span>${message.metadata.tokenUsage.estimatedCost.toFixed(4)}</span>
  {message.metadata.mode === 'thinking' && (
    <Badge variant="secondary" className="ml-2">
      Extended Thinking (+{thinkingTokens} tokens)
    </Badge>
  )}
</div>
```

**Usage Warning System:**
```typescript
// Check usage and show warnings
function checkTokenUsage(totalTokens: number, limit: number) {
  const percentage = (totalTokens / limit) * 100;

  if (percentage >= 95) {
    return {
      level: 'critical',
      title: 'Token Limit Almost Reached',
      message: `You've used ${percentage.toFixed(0)}% of your monthly tokens. Only ${limit - totalTokens} tokens remaining.`,
      action: 'Upgrade Plan'
    };
  }

  if (percentage >= 85) {
    return {
      level: 'warning',
      title: 'High Token Usage',
      message: `You've used ${percentage.toFixed(0)}% of your monthly tokens.`,
      action: 'View Usage'
    };
  }

  return null;
}
```

**Warning Alert UI:**
```tsx
{warning && (
  <Alert variant={warning.level === 'critical' ? 'destructive' : 'default'}>
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>{warning.title}</AlertTitle>
    <AlertDescription className="flex items-center justify-between">
      <span>{warning.message}</span>
      <Button size="sm" variant="outline">
        {warning.action}
      </Button>
    </AlertDescription>
  </Alert>
)}
```

**Token Calculation (Web Worker):**
```typescript
// token-counter.worker.ts
import { encode } from 'gpt-tokenizer';

self.addEventListener('message', (e) => {
  const { text, model } = e.data;

  // Estimate tokens based on model
  const tokens = encode(text).length;

  // Adjust for model-specific tokenization
  const modelMultiplier = {
    'claude': 1.1,    // Claude uses slightly different tokenization
    'gemini': 0.95,   // Gemini is more efficient
    'openai': 1.0     // GPT tokenization is standard
  }[model] || 1.0;

  const adjustedTokens = Math.ceil(tokens * modelMultiplier);

  self.postMessage({ tokens: adjustedTokens });
});
```

#### 5. Tool Execution Display

**Description:** Visual display of tool calls showing parameters, execution status, and results

**Tool Execution States:**
1. **Pending** - Tool queued, not started
2. **Running** - Tool executing with progress indicator
3. **Completed** - Tool finished, results available
4. **Failed** - Tool error with error message

**UI Component (Collapsible):**
```tsx
<Collapsible open={toolCallExpanded} onOpenChange={setToolCallExpanded}>
  <div className="border rounded-lg my-2 overflow-hidden">
    {/* Header - Always Visible */}
    <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Tool Icon */}
        <div className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center",
          toolCall.status === 'completed' && "bg-green-500/10 text-green-500",
          toolCall.status === 'running' && "bg-blue-500/10 text-blue-500",
          toolCall.status === 'failed' && "bg-red-500/10 text-red-500",
          toolCall.status === 'pending' && "bg-yellow-500/10 text-yellow-500"
        )}>
          {TOOL_ICONS[toolCall.name] || <Wrench className="h-4 w-4" />}
        </div>

        {/* Tool Name */}
        <div className="flex flex-col items-start">
          <div className="font-medium">{formatToolName(toolCall.name)}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            {toolCall.status === 'completed' && (
              <span>✓ Completed in {formatDuration(toolCall.startedAt, toolCall.completedAt)}</span>
            )}
            {toolCall.status === 'running' && (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Running...
              </span>
            )}
            {toolCall.status === 'failed' && (
              <span>✗ Failed</span>
            )}
            {toolCall.status === 'pending' && (
              <span>⏱ Pending</span>
            )}
          </div>
        </div>
      </div>

      {/* Expand Icon */}
      <ChevronDown className={cn(
        "h-4 w-4 transition-transform",
        toolCallExpanded && "transform rotate-180"
      )} />
    </CollapsibleTrigger>

    {/* Expanded Content */}
    <CollapsibleContent>
      <div className="px-4 py-3 bg-muted/30 space-y-3">
        {/* Parameters */}
        <div>
          <div className="text-sm font-medium mb-2">Parameters</div>
          <div className="bg-background rounded-md p-3">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(toolCall.parameters, null, 2)}
            </pre>
          </div>
        </div>

        {/* Result (if completed) */}
        {toolCall.status === 'completed' && toolCall.result && (
          <div>
            <div className="text-sm font-medium mb-2">Result</div>
            <div className="bg-background rounded-md p-3">
              {renderToolResult(toolCall.result)}
            </div>
          </div>
        )}

        {/* Error (if failed) */}
        {toolCall.status === 'failed' && toolCall.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error: {toolCall.error.code}</AlertTitle>
            <AlertDescription>{toolCall.error.message}</AlertDescription>
          </Alert>
        )}

        {/* Execution Timeline */}
        <div>
          <div className="text-sm font-medium mb-2">Timeline</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>Started: {formatTimestamp(toolCall.startedAt)}</div>
            {toolCall.completedAt && (
              <div>Completed: {formatTimestamp(toolCall.completedAt)}</div>
            )}
            <div>Duration: {formatDuration(toolCall.startedAt, toolCall.completedAt || new Date())}</div>
          </div>
        </div>
      </div>
    </CollapsibleContent>
  </div>
</Collapsible>
```

**Tool-Specific Rendering:**
```typescript
function renderToolResult(result: ToolResult): React.ReactNode {
  // Web Search Results
  if (result.type === 'web_search') {
    return (
      <div className="space-y-2">
        {result.output.results.map((item, idx) => (
          <div key={idx} className="border-l-2 border-primary pl-3">
            <a href={item.url} target="_blank" className="text-sm font-medium text-primary hover:underline">
              {item.title}
            </a>
            <p className="text-xs text-muted-foreground mt-1">{item.snippet}</p>
          </div>
        ))}
      </div>
    );
  }

  // Code Execution Results
  if (result.type === 'code_execution') {
    return (
      <div>
        {result.output.stdout && (
          <div className="mb-2">
            <div className="text-xs font-medium mb-1">Output:</div>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {result.output.stdout}
            </pre>
          </div>
        )}
        {result.output.stderr && (
          <div>
            <div className="text-xs font-medium mb-1 text-destructive">Errors:</div>
            <pre className="text-xs bg-destructive/10 p-2 rounded overflow-x-auto">
              {result.output.stderr}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Default: JSON display
  return (
    <pre className="text-xs overflow-x-auto">
      {JSON.stringify(result.output, null, 2)}
    </pre>
  );
}
```

**Tool Icons Mapping:**
```typescript
const TOOL_ICONS: Record<string, React.ReactNode> = {
  'web_search': <Globe className="h-4 w-4" />,
  'code_execution': <Terminal className="h-4 w-4" />,
  'file_read': <FileText className="h-4 w-4" />,
  'file_write': <FilePlus className="h-4 w-4" />,
  'database_query': <Database className="h-4 w-4" />,
  'api_call': <Webhook className="h-4 w-4" />,
  'image_generation': <Image className="h-4 w-4" />,
  'start_mission': <Rocket className="h-4 w-4" />,
  'hire_employee': <UserPlus className="h-4 w-4" />,
};
```

#### 6. Artifact System & Code Preview

**Description:** Side panel for viewing and interacting with generated code, documents, and visualizations

**Artifact Types:**
1. **Code** - Syntax-highlighted code with copy/download
2. **HTML** - Live preview in iframe
3. **React Component** - Live preview with hot reload
4. **Markdown** - Rendered document
5. **JSON/YAML** - Formatted data structures
6. **Images** - Generated or uploaded images
7. **Charts** - Data visualizations (via Chart.js/Recharts)

**Right Panel Tab Structure:**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="artifacts">
      <FileCode className="h-4 w-4 mr-2" />
      Artifacts
      {artifacts.length > 0 && (
        <Badge className="ml-2">{artifacts.length}</Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="tools">
      <Wrench className="h-4 w-4 mr-2" />
      Tools
    </TabsTrigger>
    <TabsTrigger value="context">
      <Brain className="h-4 w-4 mr-2" />
      Context
    </TabsTrigger>
    <TabsTrigger value="settings">
      <Settings className="h-4 w-4 mr-2" />
      Settings
    </TabsTrigger>
  </TabsList>

  <TabsContent value="artifacts">
    <ArtifactViewer artifacts={artifacts} />
  </TabsContent>

  <TabsContent value="tools">
    <ActiveToolsPanel />
  </TabsContent>

  <TabsContent value="context">
    <ContextManager />
  </TabsContent>

  <TabsContent value="settings">
    <QuickSettings />
  </TabsContent>
</Tabs>
```

**Code Artifact Viewer:**
```tsx
<Card className="h-full flex flex-col">
  <CardHeader className="border-b">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>{artifact.title}</CardTitle>
        <CardDescription>
          {artifact.language} • {artifact.metadata.version} versions
        </CardDescription>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
        <Button size="sm" variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button size="sm" variant="outline" onClick={toggleFullScreen}>
          {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  </CardHeader>

  <CardContent className="flex-1 p-0 overflow-hidden">
    {artifact.type === 'code' && (
      <Tabs defaultValue="code">
        <TabsList className="rounded-none border-b">
          <TabsTrigger value="code">Code</TabsTrigger>
          {isPreviewable(artifact) && (
            <TabsTrigger value="preview">Preview</TabsTrigger>
          )}
          {artifact.metadata.versionHistory && (
            <TabsTrigger value="history">History</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="code" className="h-full m-0">
          <SyntaxHighlighter
            language={artifact.language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, height: '100%' }}
            showLineNumbers
          >
            {artifact.content}
          </SyntaxHighlighter>
        </TabsContent>

        <TabsContent value="preview" className="h-full m-0">
          {artifact.language === 'html' && (
            <iframe
              srcDoc={artifact.content}
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          )}
          {artifact.language === 'jsx' && (
            <LivePreview code={artifact.content} />
          )}
        </TabsContent>

        <TabsContent value="history" className="p-4">
          <VersionHistory
            versions={artifact.metadata.versionHistory}
            onRestore={handleRestoreVersion}
          />
        </TabsContent>
      </Tabs>
    )}
  </CardContent>
</Card>
```

**Live React Component Preview:**
```typescript
// Uses react-live for live component preview
import { LiveProvider, LiveError, LivePreview } from 'react-live';

function LivePreview({ code }: { code: string }) {
  return (
    <LiveProvider code={code} scope={{ React, ...shadcnComponents }}>
      <div className="h-full flex flex-col">
        <div className="flex-1 p-4 overflow-auto">
          <LivePreview />
        </div>
        <div className="border-t p-2 bg-destructive/10">
          <LiveError />
        </div>
      </div>
    </LiveProvider>
  );
}
```

**Version History:**
```tsx
<ScrollArea className="h-full">
  <div className="space-y-2">
    {versions.map((version, idx) => (
      <Card key={version.version}>
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={idx === 0 ? 'default' : 'secondary'}>
                v{version.version}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatTimestamp(version.timestamp)}
              </span>
            </div>
            {idx !== 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRestore(version)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-sm">{version.changes}</p>
        </CardContent>
      </Card>
    ))}
  </div>
</ScrollArea>
```

#### 7. Conversation Management

**Description:** Full conversation history with search, folders, and filters

**Left Sidebar Structure:**
```tsx
<div className="flex flex-col h-full">
  {/* Header */}
  <div className="p-4 border-b">
    <Button className="w-full" onClick={createNewConversation}>
      <Plus className="h-4 w-4 mr-2" />
      New Chat
    </Button>
  </div>

  {/* Search */}
  <div className="p-4 border-b">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search conversations..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  </div>

  {/* Filters */}
  <div className="px-4 py-2 border-b flex gap-2">
    <Button
      size="sm"
      variant={filter === 'all' ? 'default' : 'ghost'}
      onClick={() => setFilter('all')}
    >
      All
    </Button>
    <Button
      size="sm"
      variant={filter === 'pinned' ? 'default' : 'ghost'}
      onClick={() => setFilter('pinned')}
    >
      <Pin className="h-3 w-3 mr-1" />
      Pinned
    </Button>
    <Button
      size="sm"
      variant={filter === 'archived' ? 'default' : 'ghost'}
      onClick={() => setFilter('archived')}
    >
      <Archive className="h-3 w-3 mr-1" />
      Archived
    </Button>
  </div>

  {/* Conversation List */}
  <ScrollArea className="flex-1">
    <div className="p-2 space-y-1">
      {/* Today */}
      <div className="text-xs font-semibold text-muted-foreground px-3 py-2">
        Today
      </div>
      {todayConversations.map(conv => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}

      {/* Yesterday */}
      <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-4">
        Yesterday
      </div>
      {yesterdayConversations.map(conv => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}

      {/* Previous 7 Days */}
      <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-4">
        Previous 7 Days
      </div>
      {weekConversations.map(conv => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}

      {/* Older */}
      <div className="text-xs font-semibold text-muted-foreground px-3 py-2 mt-4">
        Older
      </div>
      {olderConversations.map(conv => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}
    </div>
  </ScrollArea>
</div>
```

**Conversation Item Component:**
```tsx
<ContextMenu>
  <ContextMenuTrigger>
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
        conversation.id === currentConversationId && "bg-muted"
      )}
      onClick={() => loadConversation(conversation.id)}
    >
      {/* Pin Indicator */}
      {conversation.metadata.isPinned && (
        <Pin className="h-3 w-3 text-primary" />
      )}

      {/* Conversation Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {conversation.title}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {conversation.summary || 'No summary'}
        </div>
      </div>

      {/* Message Count */}
      <div className="text-xs text-muted-foreground">
        {conversation.metadata.messageCount}
      </div>
    </div>
  </ContextMenuTrigger>

  <ContextMenuContent>
    <ContextMenuItem onClick={() => pinConversation(conversation.id)}>
      <Pin className="h-4 w-4 mr-2" />
      {conversation.metadata.isPinned ? 'Unpin' : 'Pin'}
    </ContextMenuItem>
    <ContextMenuItem onClick={() => renameConversation(conversation.id)}>
      <Edit className="h-4 w-4 mr-2" />
      Rename
    </ContextMenuItem>
    <ContextMenuItem onClick={() => exportConversation(conversation.id)}>
      <Download className="h-4 w-4 mr-2" />
      Export
    </ContextMenuItem>
    <ContextMenuItem onClick={() => archiveConversation(conversation.id)}>
      <Archive className="h-4 w-4 mr-2" />
      Archive
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem
      className="text-destructive"
      onClick={() => deleteConversation(conversation.id)}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

**Search Implementation:**
```typescript
// Full-text search across all conversations
function searchConversations(query: string, conversations: Conversation[]) {
  if (!query || query.length < 2) return conversations;

  const lowerQuery = query.toLowerCase();

  return conversations.filter(conv => {
    // Search in title
    if (conv.title.toLowerCase().includes(lowerQuery)) return true;

    // Search in summary
    if (conv.summary?.toLowerCase().includes(lowerQuery)) return true;

    // Search in messages
    const hasMatchingMessage = conv.messages.some(msg =>
      msg.content.text?.toLowerCase().includes(lowerQuery)
    );

    return hasMatchingMessage;
  }).map(conv => ({
    ...conv,
    // Highlight matching text
    highlightedMatches: extractMatches(conv, lowerQuery)
  }));
}
```

#### 8. Export System

**Description:** Export conversations to multiple formats with customization options

**Export Formats:**
1. **Markdown (.md)** - Plain text with formatting
2. **PDF** - Formatted document with styling
3. **JSON** - Structured data for programmatic use
4. **HTML** - Standalone webpage
5. **Plain Text (.txt)** - Simple text dump

**Export Dialog:**
```tsx
<Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Export Conversation</DialogTitle>
      <DialogDescription>
        Export "{conversation.title}" to your preferred format
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      {/* Format Selection */}
      <div>
        <Label>Export Format</Label>
        <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="markdown" id="markdown" />
            <Label htmlFor="markdown" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Markdown (.md)
              <Badge variant="secondary">Recommended</Badge>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="pdf" />
            <Label htmlFor="pdf" className="flex items-center gap-2">
              <FileType className="h-4 w-4" />
              PDF Document
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="json" id="json" />
            <Label htmlFor="json" className="flex items-center gap-2">
              <Braces className="h-4 w-4" />
              JSON (Structured Data)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="html" id="html" />
            <Label htmlFor="html" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              HTML (Standalone Webpage)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text" id="text" />
            <Label htmlFor="text" className="flex items-center gap-2">
              <File className="h-4 w-4" />
              Plain Text (.txt)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <Label>Export Options</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-thinking"
              checked={exportOptions.includeThinking}
              onCheckedChange={(checked) =>
                setExportOptions(prev => ({ ...prev, includeThinking: checked as boolean }))
              }
            />
            <Label htmlFor="include-thinking">Include thinking process</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-tools"
              checked={exportOptions.includeTools}
              onCheckedChange={(checked) =>
                setExportOptions(prev => ({ ...prev, includeTools: checked as boolean }))
              }
            />
            <Label htmlFor="include-tools">Include tool executions</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-artifacts"
              checked={exportOptions.includeArtifacts}
              onCheckedChange={(checked) =>
                setExportOptions(prev => ({ ...prev, includeArtifacts: checked as boolean }))
              }
            />
            <Label htmlFor="include-artifacts">Include artifacts</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-metadata"
              checked={exportOptions.includeMetadata}
              onCheckedChange={(checked) =>
                setExportOptions(prev => ({ ...prev, includeMetadata: checked as boolean }))
              }
            />
            <Label htmlFor="include-metadata">Include metadata (timestamps, token counts)</Label>
          </div>
        </div>
      </div>

      {/* Date Range (Optional) */}
      <div>
        <Label>Date Range (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              {exportDateRange ? (
                `${format(exportDateRange.start, 'PP')} - ${format(exportDateRange.end, 'PP')}`
              ) : (
                'All messages'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateRangePicker
              value={exportDateRange}
              onChange={setExportDateRange}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleExport}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Export Service Implementation:**
```typescript
// src/features/chat-interface/services/export-service.ts
export class ExportService {
  async exportToMarkdown(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<string> {
    let markdown = `# ${conversation.title}\n\n`;

    if (options.includeMetadata) {
      markdown += `**Created:** ${format(conversation.createdAt, 'PPpp')}\n`;
      markdown += `**Messages:** ${conversation.metadata.messageCount}\n`;
      markdown += `**Total Tokens:** ${conversation.metadata.totalTokens}\n`;
      markdown += `**Cost:** $${conversation.metadata.totalCost.toFixed(4)}\n\n`;
      markdown += `---\n\n`;
    }

    for (const message of conversation.messages) {
      markdown += `## ${message.role === 'user' ? 'You' : 'AI'}\n\n`;
      markdown += `${message.content.text}\n\n`;

      if (options.includeThinking && message.content.thinkingProcess) {
        markdown += `### Thinking Process\n\n`;
        for (const step of message.content.thinkingProcess) {
          markdown += `**Step ${step.step}:** ${step.description}\n`;
          if (step.reasoning) {
            markdown += `\n${step.reasoning}\n`;
          }
          markdown += `\n`;
        }
      }

      if (options.includeTools && message.content.toolCalls) {
        markdown += `### Tool Calls\n\n`;
        for (const tool of message.content.toolCalls) {
          markdown += `**${tool.name}** (${tool.status})\n\n`;
          markdown += `\`\`\`json\n${JSON.stringify(tool.parameters, null, 2)}\n\`\`\`\n\n`;
          if (tool.result) {
            markdown += `Result:\n\`\`\`json\n${JSON.stringify(tool.result.output, null, 2)}\n\`\`\`\n\n`;
          }
        }
      }

      markdown += `---\n\n`;
    }

    return markdown;
  }

  async exportToPDF(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<Blob> {
    // Use jsPDF or similar library
    const pdf = new jsPDF();
    // ... PDF generation logic
    return pdf.output('blob');
  }

  async exportToJSON(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<string> {
    const data = {
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
        metadata: conversation.metadata
      },
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        metadata: options.includeMetadata ? msg.metadata : undefined,
        createdAt: msg.createdAt.toISOString()
      }))
    };

    return JSON.stringify(data, null, 2);
  }

  async exportToHTML(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<string> {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${conversation.title}</title>
  <style>
    /* Tailwind CSS or custom styles */
    ${EXPORT_CSS}
  </style>
</head>
<body>
  <div class="container">
    <h1>${conversation.title}</h1>
    ${conversation.messages.map(msg => `
      <div class="message ${msg.role}">
        <div class="role">${msg.role}</div>
        <div class="content">${msg.content.text}</div>
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;
  }
}
```

---

## 🤖 AI EMPLOYEE INTEGRATION

### AI Employee Behavior Protocols

**Employee Communication Pattern:**

Each AI employee should have distinct communication characteristics based on their role:

```markdown
# Employee Communication Protocols

## 1. Code Reviewer
**Tone:** Professional, constructive, detail-oriented
**Response Pattern:**
- Start with positive observations
- List issues in order of severity
- Provide specific code examples
- Suggest improvements with rationale
- End with summary and priority actions

**Example:**
```
✅ **Strengths:**
- Clean function organization
- Good error handling in main paths

⚠️ **Issues Found:**

**CRITICAL:**
- Line 42: SQL injection vulnerability in user input
  ```typescript
  // BAD
  db.query(`SELECT * FROM users WHERE id = ${userId}`)
  // GOOD
  db.query('SELECT * FROM users WHERE id = ?', [userId])
  ```

**MEDIUM:**
- Line 67: Potential memory leak (event listener not cleaned up)
- Line 89: Missing null check before array operation

**MINOR:**
- Inconsistent naming convention (camelCase vs snake_case)

**Summary:**
Fix the SQL injection vulnerability immediately before deploying.
Other issues should be addressed in the next sprint.
```

## 2. Debugger
**Tone:** Analytical, systematic, methodical
**Response Pattern:**
- Acknowledge the problem
- Ask clarifying questions if needed
- Propose hypothesis
- Test systematically
- Explain root cause
- Provide fix with explanation

**Example:**
```
I'm analyzing the error you're encountering. Let me investigate systematically:

**Error Analysis:**
TypeError: Cannot read property 'map' of undefined

**Hypothesis:**
The `data` variable is undefined, likely due to an async race condition.

**Investigation Steps:**
1. Check where `data` is set
2. Verify async timing
3. Check error handling

**Root Cause:**
Line 23: `useEffect` runs before data is fetched, causing premature render.

**Fix:**
```typescript
// Add conditional rendering
{data && data.map(item => ...)}

// Or add loading state
if (!data) return <Spinner />;
```

**Explanation:**
The component renders immediately, but the API call takes 200ms.
Adding a null check prevents the error until data arrives.
```

## 3. Frontend Engineer
**Tone:** Creative, user-focused, practical
**Response Pattern:**
- Understand user experience goals
- Propose component structure
- Consider accessibility
- Provide implementation
- Suggest improvements

**Example:**
```
I'll create a responsive navigation bar with accessibility in mind.

**Component Structure:**
```
<Navigation>
  ├── Logo
  ├── NavLinks (desktop)
  ├── MobileMenu (mobile)
  │   ├── MenuButton
  │   └── MenuPanel
  └── UserProfile
```

**Implementation:**
```typescript
// Accessible, responsive navigation
export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav role="navigation" aria-label="Main navigation">
      {/* Implementation with ARIA labels, keyboard nav, mobile responsive */}
    </nav>
  );
}
```

**Accessibility Features:**
✅ ARIA roles and labels
✅ Keyboard navigation (Tab, Enter, Escape)
✅ Focus management
✅ Screen reader friendly

**Responsive Breakpoints:**
- Mobile: < 768px (hamburger menu)
- Tablet: 768px - 1024px (horizontal nav)
- Desktop: > 1024px (full nav with dropdowns)
```

## 4. Backend Engineer
**Tone:** Pragmatic, security-conscious, scalable
**Response Pattern:**
- Understand requirements
- Propose architecture
- Consider edge cases
- Implement with error handling
- Document API

**Example:**
```
I'll implement a secure user authentication endpoint.

**Endpoint Design:**
POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "********"
}
```

**Response (Success):**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "user"
  }
}
```

**Security Measures:**
✅ Password hashing (bcrypt, 10 rounds)
✅ Rate limiting (5 attempts per 15 minutes)
✅ JWT with 1-hour expiration
✅ HTTPS only
✅ Input validation

**Error Handling:**
- 400: Invalid email/password format
- 401: Incorrect credentials
- 429: Too many attempts
- 500: Server error

**Implementation:**
```typescript
// netlify/functions/auth-login.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from './utils/rate-limiter';

export async function handler(event, context) {
  // Rate limit check
  const rateLimitResult = await rateLimit(context.ip);
  if (!rateLimitResult.success) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Too many attempts' }) };
  }

  // Validate input
  const { email, password } = JSON.parse(event.body);
  if (!isValidEmail(email) || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid input' }) };
  }

  // ... authentication logic
}
```
```

## 5. Data Scientist
**Tone:** Analytical, data-driven, insightful
**Response Pattern:**
- Understand data and question
- Perform exploratory analysis
- Present findings with visualizations
- Explain methodology
- Provide actionable insights

**Example:**
```
I've analyzed your sales data for Q4 2024. Here are my findings:

**Dataset Overview:**
- 15,247 transactions
- Date range: Oct 1 - Dec 31, 2024
- Revenue: $2.4M total

**Key Findings:**

1️⃣ **Revenue Trend:**
   November showed 35% spike (Black Friday effect)
   December declined 12% (post-holiday drop)

   [Chart: Line graph showing daily revenue]

2️⃣ **Top Performing Categories:**
   - Electronics: $892K (37%)
   - Home & Garden: $531K (22%)
   - Fashion: $487K (20%)

   [Chart: Pie chart of category distribution]

3️⃣ **Customer Segmentation:**
   - High-value customers (>$500): 8% of customers, 42% of revenue
   - Medium-value ($100-500): 35% of customers, 41% of revenue
   - Low-value (<$100): 57% of customers, 17% of revenue

   [Chart: Scatter plot of customer value distribution]

**Recommendations:**

📊 **Data-Driven Actions:**
1. Launch loyalty program targeting high-value segment
   (Projected ROI: +23% revenue from this segment)

2. Increase marketing budget in November
   (Historical data shows 3:1 ROI during this period)

3. Implement dynamic pricing for December
   (Prevent post-holiday revenue decline)

**Statistical Confidence:**
- Analysis based on 15K+ data points
- 95% confidence intervals calculated
- Results are statistically significant (p < 0.05)
```
```

### Multi-Agent Collaboration Display

When multiple AI employees work together, show their collaboration visually:

```tsx
<Card className="my-4 border-primary">
  <CardHeader>
    <div className="flex items-center gap-2">
      <Users className="h-5 w-5 text-primary" />
      <CardTitle>Multi-Agent Collaboration</CardTitle>
    </div>
    <CardDescription>
      3 AI employees working together on your request
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    {/* Employee Status Cards */}
    {activeEmployees.map(employee => (
      <div key={employee.name} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
        <Avatar className="h-10 w-10 border-2 border-primary">
          <AvatarImage src={employee.avatar} />
          <AvatarFallback>{employee.name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-medium">{employee.name}</div>
            <Badge variant={
              employee.status === 'completed' ? 'default' :
              employee.status === 'working' ? 'secondary' :
              employee.status === 'thinking' ? 'outline' : 'default'
            }>
              {employee.status}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            {employee.currentTask}
          </div>

          {/* Progress Bar */}
          {employee.status === 'working' && (
            <div className="space-y-1">
              <Progress value={employee.progress} className="h-1" />
              <div className="text-xs text-muted-foreground">
                {employee.progress}% complete
              </div>
            </div>
          )}

          {/* Tool Usage */}
          {employee.currentTool && (
            <div className="flex items-center gap-2 text-xs">
              <Wrench className="h-3 w-3" />
              <span>Using: {employee.currentTool}</span>
            </div>
          )}
        </div>
      </div>
    ))}

    {/* Communication Flow */}
    <Collapsible>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <MessageSquare className="h-4 w-4" />
        <span>View collaboration timeline</span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 space-y-2">
        {collaborationMessages.map((msg, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <div className="text-xs text-muted-foreground mt-0.5">
              {format(msg.timestamp, 'HH:mm:ss')}
            </div>
            <div className="flex-1">
              <span className="font-medium">{msg.from}</span>
              {msg.to && <span className="text-muted-foreground"> → {msg.to}</span>}
              <span className="text-muted-foreground">: {msg.message}</span>
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  </CardContent>
</Card>
```

---

## 📐 COLLABORATION PROTOCOLS

### Agent Communication Protocol

**Protocol Definition:**

```typescript
// Agent-to-Agent Communication
interface AgentMessage {
  id: string;
  from: string;           // Sending agent name
  to: string | 'all';     // Receiving agent or broadcast
  type: 'request' | 'response' | 'notification' | 'question';
  priority: 'low' | 'medium' | 'high' | 'critical';
  content: string;
  context?: Record<string, unknown>;
  timestamp: Date;
  threadId?: string;      // For conversation threading
}

// Agent Status Updates
interface AgentStatusUpdate {
  agentName: string;
  status: 'idle' | 'thinking' | 'working' | 'blocked' | 'completed' | 'error';
  currentTask: string;
  progress: number;       // 0-100
  currentTool: string | null;
  estimatedCompletion?: Date;
  blockedReason?: string;
}
```

### Collaboration Workflows

#### 1. Sequential Workflow (Pipeline)

**Use Case:** Tasks that must complete in order (e.g., design → implement → review)

```
User Request: "Design and implement a login form"

┌─────────────────────────────────────────────────────────────┐
│ Software Architect                                          │
│ Status: Working                                             │
│ Task: Designing login form architecture                    │
│ Progress: ████████████████████░░░░░░░ 75%                  │
└─────────────────────────────────────────────────────────────┘
                        ↓ (outputs design spec)
┌─────────────────────────────────────────────────────────────┐
│ Frontend Engineer                                           │
│ Status: Waiting                                             │
│ Task: Awaiting design spec                                 │
│ Dependencies: Software Architect                            │
└─────────────────────────────────────────────────────────────┘
                        ↓ (implements form)
┌─────────────────────────────────────────────────────────────┐
│ Code Reviewer                                               │
│ Status: Idle                                                │
│ Task: Will review once implementation complete              │
│ Dependencies: Frontend Engineer                             │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
async function executeSequentialWorkflow(tasks: Task[]) {
  for (const task of tasks) {
    // Update mission control store
    useMissionStore.getState().updateTaskStatus(task.id, 'in_progress', task.assignedTo);

    // Execute task
    const result = await executeTask(task);

    // Update status
    useMissionStore.getState().updateTaskStatus(
      task.id,
      result.success ? 'completed' : 'failed',
      task.assignedTo,
      result.output,
      result.error
    );

    // Pass output to next task
    if (tasks[tasks.indexOf(task) + 1]) {
      tasks[tasks.indexOf(task) + 1].context = result.output;
    }
  }
}
```

#### 2. Parallel Workflow (Concurrent)

**Use Case:** Independent tasks that can run simultaneously (e.g., write docs + tests + deployment)

```
User Request: "Prepare this codebase for production"

┌────────────────────────┬────────────────────────┬────────────────────────┐
│ Documentation Writer   │ QA Engineer            │ DevOps Engineer        │
│ Status: Working        │ Status: Working        │ Status: Working        │
│ Task: Writing README   │ Task: Writing tests    │ Task: Creating CI/CD   │
│ Progress: 60%          │ Progress: 45%          │ Progress: 80%          │
└────────────────────────┴────────────────────────┴────────────────────────┘
```

**Implementation:**
```typescript
async function executeParallelWorkflow(tasks: Task[]) {
  // Start all tasks concurrently
  const promises = tasks.map(async (task) => {
    useMissionStore.getState().updateTaskStatus(task.id, 'in_progress', task.assignedTo);

    try {
      const result = await executeTask(task);
      useMissionStore.getState().updateTaskStatus(
        task.id,
        'completed',
        task.assignedTo,
        result.output
      );
      return result;
    } catch (error) {
      useMissionStore.getState().updateTaskStatus(
        task.id,
        'failed',
        task.assignedTo,
        undefined,
        error.message
      );
      throw error;
    }
  });

  // Wait for all to complete
  const results = await Promise.allSettled(promises);
  return results;
}
```

#### 3. Collaborative Workflow (Interactive)

**Use Case:** Tasks requiring back-and-forth collaboration (e.g., debugging with user)

```
User: "My app crashes on login"

┌─────────────────────────────────────────────────────────────┐
│ Debugger                                                    │
│ "I need more information. Can you provide:                  │
│  1. Error message                                           │
│  2. Browser console logs                                    │
│  3. Steps to reproduce"                                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
User: [provides information]
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Debugger                                                    │
│ "I found the issue. It's a null reference error.           │
│  Frontend Engineer, can you review the login component?"    │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend Engineer                                           │
│ "I see the problem. Line 42 doesn't check for null.        │
│  I'll fix it and add proper error handling."                │
└─────────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
async function executeCollaborativeWorkflow(initialTask: Task) {
  const conversationThread: AgentMessage[] = [];
  let currentAgent = initialTask.assignedTo;

  while (true) {
    // Execute current agent's task
    const result = await executeTask(currentAgent, {
      task: initialTask,
      conversationHistory: conversationThread
    });

    // Add to conversation thread
    conversationThread.push({
      id: crypto.randomUUID(),
      from: currentAgent,
      to: result.nextAgent || 'user',
      type: result.needsInput ? 'question' : 'response',
      content: result.message,
      timestamp: new Date()
    });

    // Check if workflow is complete
    if (result.isComplete) {
      break;
    }

    // Wait for next input (user or agent)
    if (result.needsInput) {
      const input = await waitForInput(result.nextAgent);
      conversationThread.push(input);
    }

    // Switch to next agent if needed
    if (result.nextAgent) {
      currentAgent = result.nextAgent;
    }
  }

  return conversationThread;
}
```

### Conflict Resolution

**Scenario:** Two agents disagree on approach

```typescript
interface AgentDisagreement {
  task: Task;
  agents: [
    { name: string; approach: string; reasoning: string; },
    { name: string; approach: string; reasoning: string; }
  ];
}

async function resolveDisagreement(disagreement: AgentDisagreement) {
  // Present both approaches to orchestrator
  const orchestratorDecision = await orchestratorAgent.decide({
    task: disagreement.task,
    options: disagreement.agents.map(a => ({
      name: a.name,
      approach: a.approach,
      reasoning: a.reasoning
    }))
  });

  // Notify agents of decision
  useMissionStore.getState().addMessage({
    from: 'orchestrator',
    type: 'system',
    content: `Decision: Using ${orchestratorDecision.selectedAgent}'s approach. Reason: ${orchestratorDecision.reasoning}`,
    timestamp: new Date()
  });

  return orchestratorDecision;
}
```

---

## 🎨 UI/UX SPECIFICATIONS

### Design System

**Colors:**
```typescript
// Tailwind CSS Variables (src/index.css)
@layer base {
  :root {
    /* Brand */
    --primary: 263 70% 50%;           /* Purple */
    --primary-foreground: 0 0% 100%;

    /* UI */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;

    /* Borders */
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 263 70% 50%;

    /* Status */
    --success: 142 76% 36%;
    --warning: 38 92% 50%;
    --error: 0 84% 60%;
    --info: 199 89% 48%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    /* ... dark mode colors */
  }
}
```

**Typography:**
```typescript
// Font Family
--font-sans: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", monospace;

// Font Sizes
--text-xs: 0.75rem;      // 12px
--text-sm: 0.875rem;     // 14px
--text-base: 1rem;       // 16px
--text-lg: 1.125rem;     // 18px
--text-xl: 1.25rem;      // 20px
--text-2xl: 1.5rem;      // 24px
--text-3xl: 1.875rem;    // 30px
--text-4xl: 2.25rem;     // 36px
```

**Spacing:**
```typescript
// Consistent spacing scale (Tailwind defaults)
0.5 = 2px   (0.125rem)
1   = 4px   (0.25rem)
2   = 8px   (0.5rem)
3   = 12px  (0.75rem)
4   = 16px  (1rem)
5   = 20px  (1.25rem)
6   = 24px  (1.5rem)
8   = 32px  (2rem)
10  = 40px  (2.5rem)
12  = 48px  (3rem)
16  = 64px  (4rem)
```

**Animations:**
```css
/* Fade In */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide In Left */
@keyframes slide-in-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

/* Pulse (Thinking Indicator) */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Shimmer (Loading State) */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

### Component Styling Examples

**Message Bubble:**
```tsx
<div className={cn(
  "flex gap-3 p-4 rounded-lg transition-colors group",
  message.role === 'user' && "bg-secondary",
  message.role === 'assistant' && "bg-muted/50",
  "hover:bg-accent/5"
)}>
  {/* Avatar */}
  <Avatar className="h-8 w-8 shrink-0">
    <AvatarImage src={message.role === 'user' ? user.avatar : '/ai-avatar.png'} />
    <AvatarFallback>{message.role === 'user' ? 'U' : 'AI'}</AvatarFallback>
  </Avatar>

  {/* Content */}
  <div className="flex-1 space-y-2 min-w-0">
    {/* Header */}
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">
        {message.role === 'user' ? 'You' : 'AI Assistant'}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatTimestamp(message.createdAt)}
      </span>
      {message.metadata.mode === 'thinking' && (
        <Badge variant="secondary" className="text-xs">
          <Brain className="h-3 w-3 mr-1" />
          Thinking Mode
        </Badge>
      )}
    </div>

    {/* Message Content */}
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <MarkdownRenderer content={message.content.text} />
    </div>

    {/* Actions (visible on hover) */}
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button size="sm" variant="ghost" onClick={() => handleCopy(message)}>
        <Copy className="h-3 w-3 mr-1" />
        Copy
      </Button>
      <Button size="sm" variant="ghost" onClick={() => handleRegenerate(message)}>
        <RotateCcw className="h-3 w-3 mr-1" />
        Regenerate
      </Button>
      <Button size="sm" variant="ghost" onClick={() => handleEdit(message)}>
        <Edit className="h-3 w-3 mr-1" />
        Edit
      </Button>
    </div>
  </div>
</div>
```

**Loading State (Streaming):**
```tsx
<div className="flex gap-3 p-4 rounded-lg bg-muted/50">
  <Avatar className="h-8 w-8 shrink-0">
    <AvatarImage src="/ai-avatar.png" />
    <AvatarFallback>AI</AvatarFallback>
  </Avatar>

  <div className="flex-1 space-y-2">
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">AI Assistant</span>
      <Badge variant="secondary" className="text-xs">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Streaming
      </Badge>
    </div>

    {/* Streaming Content */}
    <div className="prose prose-sm max-w-none dark:prose-invert">
      {streamingContent}
      <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
    </div>

    {/* Token Counter */}
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Sparkles className="h-3 w-3" />
      <span className="font-mono">{tokensGenerated} tokens</span>
    </div>
  </div>
</div>
```

---

## 📁 FILE STRUCTURE

### Complete File Organization

```
src/
├── features/
│   └── chat-interface/                          # NEW: Modern chat interface
│       ├── pages/
│       │   └── ModernChatInterface.tsx          # Main full-screen page (entry point)
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── TopBar.tsx                   # Model/mode selectors, nav
│       │   │   ├── BottomBar.tsx                # Status, token count
│       │   │   ├── LeftSidebar.tsx              # Conversation history
│       │   │   └── RightPanel.tsx               # Artifacts/tools/settings
│       │   │
│       │   ├── conversation/
│       │   │   ├── ConversationList.tsx         # List with search/filter
│       │   │   ├── ConversationItem.tsx         # Individual item with context menu
│       │   │   ├── NewChatButton.tsx            # Create new conversation
│       │   │   ├── SearchConversations.tsx      # Search input + results
│       │   │   └── ConversationFilters.tsx      # Filter controls
│       │   │
│       │   ├── messages/
│       │   │   ├── MessageList.tsx              # Virtualized message container
│       │   │   ├── MessageGroup.tsx             # Group of related messages
│       │   │   ├── UserMessage.tsx              # User message component
│       │   │   ├── AIMessage.tsx                # AI response component
│       │   │   ├── StreamingMessage.tsx         # Streaming indicator
│       │   │   ├── MessageContent.tsx           # Markdown renderer
│       │   │   ├── MessageActions.tsx           # Copy/regenerate/edit buttons
│       │   │   └── WelcomeScreen.tsx            # Empty state with suggestions
│       │   │
│       │   ├── thinking/
│       │   │   ├── ThinkingModeDisplay.tsx      # Container for thinking process
│       │   │   ├── ThinkingProgressBar.tsx      # Progress indicator
│       │   │   ├── ThinkingSteps.tsx            # Step-by-step list
│       │   │   └── ThinkingStepItem.tsx         # Individual step card
│       │   │
│       │   ├── tools/
│       │   │   ├── ToolExecutionDisplay.tsx     # Tool call container
│       │   │   ├── ToolHeader.tsx               # Tool name + status
│       │   │   ├── ToolParameters.tsx           # Parameter display (JSON)
│       │   │   ├── ToolResult.tsx               # Result display
│       │   │   └── ExecutionTimeline.tsx        # Timeline visualization
│       │   │
│       │   ├── artifacts/
│       │   │   ├── ArtifactViewer.tsx           # Main viewer with tabs
│       │   │   ├── CodePreview.tsx              # Syntax-highlighted code
│       │   │   ├── LivePreview.tsx              # HTML/React preview (iframe)
│       │   │   ├── ImagePreview.tsx             # Image display
│       │   │   ├── DocumentPreview.tsx          # Markdown/PDF viewer
│       │   │   ├── DataVisualization.tsx        # Charts/graphs (Recharts)
│       │   │   └── ArtifactVersionHistory.tsx   # Version control UI
│       │   │
│       │   ├── input/
│       │   │   ├── ChatInput.tsx                # Main input container
│       │   │   ├── InputField.tsx               # Auto-resize textarea
│       │   │   ├── AttachmentControls.tsx       # File/image/voice buttons
│       │   │   ├── AttachmentPreview.tsx        # Attached file preview
│       │   │   ├── VoiceInput.tsx               # Voice recording (future)
│       │   │   ├── SendButton.tsx               # Submit button with state
│       │   │   ├── StopButton.tsx               # Stop generation
│       │   │   └── InputSuggestions.tsx         # Contextual prompt suggestions
│       │   │
│       │   ├── selectors/
│       │   │   ├── ModelSelector.tsx            # Model dropdown with badges
│       │   │   ├── ModeSelector.tsx             # Fast/Balanced/Thinking toggle
│       │   │   └── ModelCapabilityBadge.tsx     # Feature badges
│       │   │
│       │   ├── display/
│       │   │   ├── TokenUsageDisplay.tsx        # Real-time token counter
│       │   │   ├── TypingIndicator.tsx          # "AI is typing..." animation
│       │   │   ├── StatusIndicator.tsx          # Connection status dot
│       │   │   └── CostEstimator.tsx            # Cost display with warnings
│       │   │
│       │   ├── export/
│       │   │   ├── ExportDialog.tsx             # Export modal
│       │   │   ├── ExportFormatSelector.tsx     # Format radio buttons
│       │   │   └── ExportProgress.tsx           # Export progress bar
│       │   │
│       │   └── shared/
│       │       ├── CollapsibleSection.tsx       # Reusable collapsible
│       │       ├── MarkdownRenderer.tsx         # Markdown with plugins
│       │       ├── CodeBlock.tsx                # Syntax highlighter
│       │       ├── ScrollToBottom.tsx           # Scroll button
│       │       └── LoadingSpinner.tsx           # Loading indicator
│       │
│       ├── hooks/
│       │   ├── use-chat-interface.ts            # Main chat logic
│       │   ├── use-message-streaming.ts         # Streaming handler
│       │   ├── use-thinking-mode.ts             # Thinking mode processor
│       │   ├── use-tool-execution.ts            # Tool execution tracking
│       │   ├── use-artifact-management.ts       # Artifact CRUD
│       │   ├── use-conversation-search.ts       # Search logic
│       │   ├── use-conversation-export.ts       # Export logic
│       │   ├── use-token-tracking.ts            # Token usage tracking
│       │   ├── use-auto-scroll.ts               # Auto-scroll behavior
│       │   ├── use-keyboard-shortcuts.ts        # Keyboard navigation
│       │   └── use-virtualized-list.ts          # Message virtualization
│       │
│       ├── services/
│       │   ├── chat-message-handler.ts          # Message processing
│       │   ├── conversation-manager.ts          # Conversation CRUD
│       │   ├── artifact-generator.ts            # Artifact creation
│       │   ├── export-service.ts                # Export to various formats
│       │   ├── search-service.ts                # Full-text search
│       │   └── temporary-chat-handler.ts        # Temporary chat logic
│       │
│       ├── stores/
│       │   ├── chat-interface-store.ts          # UI state (sidebars, panels)
│       │   ├── conversation-history-store.ts    # Conversation list
│       │   ├── message-processing-store.ts      # Message queue, streaming
│       │   ├── chat-configuration-store.ts      # Model, mode, settings
│       │   └── artifact-store.ts                # Artifact management
│       │
│       ├── utils/
│       │   ├── message-formatter.ts             # Format messages
│       │   ├── token-calculator.ts              # Token estimation
│       │   ├── cost-calculator.ts               # Cost calculation
│       │   ├── markdown-parser.ts               # Markdown utilities
│       │   └── export-formatters/
│       │       ├── markdown-exporter.ts         # Export to .md
│       │       ├── pdf-exporter.ts              # Export to .pdf (jsPDF)
│       │       ├── json-exporter.ts             # Export to .json
│       │       └── html-exporter.ts             # Export to .html
│       │
│       └── types/
│           ├── chat-interface.types.ts          # UI state types
│           ├── message.types.ts                 # Message structure
│           ├── artifact.types.ts                # Artifact types
│           ├── tool.types.ts                    # Tool execution types
│           └── conversation.types.ts            # Conversation types
│
├── core/
│   └── ai/
│       ├── llm/
│       │   ├── unified-language-model.ts        # EXISTING: Keep as-is
│       │   └── providers/                       # EXISTING: Keep all
│       │
│       ├── orchestration/
│       │   ├── workforce-orchestrator.ts        # EXISTING: Keep, enhance
│       │   ├── model-router.ts                  # NEW: Auto model selection
│       │   └── thinking-mode-processor.ts       # NEW: Thinking mode handler
│       │
│       └── employees/
│           └── prompt-management.ts             # EXISTING: Keep
│
├── shared/
│   ├── stores/
│   │   ├── mission-control-store.ts             # EXISTING: Keep for orchestration
│   │   └── employee-management-store.ts         # EXISTING: Keep
│   │
│   └── lib/
│       ├── date-utils.ts                        # EXISTING: Keep
│       └── supabase-client.ts                   # EXISTING: Keep
│
└── workers/
    ├── token-counter.worker.ts                  # NEW: Web worker for token calc
    └── syntax-highlighter.worker.ts             # NEW: Web worker for highlighting
```

---

## 🗓️ IMPLEMENTATION ROADMAP

### 8-Week Implementation Plan

#### **PHASE 1: FOUNDATION** (Weeks 1-2)

**Week 1: Setup & Core Layout**

**Day 1-2: Project Setup**
- [ ] Install assistant-ui dependencies
- [ ] Create new file structure (`/chat-interface`)
- [ ] Set up Zustand stores (4 new stores)
- [ ] Configure routing for new interface
- [ ] Set up feature flag for gradual rollout

**Day 3-4: Layout Components**
- [ ] Build `ModernChatInterface.tsx` (main page)
- [ ] Create `TopBar.tsx` with placeholders
- [ ] Create `BottomBar.tsx` with placeholders
- [ ] Create `LeftSidebar.tsx` (basic structure)
- [ ] Create `RightPanel.tsx` (basic tabs)
- [ ] Implement responsive layout (mobile/tablet/desktop)
- [ ] Add keyboard shortcut system

**Day 5: Model & Mode Selection**
- [ ] Build `ModelSelector.tsx` with all models
- [ ] Build `ModeSelector.tsx` (Fast/Balanced/Thinking)
- [ ] Implement model recommendation logic
- [ ] Add model capability badges
- [ ] Connect to chat configuration store

**Week 2: Message Display**

**Day 1-2: Basic Message Components**
- [ ] Create `MessageList.tsx` with virtualization
- [ ] Build `UserMessage.tsx` component
- [ ] Build `AIMessage.tsx` component
- [ ] Implement `MarkdownRenderer.tsx`
- [ ] Add `CodeBlock.tsx` with syntax highlighting
- [ ] Style message bubbles

**Day 3-4: Message Actions & Features**
- [ ] Add `MessageActions.tsx` (copy/regenerate/edit)
- [ ] Implement copy to clipboard functionality
- [ ] Add message regeneration
- [ ] Build message edit dialog
- [ ] Add auto-scroll behavior
- [ ] Create `WelcomeScreen.tsx` for empty state

**Day 5: Chat Input**
- [ ] Build `ChatInput.tsx` (auto-resize textarea)
- [ ] Add `SendButton.tsx` with loading states
- [ ] Add `StopButton.tsx` for streaming
- [ ] Implement attachment controls (placeholder)
- [ ] Connect to message processing store

**Deliverable:** Basic working chat interface with message display and input

---

#### **PHASE 2: ADVANCED FEATURES** (Weeks 3-4)

**Week 3: Streaming & Thinking Mode**

**Day 1-2: Message Streaming**
- [ ] Implement streaming service with optimization
- [ ] Add `StreamingMessage.tsx` component
- [ ] Build streaming cursor animation
- [ ] Add real-time token counter during streaming
- [ ] Optimize with `requestAnimationFrame` batching
- [ ] Add stream error handling

**Day 3-4: Thinking Mode**
- [ ] Build `ThinkingModeDisplay.tsx`
- [ ] Create `ThinkingProgressBar.tsx`
- [ ] Build `ThinkingSteps.tsx` list
- [ ] Create `ThinkingStepItem.tsx` card
- [ ] Integrate with thinking mode processor service
- [ ] Add collapsible thinking display
- [ ] Style thinking steps with timeline

**Day 5: Token Usage System**
- [ ] Create `TokenUsageDisplay.tsx` (top bar)
- [ ] Add detailed token display (bottom bar)
- [ ] Implement per-message token counts
- [ ] Build token counter web worker
- [ ] Add usage warnings (85%, 95%)
- [ ] Create warning alert components

**Week 4: Tool Execution**

**Day 1-3: Tool Display Components**
- [ ] Build `ToolExecutionDisplay.tsx` (collapsible)
- [ ] Create `ToolHeader.tsx` with status
- [ ] Build `ToolParameters.tsx` (JSON display)
- [ ] Create `ToolResult.tsx` renderer
- [ ] Add `ExecutionTimeline.tsx` visualization
- [ ] Implement tool-specific renderers (web search, code, etc.)
- [ ] Add tool icons mapping

**Day 4-5: Integration & Testing**
- [ ] Connect tool displays to mission control store
- [ ] Test tool execution with real examples
- [ ] Add error handling for tool failures
- [ ] Implement retry mechanism
- [ ] Test with parallel tool executions
- [ ] Performance testing with multiple tools

**Deliverable:** Fully functional streaming with thinking mode and tool visualization

---

#### **PHASE 3: CONVERSATION MANAGEMENT** (Week 5)

**Week 5: History, Search & Export**

**Day 1-2: Conversation List**
- [ ] Build `ConversationList.tsx` with grouping (Today, Yesterday, etc.)
- [ ] Create `ConversationItem.tsx` with context menu
- [ ] Add `NewChatButton.tsx`
- [ ] Implement conversation CRUD operations
- [ ] Add pin/archive/delete functionality
- [ ] Build rename conversation dialog

**Day 3: Search Functionality**
- [ ] Build `SearchConversations.tsx` component
- [ ] Implement full-text search service
- [ ] Add search result highlighting
- [ ] Build search filters (date, type, tools)
- [ ] Add search history
- [ ] Implement debounced search

**Day 4-5: Export System**
- [ ] Build `ExportDialog.tsx` with options
- [ ] Implement Markdown exporter
- [ ] Implement PDF exporter (jsPDF)
- [ ] Implement JSON exporter
- [ ] Implement HTML exporter
- [ ] Add export progress indicator
- [ ] Test all export formats

**Deliverable:** Complete conversation management with search and export

---

#### **PHASE 4: ARTIFACTS & RIGHT PANEL** (Week 6)

**Week 6: Artifacts System**

**Day 1-2: Artifact Viewer**
- [ ] Build `ArtifactViewer.tsx` with tabs
- [ ] Create `CodePreview.tsx` with syntax highlighting
- [ ] Implement copy/download buttons
- [ ] Add full-screen mode
- [ ] Build tab navigation (Code/Preview/History)

**Day 3: Live Preview**
- [ ] Build `LivePreview.tsx` for HTML (iframe with sandbox)
- [ ] Implement React component preview (react-live)
- [ ] Add preview error handling
- [ ] Implement preview refresh
- [ ] Test with various code types

**Day 4: Additional Viewers**
- [ ] Build `ImagePreview.tsx` with zoom
- [ ] Create `DocumentPreview.tsx` for Markdown/PDF
- [ ] Build `DataVisualization.tsx` (Recharts integration)
- [ ] Add artifact type detection

**Day 5: Version History**
- [ ] Build `ArtifactVersionHistory.tsx`
- [ ] Implement version comparison (diff)
- [ ] Add restore version functionality
- [ ] Test version switching

**Deliverable:** Complete artifact system with live preview and version control

---

#### **PHASE 5: POLISH & OPTIMIZATION** (Week 7)

**Week 7: Performance, Accessibility, Responsive**

**Day 1-2: Performance Optimization**
- [ ] Implement message virtualization (react-virtuoso)
- [ ] Add component memoization (React.memo)
- [ ] Optimize re-renders with selective subscriptions
- [ ] Move token calculation to web worker
- [ ] Implement code splitting for heavy components
- [ ] Add lazy loading for artifacts
- [ ] Profile and fix performance bottlenecks

**Day 3: Accessibility**
- [ ] Add ARIA labels to all interactive elements
- [ ] Implement focus management
- [ ] Add keyboard shortcuts help dialog
- [ ] Test with screen reader
- [ ] Ensure 4.5:1 color contrast
- [ ] Add skip links
- [ ] Implement reduced motion support

**Day 4-5: Responsive Design**
- [ ] Test on mobile (iPhone, Android)
- [ ] Test on tablet (iPad)
- [ ] Add touch gestures (swipe, long-press)
- [ ] Optimize mobile sidebar (slide-in overlay)
- [ ] Test right panel on tablet (overlay mode)
- [ ] Fix any responsive layout issues

**Deliverable:** Optimized, accessible, responsive chat interface

---

#### **PHASE 6: TESTING & DOCUMENTATION** (Week 8)

**Week 8: Testing, Docs & Launch**

**Day 1-2: Testing**
- [ ] Write unit tests for all hooks
- [ ] Write unit tests for utility functions
- [ ] Write component tests (React Testing Library)
- [ ] Write integration tests for critical flows
- [ ] Write E2E tests (Playwright)
  - Send message flow
  - Conversation management
  - Export functionality
  - Tool execution display
- [ ] Run accessibility tests (axe-core)
- [ ] Performance benchmarking

**Day 3: Documentation**
- [ ] Update `README.md` with new features
- [ ] Update `CLAUDE.md` with new architecture
- [ ] Create `CHAT_INTERFACE.md` developer guide
- [ ] Document all TypeScript interfaces
- [ ] Add JSDoc comments to complex functions
- [ ] Create component usage examples
- [ ] Write deployment guide

**Day 4: Final Integration**
- [ ] Integrate with existing Mission Control
- [ ] Test with AI employee system
- [ ] Verify backward compatibility
- [ ] Test with Supabase persistence
- [ ] Verify rate limiting works
- [ ] Test token usage tracking end-to-end

**Day 5: Launch Preparation**
- [ ] Final type-check (must pass)
- [ ] Final lint check
- [ ] Production build test
- [ ] Security audit
- [ ] Create feature announcement
- [ ] Prepare rollback plan
- [ ] Deploy to production

**Deliverable:** Production-ready chat interface with complete documentation

---

## 🧪 TESTING STRATEGY

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E\            5-10 tests
                 /______\
                /        \
               / Integration\       20-30 tests
              /______________\
             /                \
            /   Unit Tests     \    100+ tests
           /____________________\
```

### Unit Tests (Vitest)

**Coverage Targets:**
- Hooks: 90%+
- Services: 85%+
- Utils: 95%+
- Components: 70%+

**Example Tests:**

```typescript
// hooks/use-token-tracking.test.ts
describe('useTokenTracking', () => {
  it('should calculate tokens correctly for GPT-4o', () => {
    const { result } = renderHook(() => useTokenTracking());
    const text = "Hello, world!";
    const tokens = result.current.calculateTokens(text, 'gpt-4o');
    expect(tokens).toBeGreaterThan(0);
  });

  it('should warn at 85% usage', () => {
    const { result } = renderHook(() => useTokenTracking());
    act(() => {
      result.current.addTokens(8500); // 85% of 10000 limit
    });
    expect(result.current.warning?.level).toBe('warning');
  });

  it('should show critical alert at 95% usage', () => {
    const { result } = renderHook(() => useTokenTracking());
    act(() => {
      result.current.addTokens(9500); // 95% of 10000 limit
    });
    expect(result.current.warning?.level).toBe('critical');
  });
});

// services/export-service.test.ts
describe('ExportService', () => {
  const mockConversation = {
    title: 'Test Conversation',
    messages: [
      { role: 'user', content: { text: 'Hello' } },
      { role: 'assistant', content: { text: 'Hi there!' } }
    ]
  };

  it('should export to markdown correctly', async () => {
    const service = new ExportService();
    const markdown = await service.exportToMarkdown(mockConversation, {
      includeMetadata: true
    });
    expect(markdown).toContain('# Test Conversation');
    expect(markdown).toContain('## You');
    expect(markdown).toContain('## AI');
  });

  it('should export to JSON correctly', async () => {
    const service = new ExportService();
    const json = await service.exportToJSON(mockConversation);
    const parsed = JSON.parse(json);
    expect(parsed.conversation.title).toBe('Test Conversation');
    expect(parsed.messages).toHaveLength(2);
  });
});
```

### Integration Tests

**Focus Areas:**
1. Chat flow (send message → receive response)
2. Tool execution (trigger tool → display result)
3. Thinking mode (enable → display steps)
4. Export (select options → download file)

```typescript
// integration/chat-flow.test.ts
describe('Chat Flow Integration', () => {
  it('should send message and receive streaming response', async () => {
    render(<ModernChatInterface />);

    // Type message
    const input = screen.getByPlaceholderText('Type your message...');
    await userEvent.type(input, 'Hello, AI!');

    // Send message
    const sendButton = screen.getByRole('button', { name: /send/i });
    await userEvent.click(sendButton);

    // Verify user message appears
    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();

    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText(/hi there/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify message actions appear
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

**Critical User Flows:**

```typescript
// e2e/chat-interface.spec.ts
import { test, expect } from '@playwright/test';

test('complete chat conversation flow', async ({ page }) => {
  await page.goto('/chat');

  // Wait for interface to load
  await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

  // Select model
  await page.click('[data-testid="model-selector"]');
  await page.click('text=Claude Sonnet 4.5');

  // Enable thinking mode
  await page.click('[data-testid="mode-selector"] >> text=Thinking');

  // Send message
  const input = page.locator('[data-testid="chat-input"]');
  await input.fill('Explain quantum computing in simple terms');
  await page.click('[data-testid="send-button"]');

  // Verify thinking mode display
  await expect(page.locator('[data-testid="thinking-display"]')).toBeVisible();

  // Wait for response
  await expect(page.locator('[data-testid="ai-message"]')).toBeVisible({ timeout: 30000 });

  // Verify response contains content
  const response = await page.locator('[data-testid="ai-message"]').textContent();
  expect(response).toContain('quantum');

  // Test copy functionality
  await page.hover('[data-testid="ai-message"]');
  await page.click('[data-testid="copy-button"]');
  await expect(page.locator('text=Copied!')).toBeVisible();
});

test('conversation management', async ({ page }) => {
  await page.goto('/chat');

  // Create new conversation
  await page.click('[data-testid="new-chat-button"]');

  // Send message
  await page.fill('[data-testid="chat-input"]', 'Test message');
  await page.click('[data-testid="send-button"]');

  // Wait for response
  await page.waitForSelector('[data-testid="ai-message"]');

  // Open conversation list
  await page.click('[data-testid="conversation-list-item"]:first-child');

  // Right-click for context menu
  await page.click('[data-testid="conversation-list-item"]:first-child', { button: 'right' });

  // Rename conversation
  await page.click('text=Rename');
  await page.fill('[data-testid="rename-input"]', 'My Test Conversation');
  await page.click('[data-testid="rename-confirm"]');

  // Verify rename
  await expect(page.locator('text=My Test Conversation')).toBeVisible();

  // Pin conversation
  await page.click('[data-testid="conversation-list-item"]:first-child', { button: 'right' });
  await page.click('text=Pin');

  // Verify pin icon
  await expect(page.locator('[data-testid="pin-icon"]')).toBeVisible();
});

test('export conversation', async ({ page }) => {
  await page.goto('/chat');

  // Open conversation menu
  await page.click('[data-testid="conversation-menu"]');
  await page.click('text=Export');

  // Select format
  await page.click('[data-testid="export-format-markdown"]');

  // Configure options
  await page.check('[data-testid="include-thinking"]');
  await page.check('[data-testid="include-tools"]');

  // Start download
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="export-button"]');
  const download = await downloadPromise;

  // Verify download
  expect(download.suggestedFilename()).toMatch(/\.md$/);
});
```

### Accessibility Tests

```typescript
// accessibility/chat-interface.test.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test('chat interface accessibility', async ({ page }) => {
  await page.goto('/chat');

  // Inject axe-core
  await injectAxe(page);

  // Run accessibility checks
  await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: {
      html: true
    }
  });

  // Test keyboard navigation
  await page.keyboard.press('Tab'); // Should focus input
  await expect(page.locator('[data-testid="chat-input"]')).toBeFocused();

  await page.keyboard.press('Tab'); // Should focus send button
  await expect(page.locator('[data-testid="send-button"]')).toBeFocused();

  // Test keyboard shortcuts
  await page.keyboard.press('Control+N'); // New conversation
  await expect(page.locator('[data-testid="welcome-screen"]')).toBeVisible();

  await page.keyboard.press('Control+K'); // Search
  await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
});
```

### Performance Tests

```typescript
// performance/chat-interface.test.ts
import { test, expect } from '@playwright/test';

test('performance benchmarks', async ({ page }) => {
  await page.goto('/chat');

  // Measure initial load time
  const loadStart = Date.now();
  await page.waitForSelector('[data-testid="chat-interface"]');
  const loadTime = Date.now() - loadStart;
  expect(loadTime).toBeLessThan(2000); // < 2 seconds

  // Measure message render time
  const messages = 100;
  for (let i = 0; i < messages; i++) {
    await page.evaluate((idx) => {
      window.testStore.addMessage({
        id: `test-${idx}`,
        role: idx % 2 === 0 ? 'user' : 'assistant',
        content: { text: `Test message ${idx}` },
        createdAt: new Date()
      });
    }, i);
  }

  // Measure render time
  const renderStart = Date.now();
  await page.waitForSelector(`[data-testid="message-${messages - 1}"]`);
  const renderTime = Date.now() - renderStart;
  expect(renderTime).toBeLessThan(5000); // < 5 seconds for 100 messages

  // Measure scroll performance
  const scrollStart = Date.now();
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  const scrollTime = Date.now() - scrollStart;
  expect(scrollTime).toBeLessThan(100); // < 100ms
});
```

---

## 📚 DOCUMENTATION UPDATES

### 1. README.md Updates

**Add to Features Section:**

```markdown
### Modern Chat Interface (November 2025)

Experience a **world-class AI chat interface** that rivals Claude.ai, ChatGPT, and Google Gemini:

- **🧠 Thinking Mode** - Watch AI reasoning in real-time with step-by-step visualization
- **🤖 Advanced Model Selection** - Choose from GPT-5.1 Thinking, Claude Sonnet 4.5, Gemini 2.5 Pro, and more
- **⚡ Real-Time Token Tracking** - Live token counts with cost estimation and usage warnings
- **🛠️ Tool Execution Visualization** - See exactly what tools AI is using and their results
- **📄 Artifact System** - Live code preview, version history, and multi-format export
- **🔍 Powerful Search** - Full-text search across all conversations
- **💾 Export Anywhere** - Download conversations as Markdown, PDF, JSON, or HTML
- **📱 Fully Responsive** - Optimized for mobile, tablet, and desktop
- **♿ Accessible** - WCAG AA compliant with keyboard navigation and screen reader support

**Latest LLM Models (November 2025):**
- **Claude Sonnet 4.5**: Best coding model (77.2% SWE-bench)
- **Gemini 2.5 Pro**: Best reasoning (86.4% GPQA Diamond, 1M context window)
- **GPT-5.1 Thinking**: Adaptive reasoning with warm, conversational tone
- **Kimi K2 Thinking**: Open-source model with 300 tool-call cycles
- **And more**: o3, o4-mini, Claude Opus 4.1, Grok 4
```

**Add to Quick Start:**

```markdown
### Using the Modern Chat Interface

1. Navigate to `/chat` to access the new interface
2. Select your preferred model from the dropdown (e.g., Claude Sonnet 4.5 for coding)
3. Choose a mode:
   - **Fast**: Quick responses for simple questions
   - **Balanced**: Default mode for general use
   - **Thinking**: Extended reasoning with visible thought process
4. Start chatting! Your conversation is automatically saved.

**Keyboard Shortcuts:**
- `Ctrl/Cmd + N` - New conversation
- `Ctrl/Cmd + K` - Search conversations
- `Ctrl/Cmd + L` - Focus input
- `Ctrl/Cmd + B` - Toggle sidebar
- `Escape` - Stop generation
```

### 2. CLAUDE.md Updates

**Add New Section:**

```markdown
## Modern Chat Interface Architecture (November 2025)

### Overview

The AGI Agent Automation platform features a modern, full-screen chat interface built with **assistant-ui**, React 18, and shadcn/ui, offering a world-class experience comparable to Claude.ai, ChatGPT, and Google Gemini.

### Key Files

**Main Entry Point:**
- `src/features/chat-interface/pages/ModernChatInterface.tsx` - Full-screen chat page (primary interface)

**State Management (6 Zustand Stores):**
- `src/features/chat-interface/stores/chat-interface-store.ts` - UI state (sidebars, panels, focus)
- `src/features/chat-interface/stores/conversation-history-store.ts` - Conversation list, search, folders
- `src/features/chat-interface/stores/message-processing-store.ts` - Message queue, streaming, thinking mode
- `src/features/chat-interface/stores/chat-configuration-store.ts` - Model selection, mode, temperature
- `src/features/chat-interface/stores/artifact-store.ts` - Artifact management
- `src/shared/stores/mission-control-store.ts` - **EXISTING** - Orchestration state (keep for multi-agent)

**Critical Services:**
- `src/features/chat-interface/services/chat-message-handler.ts` - Message processing
- `src/features/chat-interface/services/export-service.ts` - Export to Markdown/PDF/JSON/HTML
- `src/features/chat-interface/services/search-service.ts` - Full-text search
- `src/core/ai/orchestration/thinking-mode-processor.ts` - Thinking mode logic
- `src/core/ai/llm/unified-language-model.ts` - **EXISTING** - LLM provider interface

### Architecture Principles

1. **Hybrid Approach**: Uses assistant-ui for standard chat while preserving custom Mission Control UI
2. **Backward Compatibility**: All existing services (`unified-llm-service.ts`, `workforce-orchestrator.ts`) remain unchanged
3. **Separation of Concerns**: 6 specialized Zustand stores for different state domains
4. **Performance First**: Message virtualization, web workers, lazy loading
5. **Accessibility**: WCAG AA compliant with full keyboard navigation

### Model Selection

The platform supports multiple LLM providers with automatic model recommendation:

**Default Models by Task Type:**
- **Coding**: Claude Sonnet 4.5 (77.2% SWE-bench, $3/$15 per M tokens)
- **Scientific Reasoning**: Gemini 2.5 Pro (86.4% GPQA, 1M context, $2.50/$10)
- **General Purpose**: GPT-5.1 Thinking (adaptive, warm tone, $5/$20)
- **Cost-Sensitive**: Kimi K2 Thinking (open-source, $0.55/$2.25)

### Adding New Features

When extending the chat interface:

1. **Create Component**: Add to `src/features/chat-interface/components/`
2. **Add Types**: Define in `src/features/chat-interface/types/`
3. **Update Store**: Modify relevant Zustand store
4. **Write Tests**: Unit tests (Vitest) + E2E tests (Playwright)
5. **Update Docs**: Add to this file and README.md

### Common Tasks

**Adding a New Model:**
```typescript
// src/features/chat-interface/stores/chat-configuration-store.ts
const NEW_MODEL: ModelOption = {
  id: 'new-model-id',
  provider: 'provider-name',
  name: 'Display Name',
  contextWindow: 128000,
  cost: { input: 2, output: 8 },
  capabilities: ['text', 'thinking', 'tool-use']
};
```

**Adding a New Tool Renderer:**
```typescript
// src/features/chat-interface/components/tools/ToolResult.tsx
if (result.type === 'new_tool_type') {
  return <CustomToolRenderer result={result} />;
}
```

**Integrating with Mission Control:**
```typescript
// Use mission-control-store for orchestration state
import { useMissionStore } from '@shared/stores/mission-control-store';

// Connect to chat interface for display
const activeEmployees = useMissionStore(state => state.activeEmployees);
```

### Testing

**Run Tests:**
```bash
npm run test                # Unit tests
npm run test:coverage       # Coverage report
npm run e2e                 # E2E tests
npm run test:a11y           # Accessibility tests
```

**Coverage Requirements:**
- Hooks: 90%+
- Services: 85%+
- Components: 70%+

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial Load | < 2s | TBD |
| Message Render | < 50ms | TBD |
| Streaming | 60fps | TBD |
| Search Response | < 100ms | TBD |

### Deployment Checklist

Before deploying chat interface changes:

- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run lint` passes
- [ ] `npm run test:run` passes (80%+ coverage)
- [ ] `npm run e2e` passes (all flows)
- [ ] Accessibility audit passes (axe-core)
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Feature flag configured for gradual rollout
```

### 3. New Developer Guide

Create `docs/CHAT_INTERFACE_DEVELOPER_GUIDE.md`:

```markdown
# Chat Interface Developer Guide

## Quick Start for Developers

### Prerequisites
- Node.js 18+
- Familiarity with React 18, TypeScript, Tailwind CSS
- Understanding of Zustand state management

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Navigate to chat interface
# http://localhost:5173/chat
```

### Project Structure

The chat interface follows a feature-based architecture:

```
src/features/chat-interface/
├── pages/           # Route components
├── components/      # UI components (organized by domain)
├── hooks/           # Custom React hooks
├── services/        # Business logic
├── stores/          # Zustand state stores
├── utils/           # Utility functions
└── types/           # TypeScript interfaces
```

### State Management Flow

```
User Action
    ↓
Component Event Handler
    ↓
Zustand Store Action
    ↓
Service Layer (optional)
    ↓
State Update
    ↓
Component Re-render (selective)
```

### Adding a New Component

1. **Create Component File:**
```typescript
// src/features/chat-interface/components/example/NewFeature.tsx
import { useFeatureStore } from '../../stores/feature-store';

export function NewFeature() {
  const state = useFeatureStore(state => state.value);

  return (
    <div className="p-4 bg-background">
      {/* Component JSX */}
    </div>
  );
}
```

2. **Add Types:**
```typescript
// src/features/chat-interface/types/feature.types.ts
export interface FeatureState {
  value: string;
  isLoading: boolean;
}
```

3. **Write Tests:**
```typescript
// src/features/chat-interface/components/example/NewFeature.test.tsx
describe('NewFeature', () => {
  it('should render correctly', () => {
    render(<NewFeature />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

### Debugging Tips

**1. Zustand DevTools:**
```typescript
// Stores are already configured with devtools
// Open Redux DevTools in browser to inspect state
```

**2. Check Mission Control Store:**
```typescript
// In browser console:
window.__ZUSTAND_STORES__.missionControl.getState()
```

**3. Enable Verbose Logging:**
```typescript
// Set in localStorage
localStorage.setItem('DEBUG', 'chat:*');
```

### Common Patterns

**1. Optimistic UI Updates:**
```typescript
async function sendMessage(content: string) {
  // Add message immediately
  const optimisticMessage = {
    id: crypto.randomUUID(),
    content,
    status: 'sending'
  };
  addMessage(optimisticMessage);

  try {
    // Send to server
    const response = await api.sendMessage(content);
    // Update with server response
    updateMessage(optimisticMessage.id, response);
  } catch (error) {
    // Revert on error
    updateMessage(optimisticMessage.id, { status: 'failed' });
  }
}
```

**2. Selective Re-renders:**
```typescript
// BAD: Subscribes to entire store, re-renders on any change
const store = useChatStore();

// GOOD: Subscribes only to needed value
const isStreaming = useChatStore(state => state.isStreaming);
```

**3. Batch State Updates:**
```typescript
// Use Immer to batch multiple updates
set((state) => {
  state.isLoading = true;
  state.error = null;
  state.data = newData;
  // All updated in single re-render
});
```

### Troubleshooting

**Issue: Messages not streaming**
- Check Netlify function is running: `netlify dev`
- Verify WebSocket connection in Network tab
- Check `message-processing-store` state

**Issue: Thinking mode not displaying**
- Verify model supports thinking mode
- Check `thinkingProcess` in message metadata
- Ensure `ThinkingModeDisplay` component is rendered

**Issue: Poor performance with many messages**
- Verify virtualization is enabled (`use-virtualized-list.ts`)
- Check for unnecessary re-renders (React DevTools Profiler)
- Ensure selective Zustand subscriptions

### Resources

- [assistant-ui Documentation](https://www.assistant-ui.com/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React 18 Documentation](https://react.dev/)
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] **Code Quality**
  - [ ] `npm run type-check` passes with 0 errors
  - [ ] `npm run lint` passes with 0 warnings
  - [ ] `npm run format:check` passes
  - [ ] All console.log removed (except logger service)

- [ ] **Testing**
  - [ ] Unit tests pass (`npm run test:run`)
  - [ ] Test coverage ≥ 80%
  - [ ] Integration tests pass
  - [ ] E2E tests pass (`npm run e2e`)
  - [ ] Accessibility tests pass (axe-core)
  - [ ] Manual testing on Chrome, Firefox, Safari
  - [ ] Mobile testing (iOS Safari, Android Chrome)

- [ ] **Performance**
  - [ ] Lighthouse score ≥ 90
  - [ ] Initial load < 2 seconds
  - [ ] Message render < 50ms
  - [ ] Streaming at 60fps
  - [ ] Memory usage < 200MB for 1000 messages

- [ ] **Security**
  - [ ] No API keys in client code
  - [ ] Rate limiting configured (Upstash Redis)
  - [ ] CSRF protection enabled
  - [ ] Input validation on all forms
  - [ ] SQL injection prevention verified
  - [ ] XSS prevention verified

- [ ] **Documentation**
  - [ ] README.md updated
  - [ ] CLAUDE.md updated
  - [ ] Developer guide created
  - [ ] API documentation updated
  - [ ] Changelog updated

### Deployment Steps

1. **Create Feature Branch**
```bash
git checkout -b feat/modern-chat-interface
git add .
git commit -m "feat: implement modern chat interface with thinking mode, artifacts, and export

Implemented world-class chat interface based on November 2025 competitive analysis:

FEATURES:
- Full-screen three-panel layout (responsive mobile/tablet/desktop)
- Model selection (GPT-5.1, Claude Sonnet 4.5, Gemini 2.5 Pro, Kimi K2, etc.)
- Mode selection (Fast/Balanced/Thinking) with visible reasoning
- Real-time token tracking with cost estimation
- Tool execution visualization (collapsible displays)
- Artifact system (code preview, live HTML/React, version history)
- Conversation management (search, folders, pin/archive)
- Export system (Markdown, PDF, JSON, HTML)
- Temporary chat mode
- WCAG AA accessibility compliance

ARCHITECTURE:
- assistant-ui for base chat UX
- 6 Zustand stores for state management
- Message virtualization for performance
- Web workers for token calculation
- Backward compatible with existing services

TESTING:
- Unit tests (90%+ hook coverage, 85%+ service coverage)
- Integration tests for critical flows
- E2E tests with Playwright
- Accessibility tests with axe-core

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

2. **Push to Remote**
```bash
git push origin feat/modern-chat-interface
```

3. **Create Pull Request**
```bash
gh pr create --title "Modern Chat Interface - November 2025" --body "$(cat <<'EOF'
## Summary

Implements a world-class modern chat interface that rivals Claude.ai, ChatGPT, and Google Gemini based on comprehensive competitive analysis from November 2025.

## Features

### Core Interface
- ✅ Full-screen three-panel layout (sidebar + main + artifacts panel)
- ✅ Responsive design (mobile/tablet/desktop optimized)
- ✅ Model selection dropdown (8+ models from OpenAI, Anthropic, Google, Moonshot)
- ✅ Mode selection toggle (Fast/Balanced/Thinking)
- ✅ Real-time token usage tracking with cost estimation
- ✅ WCAG AA accessibility compliance

### Advanced Features
- ✅ Thinking mode visualization (step-by-step reasoning display)
- ✅ Tool execution display (collapsible with parameters & results)
- ✅ Artifact system (code preview, live rendering, version history)
- ✅ Conversation management (search, folders, pin/archive/delete)
- ✅ Export system (Markdown, PDF, JSON, HTML)
- ✅ Temporary chat mode (ephemeral conversations)
- ✅ Keyboard shortcuts (Ctrl+N, Ctrl+K, Ctrl+B, etc.)

### Performance
- ✅ Message virtualization (smooth with 1000+ messages)
- ✅ Streaming optimization (60fps)
- ✅ Web workers for token calculation
- ✅ Code splitting and lazy loading
- ✅ <2s initial load time

## Architecture

### New Components (60+ files)
- **Layout**: TopBar, BottomBar, LeftSidebar, RightPanel
- **Messages**: MessageList, AIMessage, UserMessage, StreamingMessage
- **Thinking**: ThinkingModeDisplay, ThinkingSteps, ProgressBar
- **Tools**: ToolExecutionDisplay, ToolHeader, ToolResult
- **Artifacts**: ArtifactViewer, CodePreview, LivePreview, VersionHistory
- **Input**: ChatInput, AttachmentControls, SendButton

### State Management
- **6 New Zustand Stores**:
  1. chat-interface-store (UI state)
  2. conversation-history-store (conversation list)
  3. message-processing-store (streaming, thinking mode)
  4. chat-configuration-store (model, mode settings)
  5. artifact-store (artifact management)
  6. mission-control-store (EXISTING - orchestration)

### Backward Compatibility
- ✅ All existing services preserved
- ✅ unified-llm-service.ts unchanged
- ✅ workforce-orchestrator.ts unchanged
- ✅ Supabase schema unchanged
- ✅ Hybrid approach: assistant-ui + custom Mission Control

## Testing

- ✅ Unit tests: 100+ tests (90% hook coverage, 85% service coverage)
- ✅ Integration tests: 20+ tests for critical flows
- ✅ E2E tests: 10+ Playwright tests
- ✅ Accessibility: axe-core audit passing
- ✅ Performance: Lighthouse score 90+

## Documentation

- ✅ README.md updated with new features
- ✅ CLAUDE.md updated with architecture
- ✅ CHAT_INTERFACE_DEVELOPER_GUIDE.md created
- ✅ All TypeScript interfaces documented
- ✅ Deployment guide included

## Migration Strategy

1. **Phase 1 (Week 1)**: Soft launch to beta users (feature flag)
2. **Phase 2 (Week 2)**: A/B test with 50% of users
3. **Phase 3 (Week 3)**: Full rollout to all users
4. **Rollback Plan**: Feature flag disable, existing interface still functional

## Breaking Changes

None. This is an additive feature with full backward compatibility.

## Screenshots

[Attach screenshots of key features]

## Checklist

- [x] Type-check passes (0 errors)
- [x] Lint passes (0 warnings)
- [x] Tests pass (90%+ coverage)
- [x] Accessibility audit passes
- [x] Performance benchmarks met
- [x] Documentation complete
- [x] Security audit complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

4. **Deploy to Staging**
```bash
# Netlify auto-deploys on PR creation
# Wait for deploy preview to complete
```

5. **Run Final Tests on Staging**
- [ ] Verify all features work on staging URL
- [ ] Test with real LLM providers
- [ ] Verify token tracking accuracy
- [ ] Test export functionality
- [ ] Mobile testing

6. **Get Approval & Merge**
```bash
# After PR approval
gh pr merge --squash
```

7. **Deploy to Production**
```bash
# Netlify auto-deploys on merge to main
# Monitor deployment logs
```

### Post-Deployment

- [ ] **Verification**
  - [ ] Check production URL loads correctly
  - [ ] Verify all features work
  - [ ] Check error tracking dashboard (Sentry)
  - [ ] Monitor token usage logs
  - [ ] Check rate limiting is working
  - [ ] Test authentication flows

- [ ] **Monitoring**
  - [ ] Set up alerts for errors
  - [ ] Monitor performance metrics
  - [ ] Track user adoption (analytics)
  - [ ] Monitor token usage costs
  - [ ] Watch for error spikes

- [ ] **Communication**
  - [ ] Announce feature to users
  - [ ] Update support documentation
  - [ ] Create video tutorial (optional)
  - [ ] Post changelog

### Rollback Plan

If critical issues arise:

```bash
# 1. Disable feature via feature flag (fastest)
# Set FEATURE_FLAG_MODERN_CHAT=false in Netlify env

# 2. Or revert deployment
git revert HEAD
git push origin main

# 3. Or rollback to previous deployment in Netlify UI
```

---

## 📝 FINAL NOTES

### Success Metrics

**Week 1:**
- [ ] 100% of beta users can access new interface
- [ ] <5 critical bugs reported
- [ ] 90%+ positive feedback

**Week 4:**
- [ ] 50%+ of users prefer new interface (A/B test)
- [ ] Average session time +20%
- [ ] Message throughput +30%

**Week 8:**
- [ ] 90%+ of users migrated to new interface
- [ ] <1% error rate
- [ ] Performance targets met

### Key Decisions Summary

1. **Use assistant-ui**: Production-ready, perfect tech stack alignment, 400k+ downloads
2. **Hybrid Approach**: assistant-ui for chat + custom Mission Control UI
3. **6 Zustand Stores**: Clean separation of concerns
4. **Backward Compatible**: All existing services preserved
5. **8-Week Timeline**: Realistic for high-quality implementation

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **assistant-ui breaking changes** | Pin to specific version, monitor changelog |
| **Performance issues** | Virtualization, web workers, lazy loading |
| **User confusion** | Gradual rollout, onboarding tooltips |
| **Token cost overruns** | Usage warnings at 85%/95%, cost caps |
| **Accessibility issues** | axe-core testing, screen reader testing |

### Next Steps After Launch

1. **User Feedback Collection** (Week 1-2)
2. **Bug Fixes & Polish** (Week 3-4)
3. **Performance Optimization** (Week 5-6)
4. **Feature Enhancements** (Week 7+)
   - Voice input/output
   - Screen sharing
   - Real-time collaboration
   - Custom themes

---

**This document serves as the single source of truth for the entire chat interface overhaul project. Refer to it whenever you need to continue implementation after interruptions or context loss.**

**Document Status:** ✅ READY FOR IMPLEMENTATION
**Last Updated:** November 13, 2025
**Version:** 1.0
**Approval:** Pending User Confirmation

---

**END OF MASTER IMPLEMENTATION PLAN**
