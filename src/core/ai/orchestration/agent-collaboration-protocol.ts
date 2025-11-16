/**
 * Agent Collaboration Protocol
 * Enables multi-agent conversations with tool usage and token optimization
 * Reference: https://support.mgx.dev/en/articles/12087744-overview
 */

export interface AgentMessage {
  id: string;
  type: 'user' | 'agent' | 'tool' | 'system';
  role: 'user' | 'assistant' | 'tool' | 'system';
  content: string;
  agentId?: string;
  agentName?: string;
  agentAvatar?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  timestamp: Date;
  isIntermediate?: boolean; // For token-optimized responses
  metadata?: {
    tokensUsed?: number;
    model?: string;
    temperature?: number;
    reasoning?: string;
  };
}

export interface CollaborationContext {
  userId: string;
  sessionId: string;
  activeAgents: string[]; // Agent IDs currently in conversation
  conversationHistory: AgentMessage[];
  sharedContext: Record<string, unknown>; // Shared knowledge between agents
  toolsEnabled: boolean;
}

export interface AgentCapability {
  agentId: string;
  name: string;
  avatar?: string;
  expertise: string[];
  tools: string[];
  systemPrompt: string;
  model: string;
  temperature: number;
}

/**
 * Collaboration Protocol Manager
 * Orchestrates multi-agent conversations with tool usage
 */
export class CollaborationProtocol {
  private context: CollaborationContext;
  private agents: Map<string, AgentCapability>;
  private messageHandlers: Map<
    string,
    (message: AgentMessage) => Promise<void>
  >;

  constructor(context: CollaborationContext) {
    this.context = context;
    this.agents = new Map();
    this.messageHandlers = new Map();
  }

  /**
   * Register an AI employee as an active agent
   */
  registerAgent(agent: AgentCapability): void {
    this.agents.set(agent.agentId, agent);
    if (!this.context.activeAgents.includes(agent.agentId)) {
      this.context.activeAgents.push(agent.agentId);
    }
  }

