/**
 * Employee Memory Service
 * Per-employee context windows and persistent user memory
 *
 * Enables sub-agent architecture where each AI employee has:
 * - Their own context window (keyed by sessionId + employeeId)
 * - Persistent memory about specific users (keyed by userId + employeeId)
 * - Handoff data to pass information between employees
 */

import { supabase } from '@shared/lib/supabase-client';

// ================================================
// TYPES
// ================================================

export interface EmployeeContextMessage {
  role: 'user' | 'assistant' | 'system' | 'handoff';
  content: string;
  timestamp: Date;
  tokens?: number;
  metadata?: {
    fromEmployee?: string;
    toEmployee?: string;
    handoffType?: 'delegation' | 'consultation' | 'completion';
  };
}

export interface EmployeeContextWindow {
  employeeId: string;
  employeeName: string;
  sessionId: string;
  messages: EmployeeContextMessage[];
  totalTokens: number;
  maxTokens: number;
  systemPrompt?: string;
  lastActive: Date;
}

export interface EmployeeMemory {
  employeeId: string;
  userId: string;
  knowledgeBase: MemoryEntry[];
  preferences: Record<string, unknown>;
  lastInteraction: Date;
  interactionCount: number;
}

export interface MemoryEntry {
  id: string;
  category: 'personal' | 'preferences' | 'history' | 'goals' | 'notes';
  key: string;
  value: string;
  confidence: number; // 0-1, how confident the employee is about this info
  source: 'user_stated' | 'inferred' | 'handoff';
  createdAt: Date;
  updatedAt: Date;
}

export interface HandoffPackage {
  id: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  sessionId: string;
  userId: string;

  // What the source employee learned
  context: {
    summary: string;
    keyPoints: string[];
    userRequest: string;
    workCompleted: string;
    pendingTasks: string[];
  };

  // Specific data to pass
  data?: Record<string, unknown>;

  // Instructions for the receiving employee
  instructions?: string;

  timestamp: Date;
  status: 'pending' | 'accepted' | 'completed';
}

// ================================================
// CONTEXT KEY HELPERS
// ================================================

function makeContextKey(sessionId: string, employeeId: string): string {
  return `${sessionId}::${employeeId}`;
}

function makeMemoryKey(userId: string, employeeId: string): string {
  return `${userId}::${employeeId}`;
}

// ================================================
// TOKEN COUNTING
// ================================================

function countTokens(text: string): number {
  const words = text.split(/\s+/).length;
  const chars = text.length;
  return Math.max(Math.ceil(words / 0.75), Math.ceil(chars / 4));
}

// ================================================
// EMPLOYEE MEMORY SERVICE
// ================================================

export class EmployeeMemoryService {
  private static instance: EmployeeMemoryService;

  // Per-employee context windows (session-scoped)
  private contextWindows: Record<string, EmployeeContextWindow> = {};

  // Persistent employee memory about users (user-scoped)
  private memories: Record<string, EmployeeMemory> = {};

  // Active handoffs
  private handoffs: Record<string, HandoffPackage> = {};

  static getInstance(): EmployeeMemoryService {
    if (!EmployeeMemoryService.instance) {
      EmployeeMemoryService.instance = new EmployeeMemoryService();
    }
    return EmployeeMemoryService.instance;
  }

  // ================================================
  // CONTEXT WINDOW MANAGEMENT
  // ================================================

  /**
   * Get or create context window for an employee in a session
   */
  getContextWindow(
    sessionId: string,
    employeeId: string,
    employeeName: string,
    systemPrompt?: string,
    maxTokens: number = 128000
  ): EmployeeContextWindow {
    const key = makeContextKey(sessionId, employeeId);

    if (!this.contextWindows[key]) {
      this.contextWindows[key] = {
        employeeId,
        employeeName,
        sessionId,
        messages: [],
        totalTokens: 0,
        maxTokens,
        systemPrompt,
        lastActive: new Date(),
      };
    }

    return this.contextWindows[key];
  }

