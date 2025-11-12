# 💬 Multi-Agent Chat Feature

The chat feature is the centerpiece of AGI Agent Automation, providing a best-in-class interface for interacting with AI employees that collaborate transparently to complete complex tasks.

## Overview

This module implements a sophisticated chat interface that combines the polish of ChatGPT/Claude.ai with the transparent multi-agent collaboration workflow inspired by mgx.dev.

## Key Components

### MessageBubble - Enhanced Message Display

- Rich Markdown rendering with syntax highlighting
- Document view mode for long-form content
- Per-code-block copy buttons
- Inline work stream visualization
- Export documents as .md files

### ChatComposer - Modern Input Component

- Inline model selector with recommendations
- Avatar-based employee multi-selector
- Auto-resizing textarea (80-200px)
- File upload with preview
- Keyboard shortcuts and character counter

### EmployeeWorkStream - Collaboration Visualization

- Real-time display of AI employee work
- Shows tool usage, files, commands
- Status updates and progress tracking

## State Management

- **chat-store.ts**: Primary UI state (conversations, messages)
- **mission-control-store.ts**: Orchestration state (tasks, employees)

## Services

- **model-router.ts**: Task-based model selection
- **unified-llm-service.ts**: Multi-provider LLM interface

See the main project README for full documentation.