  /**
   * Remove agent from active conversation
   */
  removeAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.context.activeAgents = this.context.activeAgents.filter(
      (id) => id !== agentId
    );
  }

  /**
   * Add message to conversation history
   */
  addMessage(message: AgentMessage): void {
    this.context.conversationHistory.push(message);
  }

  /**
   * Get conversation history for a specific agent
   * Includes only relevant messages to reduce tokens
   */
  getAgentContext(agentId: string, maxMessages = 20): AgentMessage[] {
    const agent = this.agents.get(agentId);
    if (!agent) return [];

    // Get recent messages relevant to this agent
    return this.context.conversationHistory
      .filter((msg) => {
        // Include user messages
        if (msg.type === 'user') return true;
        // Include messages from this agent
        if (msg.agentId === agentId) return true;
        // Include messages mentioning this agent
        if (msg.content.includes(agent.name)) return true;
        // Include tool results
        if (msg.type === 'tool') return true;
        return false;
      })
      .slice(-maxMessages);
  }

  /**
   * Route message to appropriate agent(s)
   * Returns agent IDs that should respond
   */
  routeMessage(message: AgentMessage): string[] {
    const content = message.content.toLowerCase();
    const mentionedAgents: string[] = [];

    // Check for explicit mentions (@agentName or "ask [agent]")
    for (const [agentId, agent] of this.agents.entries()) {
      const agentName = agent.name.toLowerCase();
      if (
        content.includes(`@${agentName}`) ||
        content.includes(`ask ${agentName}`) ||
        content.includes(`${agentName},`)
      ) {
        mentionedAgents.push(agentId);
      }
    }

    // If no explicit mentions, route based on expertise
    if (mentionedAgents.length === 0) {
      for (const [agentId, agent] of this.agents.entries()) {
        const hasRelevantExpertise = agent.expertise.some((expertise) =>
          content.includes(expertise.toLowerCase())
        );
        if (hasRelevantExpertise) {
          mentionedAgents.push(agentId);
        }
      }
    }

    // If still no matches, route to all active agents
    if (mentionedAgents.length === 0) {
      return this.context.activeAgents;
    }

    return mentionedAgents;
  }

  /**
   * Create optimized system prompt for agent
   */
  createAgentPrompt(agentId: string, isIntermediateResponse = false): string {
    const agent = this.agents.get(agentId);
    if (!agent) return '';

    const basePrompt = agent.systemPrompt;
    const collaborationPrompt = `

## Multi-Agent Collaboration Context

You are ${agent.name}, collaborating with other AI employees in this conversation.
Active team members: ${Array.from(this.agents.values())
      .map((a) => a.name)
      .join(', ')}

${
  this.context.activeAgents.length > 1
    ? `
### Collaboration Guidelines:
- You can reference other agents using @AgentName
- Share insights and ask other agents for help when needed
- Use tools autonomously to gather information
- Build upon other agents' contributions
`
    : ''
}

${
  isIntermediateResponse
    ? `
### Output Mode: INTERMEDIATE
Provide concise, token-efficient responses. Focus on:
- Key insights only
- Compressed information
- References to tool results
- NO verbose explanations
- NO repetition of known information
`
    : `
### Output Mode: FINAL
Provide comprehensive, detailed responses. Include:
- Complete explanations
- Full context and reasoning
- Detailed analysis
- All relevant information
- Professional formatting
`
}
`;

    return basePrompt + collaborationPrompt;
  }

  /**
   * Format tool execution message for display
   */
  formatToolMessage(
    agentId: string,
    toolName: string,
    args: Record<string, unknown>,
    result: unknown
  ): AgentMessage {
    const agent = this.agents.get(agentId);
    return {
      id: `tool-${Date.now()}`,
      type: 'tool',
      role: 'tool',
      content: `Used ${toolName}`,
      agentId,
      agentName: agent?.name,
      agentAvatar: agent?.avatar,
      toolName,
      toolArgs: args,
      toolResult: result,
      timestamp: new Date(),
      isIntermediate: true,
    };
  }

  /**
   * Determine if response should be intermediate or final
   */
  shouldOptimizeResponse(message: AgentMessage): boolean {
    // Optimize tool usage responses
    if (message.type === 'tool') return true;

    // Optimize agent-to-agent communication
    const isAgentMention = this.context.activeAgents.some(
      (id) =>
        id !== message.agentId &&
        message.content.includes(`@${this.agents.get(id)?.name || ''}`)
    );
    if (isAgentMention) return true;

    // Don't optimize final user-facing responses
    if (
      message.content.includes('final') ||
      message.content.includes('summary')
    )
      return false;

    return false;
  }

  /**
   * Get shared context for collaboration
   */
  getSharedContext(): Record<string, unknown> {
    return {
      ...this.context.sharedContext,
      activeAgents: Array.from(this.agents.values()).map((a) => ({
        id: a.agentId,
        name: a.name,
        expertise: a.expertise,
      })),
      conversationLength: this.context.conversationHistory.length,
    };
  }

  /**
   * Update shared context with new information
   */
  updateSharedContext(key: string, value: unknown): void {
    this.context.sharedContext[key] = value;
  }

  /**
   * Get active agents with their capabilities
   */
  getActiveAgents(): AgentCapability[] {
    return this.context.activeAgents
      .map((id) => this.agents.get(id))
      .filter((agent): agent is AgentCapability => agent !== undefined);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.context.conversationHistory = [];
  }

  /**
   * Export conversation for analysis
   */
  exportConversation(): {
    agents: AgentCapability[];
    messages: AgentMessage[];
    sharedContext: Record<string, unknown>;
  } {
    return {
      agents: this.getActiveAgents(),
      messages: this.context.conversationHistory,
      sharedContext: this.context.sharedContext,
    };
  }
}

/**
 * Create collaboration context for a session
 */
export function createCollaborationContext(
  userId: string,
  sessionId: string
): CollaborationContext {
  return {
    userId,
    sessionId,
    activeAgents: [],
    conversationHistory: [],
    sharedContext: {},
    toolsEnabled: true,
  };
}

/**
 * Parse agent mention from message
 */
export function parseAgentMentions(
  message: string,
  agents: AgentCapability[]
): string[] {
  const mentions: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const agent of agents) {
    const lowerName = agent.name.toLowerCase();
    if (
      lowerMessage.includes(`@${lowerName}`) ||
      lowerMessage.includes(`ask ${lowerName}`) ||
      lowerMessage.includes(`${lowerName},`)
    ) {
      mentions.push(agent.agentId);
    }
  }

  return mentions;
}

export default CollaborationProtocol;