  /**
   * Add message to employee's context window
   */
  addMessageToContext(
    sessionId: string,
    employeeId: string,
    message: Omit<EmployeeContextMessage, 'timestamp' | 'tokens'>
  ): void {
    const key = makeContextKey(sessionId, employeeId);
    const context = this.contextWindows[key];

    if (!context) {
      console.warn(`No context window found for employee ${employeeId}`);
      return;
    }

    const tokens = countTokens(message.content);
    const fullMessage: EmployeeContextMessage = {
      ...message,
      timestamp: new Date(),
      tokens,
    };

    context.messages.push(fullMessage);
    context.totalTokens += tokens;
    context.lastActive = new Date();

    // Auto-summarize if approaching token limit
    if (context.totalTokens > context.maxTokens * 0.8) {
      this.summarizeContextWindow(sessionId, employeeId);
    }
  }

  /**
   * Get optimized messages for API call
   */
  getOptimizedMessages(
    sessionId: string,
    employeeId: string
  ): EmployeeContextMessage[] {
    const key = makeContextKey(sessionId, employeeId);
    const context = this.contextWindows[key];

    if (!context) return [];

    // If within limits, return all messages
    if (context.totalTokens <= context.maxTokens * 0.9) {
      return context.messages;
    }

    // Use sliding window - keep recent messages
    return this.getSlidingWindow(context);
  }

  /**
   * Summarize context when it gets too long
   */
  private summarizeContextWindow(sessionId: string, employeeId: string): void {
    const key = makeContextKey(sessionId, employeeId);
    const context = this.contextWindows[key];

    if (!context) return;

    // Keep last 30% of messages, summarize the rest
    const splitPoint = Math.floor(context.messages.length * 0.7);
    const messagesToSummarize = context.messages.slice(0, splitPoint);
    const messagesToKeep = context.messages.slice(splitPoint);

    // Create a summary message
    const summaryContent = `[CONTEXT SUMMARY] Previous conversation (${messagesToSummarize.length} messages): ` +
      `User and ${context.employeeName} discussed various topics. ` +
      `Key points: ${messagesToSummarize.slice(-5).map(m => m.content.slice(0, 50)).join('; ')}...`;

    const summaryMessage: EmployeeContextMessage = {
      role: 'system',
      content: summaryContent,
      timestamp: new Date(),
      tokens: countTokens(summaryContent),
    };

    context.messages = [summaryMessage, ...messagesToKeep];
    context.totalTokens = context.messages.reduce((sum, m) => sum + (m.tokens || 0), 0);
  }

  private getSlidingWindow(context: EmployeeContextWindow): EmployeeContextMessage[] {
    const maxTokens = context.maxTokens * 0.9;
    const result: EmployeeContextMessage[] = [];
    let currentTokens = 0;

    // Start from most recent
    for (let i = context.messages.length - 1; i >= 0; i--) {
      const message = context.messages[i];
      const messageTokens = message.tokens || countTokens(message.content);

      if (currentTokens + messageTokens > maxTokens) break;

      result.unshift(message);
      currentTokens += messageTokens;
    }

    return result;
  }

  /**
   * Clear context window for an employee
   */
  clearContextWindow(sessionId: string, employeeId: string): void {
    const key = makeContextKey(sessionId, employeeId);
    delete this.contextWindows[key];
  }

  /**
   * Get all active context windows for a session
   */
  getSessionContextWindows(sessionId: string): EmployeeContextWindow[] {
    return Object.values(this.contextWindows).filter(
      (ctx) => ctx.sessionId === sessionId
    );
  }

  // ================================================
  // PERSISTENT MEMORY MANAGEMENT
  // ================================================

  /**
   * Get or create persistent memory for employee about a user
   */
  async getEmployeeMemory(
    userId: string,
    employeeId: string
  ): Promise<EmployeeMemory> {
    const key = makeMemoryKey(userId, employeeId);

    // Check cache first
    if (this.memories[key]) {
      return this.memories[key];
    }

    // Try to load from database
    try {
      const { data } = await supabase
        .from('employee_memories')
        .select('*')
        .eq('user_id', userId)
        .eq('employee_id', employeeId)
        .maybeSingle();

      if (data) {
        const memory: EmployeeMemory = {
          employeeId: data.employee_id,
          userId: data.user_id,
          knowledgeBase: data.knowledge_base || [],
          preferences: data.preferences || {},
          lastInteraction: new Date(data.last_interaction),
          interactionCount: data.interaction_count || 0,
        };
        this.memories[key] = memory;
        return memory;
      }
    } catch (error) {
      console.warn('Failed to load employee memory from database:', error);
    }

    // Create new memory
    const newMemory: EmployeeMemory = {
      employeeId,
      userId,
      knowledgeBase: [],
      preferences: {},
      lastInteraction: new Date(),
      interactionCount: 0,
    };
    this.memories[key] = newMemory;
    return newMemory;
  }

