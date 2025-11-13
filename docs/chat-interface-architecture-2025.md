# Modern Chat Interface Architecture - 2025 Specification

## Executive Summary

This document outlines a comprehensive modern chat interface architecture incorporating best practices from Claude.ai, ChatGPT, Grok, and Gemini, optimized for the AGI Agent Automation Platform.

## Table of Contents

1. [Layout Structure](#layout-structure)
2. [Component Architecture](#component-architecture)
3. [State Management](#state-management)
4. [Feature Specifications](#feature-specifications)
5. [TypeScript Interfaces](#typescript-interfaces)
6. [File Structure](#file-structure)
7. [Responsive Design](#responsive-design)
8. [Performance Optimizations](#performance-optimizations)
9. [Accessibility](#accessibility)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Layout Structure

### Full-Screen Layout (Inspired by Claude.ai + ChatGPT)

```
┌─────────────────────────────────────────────────────────────────┐
│  Top Bar: [Model] [Mode] [Token Usage] [Settings] [Dashboard]  │
├──────┬──────────────────────────────────────────────┬───────────┤
│      │                                              │           │
│ Left │           Main Chat Area                     │   Right   │
│ Side │                                              │   Panel   │
│ bar  │  ┌────────────────────────────────────┐     │ (Optional)│
│      │  │                                    │     │           │
│ Conv │  │     Message History                │     │ • Tools   │
│ List │  │     (Auto-scroll)                  │     │ • Artifacts│
│      │  │                                    │     │ • Context │
│ • New│  │  ┌──────────────────────────┐     │     │ • Settings│
│ • His│  │  │ User Message             │     │     │           │
│ • Sea│  │  └──────────────────────────┘     │     │           │
│ • Fol│  │                                    │     │           │
│ • Fil│  │  ┌──────────────────────────┐     │     │           │
│      │  │  │ AI Response              │     │     │           │
│      │  │  │ [Thinking Mode Display]  │     │     │           │
│      │  │  │ [Tool Execution]         │     │     │           │
│      │  │  └──────────────────────────┘     │     │           │
│      │  │                                    │     │           │
│      │  └────────────────────────────────────┘     │           │
│      │                                              │           │
│      │  ┌────────────────────────────────────┐     │           │
│      │  │ Input Field                        │     │           │
│      │  │ [Attach] [Voice] [Send] [Stop]     │     │           │
│      │  └────────────────────────────────────┘     │           │
├──────┴──────────────────────────────────────────────┴───────────┤
│  Bottom Bar: Status • Model Info • Token Count • Typing         │
└─────────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

- **Mobile (< 768px)**: Single column, collapsible sidebars as overlays
- **Tablet (768px - 1024px)**: Left sidebar + main area, right panel hidden by default
- **Desktop (> 1024px)**: Full three-column layout with all panels visible

---

## Component Architecture

### Component Hierarchy

```
ModernChatInterface
├── TopBar
│   ├── ModelSelector
│   ├── ModeSelector
│   ├── TokenUsageDisplay
│   ├── TemporaryChatToggle
│   └── NavigationActions
├── LeftSidebar (Collapsible)
│   ├── ConversationList
│   │   ├── NewChatButton
│   │   ├── SearchConversations
│   │   ├── ConversationItem (repeated)
│   │   └── FilterControls
│   └── UserProfile
├── MainChatArea
│   ├── MessageList
│   │   ├── WelcomeScreen (empty state)
│   │   ├── MessageGroup (repeated)
│   │   │   ├── UserMessage
│   │   │   │   ├── MessageContent
│   │   │   │   ├── AttachmentPreview
│   │   │   │   └── MessageActions
│   │   │   └── AIMessage
│   │   │       ├── ThinkingModeDisplay
│   │   │       │   ├── ThinkingProgressIndicator
│   │   │       │   └── ThinkingSteps
│   │   │       ├── MessageContent
│   │   │       │   ├── MarkdownRenderer
│   │   │       │   ├── CodeBlock
│   │   │       │   └── InlineArtifact
│   │   │       ├── ToolExecutionDisplay
│   │   │       │   ├── ToolHeader (collapsible)
│   │   │       │   ├── ToolParameters
│   │   │       │   ├── ToolResult
│   │   │       │   └── ExecutionTimeline
│   │   │       └── MessageActions
│   │   │           ├── CopyButton
│   │   │           ├── RegenerateButton
│   │   │           ├── EditButton
│   │   │           └── ExportButton
│   │   └── StreamingMessage
│   │       ├── StreamingCursor
│   │       └── TokenCounter
│   └── ChatInput
│       ├── InputField (auto-resize)
│       ├── AttachmentControls
│       │   ├── FileUpload
│       │   ├── ImageUpload
│       │   └── VoiceInput
│       ├── ActionButtons
│       │   ├── SendButton
│       │   └── StopButton
│       └── InputSuggestions (context-aware)
├── RightPanel (Optional, Collapsible)
│   ├── TabNavigation
│   │   ├── ArtifactsTab
│   │   ├── ToolsTab
│   │   ├── ContextTab
│   │   └── SettingsTab
│   ├── ArtifactViewer
│   │   ├── CodePreview
│   │   ├── ImagePreview
│   │   ├── DocumentPreview
│   │   └── DataVisualization
│   ├── ActiveToolsPanel
│   │   └── ToolCard (repeated)
│   ├── ContextManager
│   │   ├── ActiveFiles
│   │   └── RelevantDocuments
│   └── QuickSettings
│       ├── TemperatureSlider
│       ├── MaxTokensInput
│       └── SystemPromptEditor
└── BottomBar
    ├── StatusIndicator
    ├── ModelInfo
    ├── TokenCountDisplay
    └── TypingIndicator
```

### Component Responsibility Matrix

| Component | Responsibilities | State | Side Effects |
|-----------|-----------------|-------|--------------|
| **TopBar** | Navigation, model/mode selection | Local UI state | None |
| **ModelSelector** | Display available models, handle selection | Local selection | Update chat config |
| **ModeSelector** | Toggle Fast/Balanced/Thinking modes | Local selection | Update message processing |
| **TokenUsageDisplay** | Show real-time token consumption | Subscribes to token store | None |
| **LeftSidebar** | Conversation history management | Subscribes to chat store | Load conversations |
| **ConversationList** | Display, search, filter conversations | Local filters | Fetch conversations |
| **MainChatArea** | Message display and input orchestration | Subscribes to message store | Scroll management |
| **MessageList** | Render messages with virtualization | Computed from store | Auto-scroll, lazy load |
| **AIMessage** | Display AI responses with tools/artifacts | Individual message state | None |
| **ThinkingModeDisplay** | Visualize reasoning process | Thinking steps state | Animate progress |
| **ToolExecutionDisplay** | Show tool calls and results | Tool execution state | Collapsible state |
| **ChatInput** | Handle user input and attachments | Local input state | Submit messages |
| **RightPanel** | Display artifacts, tools, context | Active tab state | None |
| **ArtifactViewer** | Render code, images, documents | Current artifact | Syntax highlighting |

---

## State Management

### Store Architecture (Zustand)

```typescript
// Primary Stores

1. chat-interface-store.ts
   - Current conversation state
   - Active message stream
   - Input field state
   - UI state (sidebars, panels)

2. conversation-history-store.ts
   - All user conversations
   - Search/filter state
   - Folder organization

3. message-processing-store.ts
   - Message queue
   - Streaming state
   - Thinking mode steps
   - Tool execution tracking

4. chat-configuration-store.ts
   - Selected model
   - Selected mode
   - Temperature, max tokens
   - System prompt

5. artifact-store.ts
   - Generated artifacts
   - Active artifact
   - Artifact history
```

### State Management Strategy

**Principles:**
1. **Separation of Concerns**: Each store handles a distinct domain
2. **Computed Values**: Derive state instead of duplicating
3. **Selective Subscriptions**: Components subscribe only to needed slices
4. **Immutable Updates**: Use Immer middleware for safe mutations
5. **Persistence**: Auto-save conversation state to Supabase

**Store Dependencies:**
```
chat-configuration-store (independent)
    ↓
message-processing-store (depends on config)
    ↓
chat-interface-store (orchestrates all)
    ↓
conversation-history-store (persists to DB)
```

---

## Feature Specifications

### 1. Model Selection

**UI Component**: Dropdown in top bar

**Available Models**:
- OpenAI: GPT-4o, GPT-4o-mini, o1-preview, o1-mini
- Anthropic: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- Google: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini 2.0 Flash
- Perplexity: Sonar Pro, Sonar

**Features**:
- Model capabilities badge (context window, multimodal, speed)
- Cost per million tokens display
- Availability indicator (green/yellow/red)
- Model switching mid-conversation with context preservation
- Default model preference saved per user

**Implementation**:
```typescript
interface ModelOption {
  id: string;
  provider: LLMProvider;
  name: string;
  displayName: string;
  contextWindow: number;
  capabilities: ModelCapability[];
  costPerMillionTokens: { input: number; output: number };
  available: boolean;
}
```

### 2. Mode Selection

**UI Component**: Toggle group in top bar

**Available Modes**:
- **Fast Mode**: Optimized for speed, minimal processing
- **Balanced Mode**: Default, balances quality and speed
- **Thinking Mode**: Extended reasoning, shows thought process

**Features**:
- Visual indicator in messages (badge)
- Mode-specific UI changes (thinking progress bar)
- Auto-mode suggestion based on query complexity
- Keyboard shortcut: Ctrl+Shift+M to toggle

**Thinking Mode Visualization**:
```
┌─────────────────────────────────────┐
│ Thinking... (Step 2 of 5)          │
│ ████████████░░░░░░░░░░░░░ 45%      │
│                                     │
│ Current step:                       │
│ "Analyzing user requirements..."    │
│                                     │
│ [Show detailed reasoning ▼]         │
└─────────────────────────────────────┘
```

### 3. Real-time Token Usage Display

**UI Component**: Live counter in top bar and bottom bar

**Metrics**:
- Input tokens (current message)
- Output tokens (AI response)
- Total session tokens
- Estimated cost (real-time)
- Remaining credits (if applicable)

**Visual Design**:
```
Tokens: 1,234 / 50,000  Cost: $0.05  |  Credits: 950 remaining
████████████████████████████████░░░░░░░ 82%
```

**Implementation**:
- Subscribe to `token-usage-tracker` service
- Update in real-time during streaming
- Persist to database on message completion
- Alert when approaching limit (90%)

### 4. Tool Execution Display

**UI Component**: Collapsible accordion within AI messages

**Features**:
- Tool name with icon
- Parameters passed (JSON formatted)
- Execution status (pending, running, completed, failed)
- Execution time
- Result preview
- Expand/collapse for detailed view

**Visual Design**:
```
┌─────────────────────────────────────────┐
│ 🔧 Web Search                      ▼    │
│ Status: Completed in 2.3s               │
├─────────────────────────────────────────┤
│ Parameters:                             │
│ {                                       │
│   "query": "latest React 19 features",  │
│   "num_results": 5                      │
│ }                                       │
├─────────────────────────────────────────┤
│ Results: 5 sources found                │
│ [View detailed results ▶]               │
└─────────────────────────────────────────┘
```

**Implementation**:
- Track tool calls via `tool-execution-engine`
- Stream tool status updates
- Store tool results in message metadata
- Support nested tool calls (recursive)

### 5. Artifact/Code Preview Panel

**UI Component**: Right panel with tabbed interface

**Artifact Types**:
- Code blocks (with syntax highlighting)
- HTML/React components (live preview)
- Images (generated or uploaded)
- Documents (Markdown, PDF preview)
- Data visualizations (charts, graphs)
- JSON/YAML data structures

**Features**:
- Live code preview with hot reload
- Copy to clipboard button
- Download artifact
- Edit in place (for code)
- Full-screen mode
- Version history (compare changes)

**Code Preview Layout**:
```
┌─────────────────────────────────────────┐
│ [Code] [Preview] [Console]        [⤢]  │
├─────────────────────────────────────────┤
│                                         │
│  1  import React from 'react';         │
│  2  export default function Button() { │
│  3    return (                          │
│  4      <button className="primary">    │
│  5        Click me                      │
│  6      </button>                       │
│  7    );                                │
│  8  }                                   │
│                                         │
├─────────────────────────────────────────┤
│ [Copy] [Download] [Edit] [Full Screen] │
└─────────────────────────────────────────┘
```

### 6. Conversation Export

**UI Component**: Export button in conversation menu

**Export Formats**:
- Markdown (.md)
- PDF (formatted)
- JSON (structured data)
- HTML (standalone page)
- Plain text (.txt)

**Export Options**:
- Include/exclude thinking process
- Include/exclude tool executions
- Include/exclude artifacts
- Date range selection
- Message filtering

**Implementation**:
```typescript
interface ExportOptions {
  format: 'markdown' | 'pdf' | 'json' | 'html' | 'text';
  includeThinking: boolean;
  includeTools: boolean;
  includeArtifacts: boolean;
  dateRange?: { start: Date; end: Date };
  messageFilter?: (message: Message) => boolean;
}
```

### 7. Search Within Conversation

**UI Component**: Search bar in left sidebar

**Features**:
- Full-text search across all messages
- Filter by date range
- Filter by message type (user/AI)
- Filter by tool usage
- Highlight search results in main chat
- Jump to message (scroll to)
- Regular expression support
- Search history

**Search UI**:
```
┌─────────────────────────────────────────┐
│ 🔍 Search conversations...              │
│                                         │
│ Filters: [Date ▼] [Type ▼] [Tools ▼]   │
├─────────────────────────────────────────┤
│ 3 results in 2 conversations            │
│                                         │
│ • Conversation 1 (2 results)            │
│   "...highlighted search term..."       │
│   "...another match..."                 │
│                                         │
│ • Conversation 2 (1 result)             │
│   "...found here..."                    │
└─────────────────────────────────────────┘
```

### 8. Temporary Chat Mode

**UI Component**: Toggle in top bar

**Features**:
- Not saved to history
- No database persistence
- Cleared on browser close
- Warning when exiting
- Option to save before closing
- Visual indicator (incognito icon)

**Implementation**:
- Use session storage instead of database
- Skip `chat-history-persistence` service
- Disable auto-save
- Show badge in top bar: "🕵️ Temporary Chat"

---

## TypeScript Interfaces

### Core Interfaces

```typescript
// ============================================================================
// CHAT CONFIGURATION
// ============================================================================

interface ChatConfiguration {
  model: ModelOption;
  mode: ChatMode;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  tools: ToolDefinition[];
}

type ChatMode = 'fast' | 'balanced' | 'thinking';

interface ModelOption {
  id: string;
  provider: LLMProvider;
  name: string;
  displayName: string;
  contextWindow: number;
  capabilities: ModelCapability[];
  costPerMillionTokens: { input: number; output: number };
  available: boolean;
  isDefault?: boolean;
}

type ModelCapability =
  | 'text'
  | 'vision'
  | 'audio'
  | 'tool-use'
  | 'thinking'
  | 'code-execution';

type LLMProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

// ============================================================================
// MESSAGES
// ============================================================================

interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: MessageContent;
  metadata: MessageMetadata;
  createdAt: Date;
  updatedAt?: Date;
}

type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

interface MessageContent {
  text?: string;
  attachments?: Attachment[];
  artifacts?: Artifact[];
  toolCalls?: ToolCall[];
  thinkingProcess?: ThinkingStep[];
}

interface MessageMetadata {
  model: string;
  mode: ChatMode;
  tokenUsage: TokenUsage;
  processingTime: number;
  regenerationCount: number;
  editHistory?: MessageEdit[];
}

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface MessageEdit {
  timestamp: Date;
  previousContent: string;
  reason: string;
}

// ============================================================================
// ATTACHMENTS
// ============================================================================

interface Attachment {
  id: string;
  type: AttachmentType;
  name: string;
  size: number;
  url: string;
  mimeType: string;
  uploadedAt: Date;
}

type AttachmentType = 'image' | 'document' | 'audio' | 'video' | 'file';

// ============================================================================
// ARTIFACTS
// ============================================================================

interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  language?: string;
  metadata: ArtifactMetadata;
  createdAt: Date;
  updatedAt?: Date;
}

type ArtifactType =
  | 'code'
  | 'html'
  | 'react-component'
  | 'markdown'
  | 'json'
  | 'image'
  | 'chart'
  | 'document';

interface ArtifactMetadata {
  framework?: string;
  dependencies?: string[];
  previewUrl?: string;
  downloadUrl?: string;
  version: number;
  versionHistory?: ArtifactVersion[];
}

interface ArtifactVersion {
  version: number;
  content: string;
  timestamp: Date;
  changes: string;
}

// ============================================================================
// TOOL EXECUTION
// ============================================================================

interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, unknown>;
  status: ToolExecutionStatus;
  result?: ToolResult;
  error?: ToolError;
  executionTime?: number;
  startedAt: Date;
  completedAt?: Date;
}

type ToolExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

interface ToolResult {
  output: unknown;
  metadata?: Record<string, unknown>;
}

interface ToolError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  icon?: string;
}

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
}

// ============================================================================
// THINKING MODE
// ============================================================================

interface ThinkingStep {
  id: string;
  step: number;
  totalSteps: number;
  description: string;
  reasoning?: string;
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
}

interface ThinkingModeState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  steps: ThinkingStep[];
  overallProgress: number;
}

// ============================================================================
// CONVERSATIONS
// ============================================================================

interface Conversation {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  messages: Message[];
  configuration: ChatConfiguration;
  metadata: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationMetadata {
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  lastMessageAt: Date;
  isPinned: boolean;
  isTemporary: boolean;
  folder?: string;
  tags?: string[];
}

// ============================================================================
// UI STATE
// ============================================================================

interface ChatInterfaceState {
  // Sidebar state
  leftSidebarOpen: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: RightPanelTab;

  // Current conversation
  currentConversationId: string | null;

  // Input state
  inputValue: string;
  isComposing: boolean;
  attachments: Attachment[];

  // Streaming state
  isStreaming: boolean;
  streamingMessageId: string | null;

  // UI state
  isThinkingModeActive: boolean;
  activeToolCalls: ToolCall[];

  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
}

type RightPanelTab = 'artifacts' | 'tools' | 'context' | 'settings';

interface SearchResult {
  conversationId: string;
  messageId: string;
  snippet: string;
  relevanceScore: number;
}

// ============================================================================
// PROPS INTERFACES
// ============================================================================

interface TopBarProps {
  currentModel: ModelOption;
  currentMode: ChatMode;
  tokenUsage: TokenUsage;
  isTemporary: boolean;
  onModelChange: (model: ModelOption) => void;
  onModeChange: (mode: ChatMode) => void;
  onTemporaryToggle: () => void;
  onSettingsClick: () => void;
  onDashboardClick: () => void;
}

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent?: string;
  onRegenerateMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onCopyMessage: (messageId: string) => void;
}

interface AIMessageProps {
  message: Message;
  isStreaming: boolean;
  showThinkingProcess: boolean;
  showToolExecutions: boolean;
  onRegenerateMessage: (messageId: string) => void;
  onCopyMessage: (messageId: string) => void;
}

interface ChatInputProps {
  value: string;
  attachments: Attachment[];
  isStreaming: boolean;
  placeholder?: string;
  onValueChange: (value: string) => void;
  onAttachmentAdd: (file: File) => void;
  onAttachmentRemove: (attachmentId: string) => void;
  onSubmit: () => void;
  onStop: () => void;
}

interface ArtifactViewerProps {
  artifact: Artifact;
  isFullScreen: boolean;
  onEdit?: (content: string) => void;
  onDownload: () => void;
  onFullScreenToggle: () => void;
  onVersionChange?: (version: number) => void;
}

interface ToolExecutionDisplayProps {
  toolCall: ToolCall;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  searchQuery: string;
  onConversationSelect: (id: string) => void;
  onConversationDelete: (id: string) => void;
  onNewConversation: () => void;
  onSearchChange: (query: string) => void;
}
```

---

## File Structure

```
src/
└── features/
    └── chat-interface/
        ├── pages/
        │   └── ModernChatInterface.tsx          # Main full-screen page
        │
        ├── components/
        │   ├── layout/
        │   │   ├── TopBar.tsx                    # Top navigation bar
        │   │   ├── BottomBar.tsx                 # Status bar
        │   │   ├── LeftSidebar.tsx               # Conversation history
        │   │   └── RightPanel.tsx                # Artifacts/tools panel
        │   │
        │   ├── conversation/
        │   │   ├── ConversationList.tsx          # List of conversations
        │   │   ├── ConversationItem.tsx          # Individual conversation
        │   │   ├── NewChatButton.tsx             # Create new chat
        │   │   └── SearchConversations.tsx       # Search interface
        │   │
        │   ├── messages/
        │   │   ├── MessageList.tsx               # Message container with virtualization
        │   │   ├── MessageGroup.tsx              # Group of related messages
        │   │   ├── UserMessage.tsx               # User message component
        │   │   ├── AIMessage.tsx                 # AI response component
        │   │   ├── StreamingMessage.tsx          # Streaming indicator
        │   │   ├── MessageContent.tsx            # Content renderer
        │   │   ├── MessageActions.tsx            # Action buttons
        │   │   └── WelcomeScreen.tsx             # Empty state
        │   │
        │   ├── thinking/
        │   │   ├── ThinkingModeDisplay.tsx       # Thinking process container
        │   │   ├── ThinkingProgressBar.tsx       # Progress indicator
        │   │   ├── ThinkingSteps.tsx             # Step-by-step display
        │   │   └── ThinkingStepItem.tsx          # Individual step
        │   │
        │   ├── tools/
        │   │   ├── ToolExecutionDisplay.tsx      # Tool execution container
        │   │   ├── ToolHeader.tsx                # Tool name and status
        │   │   ├── ToolParameters.tsx            # Parameter display
        │   │   ├── ToolResult.tsx                # Result display
        │   │   └── ExecutionTimeline.tsx         # Timeline view
        │   │
        │   ├── artifacts/
        │   │   ├── ArtifactViewer.tsx            # Main artifact viewer
        │   │   ├── CodePreview.tsx               # Code display
        │   │   ├── LivePreview.tsx               # HTML/React preview
        │   │   ├── ImagePreview.tsx              # Image display
        │   │   ├── DocumentPreview.tsx           # Document viewer
        │   │   ├── DataVisualization.tsx         # Charts/graphs
        │   │   └── ArtifactVersionHistory.tsx    # Version control
        │   │
        │   ├── input/
        │   │   ├── ChatInput.tsx                 # Main input component
        │   │   ├── InputField.tsx                # Auto-resize textarea
        │   │   ├── AttachmentControls.tsx        # Attachment buttons
        │   │   ├── AttachmentPreview.tsx         # Attached file preview
        │   │   ├── VoiceInput.tsx                # Voice recording
        │   │   ├── SendButton.tsx                # Submit button
        │   │   ├── StopButton.tsx                # Stop generation
        │   │   └── InputSuggestions.tsx          # Contextual suggestions
        │   │
        │   ├── selectors/
        │   │   ├── ModelSelector.tsx             # Model dropdown
        │   │   ├── ModeSelector.tsx              # Mode toggle
        │   │   └── ModelCapabilityBadge.tsx      # Model features badge
        │   │
        │   ├── display/
        │   │   ├── TokenUsageDisplay.tsx         # Real-time token counter
        │   │   ├── TypingIndicator.tsx           # "AI is typing..."
        │   │   ├── StatusIndicator.tsx           # Connection status
        │   │   └── CostEstimator.tsx             # Cost display
        │   │
        │   ├── export/
        │   │   ├── ExportDialog.tsx              # Export modal
        │   │   ├── ExportFormatSelector.tsx      # Format options
        │   │   └── ExportProgress.tsx            # Export progress
        │   │
        │   └── shared/
        │       ├── CollapsibleSection.tsx        # Reusable collapsible
        │       ├── MarkdownRenderer.tsx          # Markdown display
        │       ├── CodeBlock.tsx                 # Syntax-highlighted code
        │       ├── ScrollToBottom.tsx            # Auto-scroll button
        │       └── LoadingSpinner.tsx            # Loading indicator
        │
        ├── hooks/
        │   ├── use-chat-interface.ts             # Main chat logic
        │   ├── use-message-streaming.ts          # Streaming handler
        │   ├── use-thinking-mode.ts              # Thinking mode logic
        │   ├── use-tool-execution.ts             # Tool execution tracking
        │   ├── use-artifact-management.ts        # Artifact CRUD
        │   ├── use-conversation-search.ts        # Search logic
        │   ├── use-conversation-export.ts        # Export logic
        │   ├── use-token-tracking.ts             # Token usage tracking
        │   ├── use-auto-scroll.ts                # Auto-scroll behavior
        │   ├── use-keyboard-shortcuts.ts         # Keyboard navigation
        │   └── use-virtualized-list.ts           # Message virtualization
        │
        ├── services/
        │   ├── chat-message-handler.ts           # Message processing
        │   ├── conversation-manager.ts           # Conversation CRUD
        │   ├── artifact-generator.ts             # Artifact creation
        │   ├── export-service.ts                 # Export to various formats
        │   ├── search-service.ts                 # Full-text search
        │   └── temporary-chat-handler.ts         # Temporary chat logic
        │
        ├── stores/
        │   ├── chat-interface-store.ts           # Main UI state
        │   ├── conversation-history-store.ts     # Conversation list
        │   ├── message-processing-store.ts       # Message queue
        │   ├── chat-configuration-store.ts       # Model/mode settings
        │   └── artifact-store.ts                 # Artifact management
        │
        ├── utils/
        │   ├── message-formatter.ts              # Format messages
        │   ├── token-calculator.ts               # Token estimation
        │   ├── cost-calculator.ts                # Cost estimation
        │   ├── markdown-parser.ts                # Markdown utilities
        │   └── export-formatters/
        │       ├── markdown-exporter.ts
        │       ├── pdf-exporter.ts
        │       ├── json-exporter.ts
        │       └── html-exporter.ts
        │
        └── types/
            ├── chat-interface.types.ts           # All TypeScript interfaces
            ├── message.types.ts
            ├── artifact.types.ts
            ├── tool.types.ts
            └── conversation.types.ts
```

---

## Responsive Design

### Mobile-First Breakpoints

```typescript
const breakpoints = {
  mobile: '0px',      // < 768px
  tablet: '768px',    // 768px - 1024px
  desktop: '1024px',  // > 1024px
  wide: '1440px'      // > 1440px
};
```

### Mobile Layout (< 768px)

```
┌─────────────────────────────┐
│ [☰] [Model▼] [Mode] [⚙️]   │ Top bar (compact)
├─────────────────────────────┤
│                             │
│   Full-width Message List   │
│                             │
│   (Sidebars as overlays)    │
│                             │
│                             │
├─────────────────────────────┤
│ Input Field (full width)    │
│ [Attach] [Send]             │
└─────────────────────────────┘
```

**Mobile Adaptations:**
- Left sidebar opens as slide-in overlay (hamburger menu)
- Right panel opens as modal (bottom sheet)
- Top bar collapses to icons only
- Message actions hidden behind long-press
- Attachments shown as small thumbnails
- Thinking mode collapses to simple progress bar
- Tool execution always collapsed by default

### Tablet Layout (768px - 1024px)

```
┌───────┬─────────────────────────────────────┐
│       │ [Model▼] [Mode] [Tokens] [⚙️]      │
│ Side  ├─────────────────────────────────────┤
│ bar   │                                     │
│       │    Message List (wider)             │
│ Conv  │                                     │
│ List  │    (Right panel hidden by default)  │
│       │                                     │
│       ├─────────────────────────────────────┤
│       │ Input Field                         │
└───────┴─────────────────────────────────────┘
```

**Tablet Adaptations:**
- Left sidebar always visible (30% width)
- Main chat area takes remaining space
- Right panel opens as overlay when needed
- Top bar shows all controls
- Message actions always visible

### Desktop Layout (> 1024px)

```
┌─────┬───────────────────────────────┬─────────┐
│     │ [Model▼] [Mode] [Tokens] [⚙️]│         │
│Side ├───────────────────────────────┤  Right  │
│bar  │                               │  Panel  │
│     │    Message List               │         │
│Conv │                               │ Artifact│
│List │    (Optimal reading width)    │  Tools  │
│     │                               │ Context │
│     ├───────────────────────────────┤         │
│     │ Input Field                   │         │
└─────┴───────────────────────────────┴─────────┘
```

**Desktop Adaptations:**
- Three-column layout (sidebar + main + panel)
- Left sidebar: 20% width (min 280px, max 360px)
- Main chat: 50-60% width (max 800px for readability)
- Right panel: 20-30% width (min 320px, max 480px)
- All features fully visible
- Hover states for all interactive elements

### Responsive Component Behavior

```typescript
// Example: MessageList component
const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)');

  return (
    <div className={cn(
      "flex flex-col gap-4",
      isMobile && "px-4",
      isTablet && "px-6",
      "lg:px-8"
    )}>
      {messages.map(message => (
        <Message
          key={message.id}
          message={message}
          compact={isMobile}
          showActions={!isMobile}
        />
      ))}
    </div>
  );
};
```

### Touch Interactions (Mobile/Tablet)

- **Tap**: Select message
- **Long press**: Show action menu
- **Swipe left**: Delete conversation (in list)
- **Swipe right**: Archive conversation
- **Pull down**: Refresh conversation list
- **Pinch zoom**: Zoom code/images in artifacts

---

## Performance Optimizations

### 1. Message Virtualization

**Problem**: Long conversations (1000+ messages) cause performance degradation

**Solution**: Use `react-window` or `react-virtuoso` for windowed rendering

```typescript
import { Virtuoso } from 'react-virtuoso';

const MessageList: React.FC = ({ messages }) => {
  return (
    <Virtuoso
      data={messages}
      itemContent={(index, message) => (
        <Message key={message.id} message={message} />
      )}
      followOutput="smooth"
      alignToBottom
    />
  );
};
```

**Benefits**:
- Renders only visible messages (~20 at a time)
- Reduces DOM nodes from 1000+ to ~30
- Smooth scrolling even with 10,000+ messages

### 2. Code Splitting & Lazy Loading

**Strategy**: Lazy load heavy components

```typescript
// Heavy components loaded on demand
const ArtifactViewer = lazy(() => import('./components/artifacts/ArtifactViewer'));
const CodePreview = lazy(() => import('./components/artifacts/CodePreview'));
const ExportDialog = lazy(() => import('./components/export/ExportDialog'));

// Preload on hover (predictive loading)
const handleMouseEnter = () => {
  import('./components/artifacts/ArtifactViewer');
};
```

**Split Points**:
- Right panel (artifacts, tools) - load when panel opens
- Export functionality - load when export clicked
- Advanced settings - load when settings opened
- Voice input - load when microphone clicked

### 3. Memoization Strategy

```typescript
// Message component (re-renders only when content changes)
const Message = React.memo<MessageProps>(({ message }) => {
  // Expensive markdown rendering
  const renderedContent = useMemo(
    () => parseMarkdown(message.content.text),
    [message.content.text]
  );

  return <div>{renderedContent}</div>;
}, (prev, next) => {
  // Custom comparison
  return prev.message.id === next.message.id &&
         prev.message.content === next.message.content;
});

// Callback memoization
const ChatInput: React.FC = () => {
  const handleSubmit = useCallback((text: string) => {
    sendMessage(text);
  }, []); // Stable reference

  return <InputField onSubmit={handleSubmit} />;
};
```

### 4. Streaming Optimization

**Challenge**: High-frequency updates during streaming (100+ per second)

**Solution**: Batch updates and use requestAnimationFrame

```typescript
const useStreamingOptimization = () => {
  const [buffer, setBuffer] = useState('');
  const [displayed, setDisplayed] = useState('');
  const rafRef = useRef<number>();

  useEffect(() => {
    // Batch updates at 60fps
    const updateDisplay = () => {
      if (buffer !== displayed) {
        setDisplayed(buffer);
      }
      rafRef.current = requestAnimationFrame(updateDisplay);
    };

    rafRef.current = requestAnimationFrame(updateDisplay);
    return () => cancelAnimationFrame(rafRef.current!);
  }, [buffer, displayed]);

  const appendChunk = useCallback((chunk: string) => {
    setBuffer(prev => prev + chunk);
  }, []);

  return { displayed, appendChunk };
};
```

### 5. Token Calculation Optimization

**Problem**: Real-time token counting is CPU-intensive

**Solution**: Web Worker for background processing

```typescript
// token-counter.worker.ts
self.addEventListener('message', (e) => {
  const { text } = e.data;
  const tokens = estimateTokens(text); // Heavy calculation
  self.postMessage({ tokens });
});

// Use in component
const useTokenCounter = (text: string) => {
  const [tokens, setTokens] = useState(0);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(new URL('./token-counter.worker', import.meta.url));
    workerRef.current.onmessage = (e) => setTokens(e.data.tokens);
    return () => workerRef.current?.terminate();
  }, []);

  useEffect(() => {
    workerRef.current?.postMessage({ text });
  }, [text]);

  return tokens;
};
```

### 6. Image Optimization

```typescript
// Lazy load images with blur placeholder
const OptimizedImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="blur-sm data-[loaded=true]:blur-0 transition-all"
      onLoad={(e) => e.currentTarget.dataset.loaded = 'true'}
    />
  );
};
```

### 7. Debounced Search

```typescript
const useConversationSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const debouncedSearch = useMemo(
    () => debounce(async (q: string) => {
      if (q.length < 2) return;
      const results = await searchService.search(q);
      setResults(results);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return { query, setQuery, results };
};
```

### 8. State Update Optimization

```typescript
// Zustand store with selective subscriptions
const useChatInterface = () => {
  // Only re-render when isStreaming changes
  const isStreaming = useChatInterfaceStore(
    state => state.isStreaming,
    shallow
  );

  // Don't re-render for unrelated state changes
  return isStreaming;
};

// Batch multiple updates
const chatInterfaceStore = create<ChatInterfaceState>()(
  immer((set) => ({
    startStreaming: (messageId: string) => {
      set((state) => {
        // Multiple mutations in single update
        state.isStreaming = true;
        state.streamingMessageId = messageId;
        state.inputValue = '';
      });
    }
  }))
);
```

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial Load | < 2s | Time to interactive |
| Message Render | < 50ms | Per message |
| Streaming Update | 60fps | No dropped frames |
| Scroll Performance | 60fps | Smooth scrolling |
| Search Response | < 100ms | First result displayed |
| Input Lag | < 16ms | Key press to display |
| Memory Usage | < 200MB | For 1000 messages |

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Keyboard Navigation

**All interactive elements must be keyboard accessible:**

| Action | Keyboard Shortcut |
|--------|-------------------|
| New conversation | Ctrl/Cmd + N |
| Search conversations | Ctrl/Cmd + K |
| Focus input | Ctrl/Cmd + L |
| Send message | Enter |
| New line in input | Shift + Enter |
| Toggle left sidebar | Ctrl/Cmd + B |
| Toggle right panel | Ctrl/Cmd + . |
| Navigate messages | Arrow Up/Down |
| Copy message | Ctrl/Cmd + C (when message focused) |
| Regenerate message | Ctrl/Cmd + R (when message focused) |
| Toggle mode | Ctrl/Cmd + Shift + M |
| Stop generation | Escape |

**Implementation:**

```typescript
const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key === 'n') {
        e.preventDefault();
        createNewConversation();
      }

      if (isCmdOrCtrl && e.key === 'k') {
        e.preventDefault();
        focusSearch();
      }

      // ... more shortcuts
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

#### Screen Reader Support

**Semantic HTML:**

```tsx
<main aria-label="Chat interface">
  <nav aria-label="Conversation history">
    <ul role="list">
      <li role="listitem">
        <button aria-label="Conversation from today about React">
          React discussion
        </button>
      </li>
    </ul>
  </nav>

  <section aria-label="Messages" role="log" aria-live="polite">
    <article aria-label="User message">
      <p>User's question</p>
    </article>

    <article aria-label="AI response" aria-busy={isStreaming}>
      <p>AI's answer</p>
    </article>
  </section>

  <form aria-label="Message input">
    <label htmlFor="message-input" className="sr-only">
      Type your message
    </label>
    <textarea
      id="message-input"
      aria-describedby="input-help"
      aria-required="true"
    />
    <span id="input-help" className="sr-only">
      Press Enter to send, Shift+Enter for new line
    </span>
  </form>
</main>
```

**Live Regions:**

```tsx
// Announce streaming status
<div role="status" aria-live="polite" className="sr-only">
  {isStreaming ? 'AI is responding' : 'Response complete'}
</div>

// Announce errors
<div role="alert" aria-live="assertive" className="sr-only">
  {error && `Error: ${error.message}`}
</div>

// Announce token usage
<div role="status" aria-live="polite" aria-atomic="true">
  {tokenUsage.totalTokens} tokens used
</div>
```

#### Focus Management

```typescript
const ChatInterface: React.FC = () => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  // Focus input after message sent
  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
    inputRef.current?.focus();
  };

  // Manage focus on modal open/close
  const handleOpenExportDialog = () => {
    const previousFocus = document.activeElement;
    openExportDialog();

    // Return focus when closed
    return () => {
      (previousFocus as HTMLElement)?.focus();
    };
  };

  return (
    <>
      <MessageList ref={messageListRef} />
      <ChatInput ref={inputRef} onSend={handleSendMessage} />
    </>
  );
};
```

#### Color Contrast

**All text must meet WCAG AA standards (4.5:1 ratio):**

```typescript
// Tailwind theme configuration
module.exports = {
  theme: {
    extend: {
      colors: {
        // Accessible color palette
        text: {
          primary: '#0A0A0A',    // 19:1 on white
          secondary: '#505050',  // 7:1 on white
          tertiary: '#737373',   // 4.6:1 on white (AA)
        },
        background: {
          primary: '#FFFFFF',
          secondary: '#F5F5F5',
          tertiary: '#E5E5E5',
        },
        border: {
          DEFAULT: '#D4D4D4',    // 3:1 on white (UI elements)
        },
        // High contrast mode colors
        hcm: {
          text: '#000000',
          background: '#FFFFFF',
          link: '#0000FF',
        }
      }
    }
  }
};
```

**Ensure contrast in all states:**
- Default
- Hover
- Focus
- Active
- Disabled

#### Reduced Motion

```typescript
// Respect prefers-reduced-motion
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Conditional animations
const MessageList: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3
      }}
    >
      {messages}
    </motion.div>
  );
};
```

#### Form Labels & Descriptions

```tsx
// All inputs must have labels
<div className="flex flex-col gap-2">
  <label htmlFor="temperature" className="text-sm font-medium">
    Temperature
    <span className="text-muted-foreground ml-2">(0.0 - 2.0)</span>
  </label>
  <input
    id="temperature"
    type="number"
    min="0"
    max="2"
    step="0.1"
    aria-describedby="temperature-help"
    aria-valuemin={0}
    aria-valuemax={2}
    aria-valuenow={temperature}
  />
  <span id="temperature-help" className="text-xs text-muted-foreground">
    Higher values make output more random, lower values more deterministic.
  </span>
</div>
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goals**: Set up core architecture and basic UI

**Tasks**:
1. Create file structure and base components
2. Implement Zustand stores (chat-interface, message-processing)
3. Build TopBar with model/mode selectors
4. Build basic MessageList with UserMessage and AIMessage components
5. Implement ChatInput with send functionality
6. Set up routing and full-screen layout

**Deliverables**:
- Working single-conversation chat interface
- Model and mode selection functional
- Basic message display and input

### Phase 2: Core Features (Week 3-4)

**Goals**: Add streaming, thinking mode, and tool execution

**Tasks**:
1. Implement message streaming with optimization
2. Build ThinkingModeDisplay with progress indicator
3. Create ToolExecutionDisplay components
4. Add real-time token usage tracking
5. Implement auto-scroll behavior
6. Add message actions (copy, regenerate, edit)

**Deliverables**:
- Streaming responses with smooth animations
- Thinking mode visualization
- Tool execution display
- Token usage tracking

### Phase 3: Conversation Management (Week 5)

**Goals**: Multi-conversation support and search

**Tasks**:
1. Build LeftSidebar with ConversationList
2. Implement conversation CRUD operations
3. Add search functionality with highlighting
4. Create conversation filtering and sorting
5. Add temporary chat mode
6. Implement conversation export

**Deliverables**:
- Full conversation history management
- Search across all conversations
- Export to multiple formats

### Phase 4: Advanced Features (Week 6)

**Goals**: Artifacts, advanced UI, and right panel

**Tasks**:
1. Build RightPanel with tabbed interface
2. Create ArtifactViewer with code preview
3. Implement live preview for HTML/React
4. Add artifact version history
5. Build context manager for active files
6. Create quick settings panel

**Deliverables**:
- Complete artifact system
- Right panel with all tabs functional
- Context-aware assistance

### Phase 5: Polish & Optimization (Week 7)

**Goals**: Performance, accessibility, and responsive design

**Tasks**:
1. Implement message virtualization
2. Add keyboard shortcuts
3. Complete accessibility audit (WCAG AA)
4. Optimize for mobile and tablet
5. Add touch gestures
6. Performance profiling and optimization

**Deliverables**:
- Smooth performance with 1000+ messages
- Full keyboard navigation
- WCAG AA compliant
- Responsive on all devices

### Phase 6: Testing & Documentation (Week 8)

**Goals**: Comprehensive testing and developer docs

**Tasks**:
1. Write unit tests for all components
2. Create integration tests for critical flows
3. E2E tests with Playwright
4. Accessibility testing with axe-core
5. Performance benchmarking
6. Write component documentation and Storybook stories

**Deliverables**:
- 80%+ test coverage
- All accessibility tests passing
- Complete component library documentation

---

## Styling Strategy

### Tailwind CSS + shadcn/ui

**Design System**:

```typescript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
};
```

**Component Patterns**:

```tsx
// Consistent component structure
const Message: React.FC<MessageProps> = ({ message, variant = 'user' }) => {
  return (
    <div className={cn(
      "flex gap-3 p-4 rounded-lg transition-colors",
      variant === 'user' && "bg-secondary",
      variant === 'assistant' && "bg-muted/50",
      "hover:bg-accent/5"
    )}>
      <Avatar className="h-8 w-8 shrink-0">
        {/* Avatar content */}
      </Avatar>

      <div className="flex-1 space-y-2 min-w-0">
        <MessageContent content={message.content} />
        <MessageActions message={message} />
      </div>
    </div>
  );
};
```

**Dark Mode**:

```tsx
// Toggle dark mode
const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
    >
      {theme === 'light' ? <Moon /> : <Sun />}
    </Button>
  );
};
```

---

## Summary

This architecture provides a comprehensive, modern chat interface that:

1. **Follows 2025 best practices** from leading AI chat applications
2. **Prioritizes performance** with virtualization, lazy loading, and optimized streaming
3. **Ensures accessibility** with WCAG AA compliance, keyboard navigation, and screen reader support
4. **Scales gracefully** from mobile to desktop with responsive design
5. **Maintains clean architecture** with separation of concerns and reusable components
6. **Provides excellent UX** with thinking mode, tool execution display, and artifact previews
7. **Supports extensibility** with modular components and clear interfaces

The phased implementation roadmap ensures steady progress over 8 weeks, with testable deliverables at each stage.
