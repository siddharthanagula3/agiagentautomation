# VIBE - Multi-Agent Collaborative Interface

**Implementation Plan - Updated after Phase 1 Foundation**

---

## What's Already Done ✅

- ✅ Database schema (5 tables with RLS policies)
- ✅ TypeScript type definitions (messages, agents, tasks)
- ✅ Zustand stores (vibe-chat-store, vibe-agent-store)
- ✅ Directory structure under `src/features/vibe/`

## What's Left to Build

This document focuses on the remaining implementation work for the VIBE multi-agent interface.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Component Architecture](#component-architecture)
4. [Agent Selection Algorithm](#agent-selection-algorithm)
5. [Collaboration Protocol](#collaboration-protocol)
6. [Parallel Execution Engine](#parallel-execution-engine)
7. [Tool Integration System](#tool-integration-system)
8. [File System Integration](#file-system-integration)
9. [API Endpoints](#api-endpoints)
10. [Streaming Response Implementation](#streaming-response-implementation)
11. [Manual Employee Selection](#manual-employee-selection)
12. [Fallback Mechanism](#fallback-mechanism)
13. [Updated Implementation Roadmap](#updated-implementation-roadmap)

---

## Executive Summary

### Vision

The `/vibe` interface transforms AGI Agent Automation into a **MetaGPT-inspired multi-agent collaborative workspace** where AI employees work together through structured communication protocols.

### Core Requirements

1. **Hybrid Agent Selection**: Auto-select via keywords + semantic analysis, manual override with `#`
2. **Context-Aware Switching**: Auto-switch agents when user changes topic
3. **Role Identification**: Show employee role on every message
4. **Visual Feedback**: "thinking..." indicator, status badges, streaming responses
5. **Complexity Analysis**: Single agent for simple tasks, supervisor orchestration for complex projects
6. **Full Memory**: All agents access complete conversation history
7. **Minimal UI**: Only Dashboard link in sidebar
8. **File Integration**: `@` syntax for file/folder selection
9. **Hired Employees Only**: Only show employees purchased from marketplace
10. **Fallback**: Stateless API response if no matching employee exists

---

## Architecture Overview

### System Flow

```
User Input → Agent Router → [Single Agent | Supervisor Team] → Execution → Streaming Response
```

### Technology Stack

**Frontend**:
- React 18 with TypeScript
- Zustand (state management - ✅ stores created)
- Tailwind CSS + shadcn/ui components
- Framer Motion (animations)
- React Markdown (message rendering)

**Backend**:
- Netlify Functions (serverless)
- Supabase (database ✅ + realtime)
- Existing workforce orchestrator
- Unified LLM service

**Key Services to Build**:
1. `vibe-agent-router.ts` - 3-stage agent selection
2. `vibe-collaboration-protocol.ts` - Structured communication
3. `vibe-execution-coordinator.ts` - Parallel task execution
4. `vibe-message-pool.ts` - Global pub-sub system
5. `vibe-complexity-analyzer.ts` - Task complexity evaluation
6. `vibe-tool-orchestrator.ts` - Tool execution coordination
7. `vibe-file-manager.ts` - File upload/reference system
8. `vibe-streaming-handler.ts` - SSE streaming

---

## Component Architecture

### Directory Structure (What's Left to Build)

```
src/features/vibe/
├── pages/
│   └── VibeDashboard.tsx              # ⏳ Main /vibe route
│
├── components/
│   ├── layout/
│   │   ├── VibeSidebar.tsx            # ⏳ Minimal sidebar
│   │   └── VibeLayout.tsx             # ⏳ Layout wrapper
│   │
│   ├── chat/
│   │   ├── VibeChatCanvas.tsx         # ⏳ Main chat container
│   │   ├── VibeMessageList.tsx        # ⏳ Message list
│   │   ├── VibeMessage.tsx            # ⏳ Message bubble
│   │   ├── VibeMessageInput.tsx       # ⏳ Input with autocomplete
│   │   ├── VibeAgentAvatar.tsx        # ⏳ Agent avatar + badge
│   │   ├── VibeThinkingIndicator.tsx  # ⏳ Thinking animation
│   │   └── VibeStatusBar.tsx          # ⏳ Active agents status
│   │
│   ├── agents/
│   │   ├── AgentSelector.tsx          # ⏳ Manual selection (# trigger)
│   │   └── AgentStatusCard.tsx        # ⏳ Agent status display
│   │
│   └── files/
│       ├── FileSelector.tsx           # ⏳ File picker (@ trigger)
│       ├── FileUpload.tsx             # ⏳ Drag & drop
│       └── FilePreview.tsx            # ⏳ File preview
│
├── services/                          # ⏳ All services to build
├── hooks/                             # ⏳ All hooks to build
├── stores/                            # ✅ DONE
└── types/                             # ✅ DONE
```

---

## Agent Selection Algorithm

### Three-Stage Routing Process

**Implementation**: `src/features/vibe/services/vibe-agent-router.ts`

```typescript
export class VibeAgentRouter {
  /**
   * Main routing method - executes 3-stage process
   */
  async routeMessage(
    userMessage: string,
    conversationHistory: VibeMessage[],
    hiredEmployees: AIEmployee[]
  ): Promise<RoutingResult> {

    // STAGE 1: Fast keyword matching
    const keywordMatch = this.keywordMatch(userMessage, hiredEmployees);

    if (keywordMatch.confidence > 0.85) {
      // High confidence keyword match - skip semantic analysis
      return this.analyzeComplexity(
        userMessage,
        keywordMatch.employee,
        conversationHistory,
        hiredEmployees
      );
    }

    // STAGE 2: LLM-based semantic analysis
    const semanticMatch = await this.semanticMatch(
      userMessage,
      conversationHistory,
      hiredEmployees
    );

    // STAGE 3: Complexity evaluation
    return this.analyzeComplexity(
      userMessage,
      semanticMatch.employee,
      conversationHistory,
      hiredEmployees
    );
  }

  /**
   * Stage 1: Keyword Pattern Matching
   */
  private keywordMatch(
    userMessage: string,
    hiredEmployees: AIEmployee[]
  ): AgentMatch {
    const normalizedMessage = userMessage.toLowerCase();

    const keywordPatterns: Record<string, string[]> = {
      health: ['health', 'medical', 'healthcare', 'doctor', 'fitness'],
      email: ['email', 'message', 'reply', 'professional', 'compose'],
      code: ['code', 'programming', 'bug', 'debug', 'function', 'class'],
      design: ['design', 'ui', 'ux', 'interface', 'layout', 'figma'],
      data: ['data', 'analysis', 'sql', 'database', 'query', 'analytics'],
      marketing: ['marketing', 'seo', 'content', 'social media', 'campaign'],
      research: ['research', 'investigate', 'analyze', 'study', 'explore'],
    };

    let bestMatch: AgentMatch | null = null;
    let highestScore = 0;

    for (const employee of hiredEmployees) {
      const employeeKeywords = this.getEmployeeKeywords(employee);
      let matchScore = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of employeeKeywords) {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          matchScore += 1;
          matchedKeywords.push(keyword);
        }
      }

      const normalizedScore = matchScore / Math.max(employeeKeywords.length, 1);

      if (normalizedScore > highestScore) {
        highestScore = normalizedScore;
        bestMatch = {
          employee,
          confidence: normalizedScore,
          reasoning: `Matched keywords: ${matchedKeywords.join(', ')}`,
          matched_keywords: matchedKeywords,
        };
      }
    }

    return bestMatch || {
      employee: hiredEmployees[0],
      confidence: 0,
      reasoning: 'No keyword matches found',
    };
  }

  /**
   * Stage 2: Semantic Analysis using LLM
   */
  private async semanticMatch(
    userMessage: string,
    conversationHistory: VibeMessage[],
    hiredEmployees: AIEmployee[]
  ): Promise<AgentMatch> {
    const employeeDescriptions = hiredEmployees.map(emp =>
      `- ${emp.name}: ${emp.description}`
    ).join('\n');

    const recentContext = conversationHistory
      .slice(-5)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `You are an intelligent agent router. Select the best AI employee for this task.

**User's Message**: "${userMessage}"

**Recent Conversation**:
${recentContext || 'No previous context'}

**Available AI Employees**:
${employeeDescriptions}

Respond with ONLY this JSON:
{
  "selected_employee": "employee-name",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}`;

    const response = await unifiedLLMService.sendMessage([
      { role: 'user', content: prompt }
    ]);

    const result = JSON.parse(response.content);
    const selectedEmployee = hiredEmployees.find(
      emp => emp.name === result.selected_employee
    );

    return {
      employee: selectedEmployee || hiredEmployees[0],
      confidence: result.confidence,
      reasoning: result.reasoning,
    };
  }

  /**
   * Stage 3: Complexity Analysis
   */
  private async analyzeComplexity(
    userMessage: string,
    selectedEmployee: AIEmployee,
    conversationHistory: VibeMessage[],
    hiredEmployees: AIEmployee[]
  ): Promise<RoutingResult> {
    const prompt = `Analyze task complexity:

**Task**: "${userMessage}"

Classify as:
- **SIMPLE**: Single focused task, 1-3 steps (e.g., "Write an email")
- **COMPLEX**: Multiple tasks, 4+ steps (e.g., "Build a landing page")

Respond with JSON:
{
  "complexity": "SIMPLE" or "COMPLEX",
  "reasoning": "Brief explanation",
  "steps": number
}`;

    const response = await unifiedLLMService.sendMessage([
      { role: 'user', content: prompt }
    ]);

    const analysis = JSON.parse(response.content);

    if (analysis.complexity === 'SIMPLE') {
      return {
        mode: 'single',
        primaryAgent: selectedEmployee,
        confidence: 0.9,
        reasoning: analysis.reasoning,
      };
    } else {
      const supervisorPlan = await this.createSupervisorPlan(
        userMessage,
        analysis,
        hiredEmployees
      );

      return {
        mode: 'supervisor',
        supervisorPlan,
        confidence: 0.85,
        reasoning: analysis.reasoning,
      };
    }
  }
}
```

---

## Collaboration Protocol

### MetaGPT-Inspired Message Pool

**Implementation**: `src/features/vibe/services/vibe-collaboration-protocol.ts`

```typescript
/**
 * Message Pool - Global Pub-Sub System
 */
export class MessagePool extends EventEmitter {
  private messages: Map<string, VibeAgentMessage> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  private supabase = createClient();

  async publish(message: Omit<VibeAgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const fullMessage: VibeAgentMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.messages.set(fullMessage.id, fullMessage);
    await this.persistMessage(fullMessage);
    this.notifySubscribers(fullMessage);
    this.emit('message', fullMessage);
  }

  subscribe(agentName: string, messageTypes: AgentMessageType[]): void {
    if (!this.subscriptions.has(agentName)) {
      this.subscriptions.set(agentName, new Set());
    }

    messageTypes.forEach(type => {
      this.subscriptions.get(agentName)!.add(type);
    });
  }

  getMessagesFor(agentName: string, types?: AgentMessageType[]): VibeAgentMessage[] {
    return Array.from(this.messages.values()).filter(msg => {
      const isRecipient = msg.to_agents.includes(agentName) ||
                         msg.to_agents.includes('broadcast');
      const matchesType = !types || types.includes(msg.type);
      return isRecipient && matchesType;
    });
  }

  private async persistMessage(message: VibeAgentMessage): Promise<void> {
    await this.supabase.from('vibe_agent_messages').insert({
      id: message.id,
      session_id: message.session_id,
      type: message.type,
      from_agent: message.from_agent,
      to_agents: message.to_agents,
      timestamp: message.timestamp.toISOString(),
      content: message.content,
      metadata: message.metadata || {},
    });
  }

  private notifySubscribers(message: VibeAgentMessage): void {
    message.to_agents.forEach(agentName => {
      const subscriptions = this.subscriptions.get(agentName);
      if (subscriptions && subscriptions.has(message.type)) {
        this.emit(`message:${agentName}`, message);
      }
    });
  }
}
```

---

## Parallel Execution Engine

**Implementation**: `src/features/vibe/services/vibe-execution-coordinator.ts`

```typescript
/**
 * Coordinates parallel task execution with dependency management
 */
export class VibeExecutionCoordinator {
  private messagePool: MessagePool;

  async executePlan(
    plan: SupervisorPlan,
    sessionId: string
  ): Promise<Map<string, TaskResult>> {
    const results = new Map<string, TaskResult>();

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(plan.tasks);

    // Topological sort to get execution levels
    const executionLevels = this.topologicalSort(dependencyGraph);

    // Execute each level (tasks in same level run in parallel)
    for (const level of executionLevels) {
      const levelPromises = level.map(task =>
        this.executeTask(task, sessionId, results)
      );

      const levelResults = await Promise.allSettled(levelPromises);

      levelResults.forEach((result, index) => {
        const task = level[index];
        if (result.status === 'fulfilled') {
          results.set(task.id, result.value);
        } else {
          results.set(task.id, {
            task_id: task.id,
            status: 'failed',
            error: result.reason,
          });
        }
      });
    }

    return results;
  }

  private buildDependencyGraph(tasks: TaskAssignment[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    tasks.forEach(task => graph.set(task.id, new Set(task.dependencies)));
    return graph;
  }

  private topologicalSort(graph: Map<string, Set<string>>): string[][] {
    const levels: string[][] = [];
    const completed = new Set<string>();

    while (completed.size < graph.size) {
      const currentLevel: string[] = [];

      for (const [taskId, dependencies] of graph.entries()) {
        if (completed.has(taskId)) continue;

        const allDepsCompleted = Array.from(dependencies).every(dep =>
          completed.has(dep)
        );

        if (allDepsCompleted) {
          currentLevel.push(taskId);
        }
      }

      if (currentLevel.length === 0) {
        throw new Error('Circular dependency detected');
      }

      levels.push(currentLevel);
      currentLevel.forEach(id => completed.add(id));
    }

    return levels;
  }

  private async executeTask(
    task: TaskAssignment,
    sessionId: string,
    previousResults: Map<string, TaskResult>
  ): Promise<TaskResult> {
    await this.messagePool.publish({
      session_id: sessionId,
      type: 'task_assignment',
      from_agent: 'supervisor',
      to_agents: [task.assigned_to.name],
      content: {
        task: {
          id: task.id,
          description: task.description,
          requirements: task.dependencies.map(depId => {
            const result = previousResults.get(depId);
            return result?.output;
          }),
        },
      },
    });

    return await this.waitForTaskCompletion(task.id, sessionId);
  }

  private async waitForTaskCompletion(
    taskId: string,
    sessionId: string,
    timeout: number = 60000
  ): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out`));
      }, timeout);

      const checkCompletion = async () => {
        const { data } = await this.supabase
          .from('vibe_tasks')
          .select('*')
          .eq('id', taskId)
          .single();

        if (data && (data.status === 'completed' || data.status === 'failed')) {
          clearTimeout(timer);
          resolve({
            task_id: taskId,
            status: data.status,
            output: data.result,
            error: data.error,
          });
        } else {
          setTimeout(checkCompletion, 1000);
        }
      };

      checkCompletion();
    });
  }
}
```

---

## Tool Integration System

**Implementation**: `src/features/vibe/services/vibe-tool-orchestrator.ts`

```typescript
/**
 * Orchestrates tool execution for agents
 */
export class VibeToolOrchestrator {
  async executeTool(
    toolName: string,
    parameters: Record<string, any>,
    context: {
      sessionId: string;
      employeeName: string;
    }
  ): Promise<any> {
    const toolResult = await toolExecutionEngine.execute(toolName, parameters);

    await this.logToolExecution(context, toolName, parameters, toolResult);

    return toolResult;
  }

  private async logToolExecution(
    context: any,
    toolName: string,
    parameters: any,
    result: any
  ): Promise<void> {
    await messagePool.publish({
      session_id: context.sessionId,
      type: 'resource_request',
      from_agent: context.employeeName,
      to_agents: ['system'],
      content: {
        resource: {
          type: 'tool',
          description: `Executed ${toolName}`,
          required: true,
        },
        parameters,
        result,
      },
    });
  }
}
```

---

## File System Integration

**Implementation**: `src/features/vibe/services/vibe-file-manager.ts`

```typescript
/**
 * Manages file uploads and references
 */
export class VibeFileManager {
  private supabase = createClient();

  async uploadFile(file: File, sessionId: string, userId: string): Promise<string> {
    const fileName = `${sessionId}/${Date.now()}_${file.name}`;

    const { data, error } = await this.supabase.storage
      .from('vibe-files')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = this.supabase.storage
      .from('vibe-files')
      .getPublicUrl(fileName);

    await this.supabase.from('vibe_files').insert({
      session_id: sessionId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: urlData.publicUrl,
      uploaded_by: userId,
    });

    return urlData.publicUrl;
  }

  async getSessionFiles(sessionId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('vibe_files')
      .select('*')
      .eq('session_id', sessionId)
      .order('uploaded_at', { ascending: false });

    return data || [];
  }

  async deleteFile(fileId: string): Promise<void> {
    const { data: file } = await this.supabase
      .from('vibe_files')
      .select('url')
      .eq('id', fileId)
      .single();

    if (file) {
      const path = file.url.split('/vibe-files/')[1];
      await this.supabase.storage.from('vibe-files').remove([path]);
      await this.supabase.from('vibe_files').delete().eq('id', fileId);
    }
  }
}
```

---

## API Endpoints

### Netlify Functions to Create

#### 1. `/vibe-chat` - Main chat endpoint

**File**: `netlify/functions/vibe-chat.ts`

```typescript
export async function handler(event: any) {
  const { message, sessionId, userId, selectedAgent } = JSON.parse(event.body);

  const router = new VibeAgentRouter();
  const routing = await router.routeMessage(message, history, hiredEmployees);

  if (routing.mode === 'single') {
    return streamSingleAgentResponse(routing.primaryAgent, message);
  } else {
    return streamSupervisorResponse(routing.supervisorPlan, message);
  }
}
```

#### 2. `/vibe-file-upload` - File upload

```typescript
export async function handler(event: any) {
  // Handle multipart form data
  // Upload to Supabase Storage
  // Return file URL
}
```

#### 3. `/vibe-stream` - SSE streaming

```typescript
export async function handler(event: any) {
  // Set up SSE headers
  // Stream token-by-token
}
```

---

## Streaming Response Implementation

**Implementation**: `src/features/vibe/services/vibe-streaming-handler.ts`

```typescript
/**
 * Handles Server-Sent Events streaming
 */
export class VibeStreamingHandler {
  async streamResponse(
    agentResponse: AsyncIterable<string>,
    onToken: (token: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      for await (const token of agentResponse) {
        onToken(token);
      }
      onComplete();
    } catch (error) {
      onError(error as Error);
    }
  }

  useStreamingResponse(endpoint: string, body: any) {
    const [content, setContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    const startStream = async () => {
      setIsStreaming(true);
      setContent('');

      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setContent(prev => prev + chunk);
      }

      setIsStreaming(false);
    };

    return { content, isStreaming, startStream };
  }
}
```

---

## Manual Employee Selection

### `#` Autocomplete Implementation

**Component**: `src/features/vibe/components/chat/VibeMessageInput.tsx`

```tsx
const VibeMessageInput: React.FC = () => {
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [agentQuery, setAgentQuery] = useState('');

  const handleInputChange = (value: string) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const match = textBeforeCursor.match(/#(\w*)$/);

    if (match) {
      setAgentQuery(match[1]);
      setShowAgentSelector(true);
    } else {
      setShowAgentSelector(false);
    }
  };

  const handleAgentSelect = (agent: AIEmployee) => {
    const newValue = input.replace(/#\w*$/, `@${agent.name} `);
    setInput(newValue);
    setSelectedAgent(agent.id);
    setShowAgentSelector(false);
  };

  return (
    <div className="relative">
      <Textarea value={input} onChange={handleInputChange} />

      {showAgentSelector && (
        <Popover>
          <AgentSelector
            query={agentQuery}
            employees={hiredEmployees}
            onSelect={handleAgentSelect}
          />
        </Popover>
      )}
    </div>
  );
};
```

---

## Fallback Mechanism

**Implementation**: `src/features/vibe/services/vibe-agent-router.ts`

```typescript
async function handleFallback(
  userMessage: string,
  conversationHistory: VibeMessage[]
): Promise<string> {
  const hiredEmployees = await getHiredEmployees(userId);

  if (hiredEmployees.length === 0) {
    return await unifiedLLMService.sendMessage([
      { role: 'user', content: userMessage }
    ]);
  }

  return `I don't have a specialist for this task. Would you like to hire a relevant employee?

[Browse Marketplace](/marketplace)`;
}
```

---

## Updated Implementation Roadmap

### ✅ Phase 1: Foundation (COMPLETED)
- Database schema migration
- TypeScript type definitions
- Zustand stores (chat, agent)
- Directory structure

### ⏳ Phase 2: Core Services (Week 2-4)
- [ ] `vibe-agent-router.ts` - 3-stage routing
- [ ] `vibe-complexity-analyzer.ts` - Task analysis
- [ ] `vibe-collaboration-protocol.ts` - Message pool
- [ ] `vibe-file-manager.ts` - File handling
- [ ] `vibe-tool-orchestrator.ts` - Tool execution

### ⏳ Phase 3: UI Components (Week 4-6)
- [ ] VibeDashboard page
- [ ] VibeSidebar (minimal)
- [ ] VibeChatCanvas
- [ ] VibeMessage with streaming
- [ ] VibeMessageInput with autocomplete
- [ ] Agent and file selectors

### ⏳ Phase 4: Execution & Streaming (Week 6-8)
- [ ] `vibe-execution-coordinator.ts` - Parallel execution
- [ ] `vibe-streaming-handler.ts` - SSE streaming
- [ ] Netlify functions (chat, upload, stream)
- [ ] Real-time status updates

### ⏳ Phase 5: Integration & Testing (Week 8-10)
- [ ] Connect to existing workforce orchestrator
- [ ] Integrate with Supabase realtime
- [ ] E2E testing
- [ ] Performance optimization

### ⏳ Phase 6: Polish & Launch (Week 10-12)
- [ ] Animations and transitions
- [ ] Error handling
- [ ] Documentation
- [ ] User onboarding
- [ ] Production deployment

---

## Next Steps

1. **Review this plan** and confirm approach
2. **Start Phase 2**: Begin with `vibe-agent-router.ts`
3. **Iterate**: Build, test, refine each service
4. **Integrate**: Connect to existing systems
5. **Deploy**: Launch VIBE interface

**Total Estimated Time**: 10-12 weeks for full implementation