  /**
   * Add knowledge to employee's memory about a user
   */
  async addKnowledge(
    userId: string,
    employeeId: string,
    entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const memory = await this.getEmployeeMemory(userId, employeeId);

    const fullEntry: MemoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check for existing entry with same key
    const existingIndex = memory.knowledgeBase.findIndex(
      (e) => e.key === entry.key && e.category === entry.category
    );

    if (existingIndex >= 0) {
      // Update existing
      memory.knowledgeBase[existingIndex] = {
        ...memory.knowledgeBase[existingIndex],
        ...entry,
        updatedAt: new Date(),
      };
    } else {
      // Add new
      memory.knowledgeBase.push(fullEntry);
    }

    memory.lastInteraction = new Date();
    memory.interactionCount++;

    // Persist to database
    await this.persistMemory(memory);
  }

  /**
   * Get knowledge entries by category
   */
  async getKnowledgeByCategory(
    userId: string,
    employeeId: string,
    category: MemoryEntry['category']
  ): Promise<MemoryEntry[]> {
    const memory = await this.getEmployeeMemory(userId, employeeId);
    return memory.knowledgeBase.filter((e) => e.category === category);
  }

  /**
   * Get all knowledge about a user
   */
  async getAllKnowledge(
    userId: string,
    employeeId: string
  ): Promise<MemoryEntry[]> {
    const memory = await this.getEmployeeMemory(userId, employeeId);
    return memory.knowledgeBase;
  }

  /**
   * Build context string from memory for system prompt
   */
  async buildMemoryContext(
    userId: string,
    employeeId: string
  ): Promise<string> {
    const memory = await this.getEmployeeMemory(userId, employeeId);

    if (memory.knowledgeBase.length === 0) {
      return '';
    }

    const sections: string[] = [];

    // Group by category
    const byCategory = memory.knowledgeBase.reduce((acc, entry) => {
      if (!acc[entry.category]) acc[entry.category] = [];
      acc[entry.category].push(entry);
      return acc;
    }, {} as Record<string, MemoryEntry[]>);

    if (byCategory.personal?.length) {
      sections.push('**About this user:**\n' +
        byCategory.personal.map(e => `- ${e.key}: ${e.value}`).join('\n'));
    }

    if (byCategory.preferences?.length) {
      sections.push('**User preferences:**\n' +
        byCategory.preferences.map(e => `- ${e.key}: ${e.value}`).join('\n'));
    }

    if (byCategory.goals?.length) {
      sections.push('**User goals:**\n' +
        byCategory.goals.map(e => `- ${e.key}: ${e.value}`).join('\n'));
    }

    if (byCategory.history?.length) {
      sections.push('**Previous interactions:**\n' +
        byCategory.history.slice(-5).map(e => `- ${e.value}`).join('\n'));
    }

    return sections.length > 0
      ? `[MEMORY - What you remember about this user]\n${sections.join('\n\n')}`
      : '';
  }

  /**
   * Persist memory to database
   */
  private async persistMemory(memory: EmployeeMemory): Promise<void> {
    try {
      await supabase.from('employee_memories').upsert({
        user_id: memory.userId,
        employee_id: memory.employeeId,
        knowledge_base: memory.knowledgeBase,
        preferences: memory.preferences,
        last_interaction: memory.lastInteraction.toISOString(),
        interaction_count: memory.interactionCount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,employee_id',
      });
    } catch (error) {
      console.warn('Failed to persist employee memory:', error);
    }
  }

  // ================================================
  // HANDOFF MANAGEMENT
  // ================================================

  /**
   * Create a handoff package from one employee to another
   */
  createHandoff(
    fromEmployeeId: string,
    fromEmployeeName: string,
    toEmployeeId: string,
    toEmployeeName: string,
    sessionId: string,
    userId: string,
    context: HandoffPackage['context'],
    data?: Record<string, unknown>,
    instructions?: string
  ): HandoffPackage {
    const handoff: HandoffPackage = {
      id: crypto.randomUUID(),
      fromEmployeeId,
      fromEmployeeName,
      toEmployeeId,
      toEmployeeName,
      sessionId,
      userId,
      context,
      data,
      instructions,
      timestamp: new Date(),
      status: 'pending',
    };

    this.handoffs[handoff.id] = handoff;

    // Add handoff message to receiving employee's context
    const handoffMessage: EmployeeContextMessage = {
      role: 'handoff',
      content: this.formatHandoffMessage(handoff),
      timestamp: new Date(),
      metadata: {
        fromEmployee: fromEmployeeName,
        toEmployee: toEmployeeName,
        handoffType: 'delegation',
      },
    };

    this.addMessageToContext(sessionId, toEmployeeId, handoffMessage);

    return handoff;
  }

  /**
   * Format handoff for receiving employee's context
   */
  private formatHandoffMessage(handoff: HandoffPackage): string {
    let message = `[HANDOFF FROM ${handoff.fromEmployeeName.toUpperCase()}]\n\n`;

    message += `**User's Original Request:** ${handoff.context.userRequest}\n\n`;
    message += `**What ${handoff.fromEmployeeName} completed:** ${handoff.context.workCompleted}\n\n`;

    if (handoff.context.keyPoints.length > 0) {
      message += `**Key Information:**\n${handoff.context.keyPoints.map(p => `- ${p}`).join('\n')}\n\n`;
    }

    if (handoff.context.pendingTasks.length > 0) {
      message += `**Your Tasks:**\n${handoff.context.pendingTasks.map(t => `- ${t}`).join('\n')}\n\n`;
    }

    if (handoff.instructions) {
      message += `**Special Instructions:** ${handoff.instructions}\n\n`;
    }

    if (handoff.data) {
      message += `**Data Provided:**\n\`\`\`json\n${JSON.stringify(handoff.data, null, 2)}\n\`\`\`\n`;
    }

    return message;
  }

  /**
   * Accept a handoff
   */
  acceptHandoff(handoffId: string): HandoffPackage | undefined {
    const handoff = this.handoffs[handoffId];
    if (handoff) {
      handoff.status = 'accepted';
    }
    return handoff;
  }

  /**
   * Complete a handoff
   */
  completeHandoff(handoffId: string): void {
    const handoff = this.handoffs[handoffId];
    if (handoff) {
      handoff.status = 'completed';
    }
  }

  /**
   * Get pending handoffs for an employee
   */
  getPendingHandoffs(employeeId: string): HandoffPackage[] {
    return Object.values(this.handoffs).filter(
      (h) => h.toEmployeeId === employeeId && h.status === 'pending'
    );
  }

  /**
   * Get all handoffs for a session
   */
  getSessionHandoffs(sessionId: string): HandoffPackage[] {
    return Object.values(this.handoffs).filter((h) => h.sessionId === sessionId);
  }

  // ================================================
  // UTILITY METHODS
  // ================================================

  /**
   * Get context stats for an employee
   */
  getContextStats(
    sessionId: string,
    employeeId: string
  ): {
    messageCount: number;
    totalTokens: number;
    maxTokens: number;
    usagePercentage: number;
    lastActive: Date | null;
  } {
    const key = makeContextKey(sessionId, employeeId);
    const context = this.contextWindows[key];

    if (!context) {
      return {
        messageCount: 0,
        totalTokens: 0,
        maxTokens: 0,
        usagePercentage: 0,
        lastActive: null,
      };
    }

    return {
      messageCount: context.messages.length,
      totalTokens: context.totalTokens,
      maxTokens: context.maxTokens,
      usagePercentage: (context.totalTokens / context.maxTokens) * 100,
      lastActive: context.lastActive,
    };
  }

  /**
   * Clear all context for a session
   */
  clearSessionContext(sessionId: string): void {
    const keysToDelete = Object.keys(this.contextWindows).filter((key) =>
      key.startsWith(`${sessionId}::`)
    );
    keysToDelete.forEach((key) => delete this.contextWindows[key]);
  }

  /**
   * Clear all cached data
   */
  reset(): void {
    this.contextWindows = {};
    this.memories = {};
    this.handoffs = {};
  }
}

// Export singleton
export const employeeMemoryService = EmployeeMemoryService.getInstance();
