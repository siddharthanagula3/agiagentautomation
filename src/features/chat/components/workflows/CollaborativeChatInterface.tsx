/**
 * Collaborative Chat Interface
 * Multi-agent chat with inline collaboration, tool usage, and agent avatars
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Textarea } from '@shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
import {
  Bot,
  Send,
  Users,
  Plus,
  Minimize2,
  Maximize2,
  Settings,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import {
  CollaborationProtocol,
  createCollaborationContext,
  AgentMessage,
  AgentCapability,
  parseAgentMentions,
} from '@core/ai/orchestration/agent-collaboration-protocol';
import { CollaborativeMessageDisplay } from './CollaborativeMessageDisplay';
import { useAuthStore } from '@shared/stores/authentication-store';
import { systemPromptsService } from '@core/ai/employees/prompt-management';
import { unifiedLLMService } from '@core/ai/llm/unified-language-model';

interface CollaborativeChatInterfaceProps {
  sessionId: string;
  initialAgents?: string[]; // Agent IDs to load initially
  onMessage?: (message: AgentMessage) => void;
  className?: string;
}

export const CollaborativeChatInterface: React.FC<
  CollaborativeChatInterfaceProps
> = ({ sessionId, initialAgents = [], onMessage, className }) => {
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [protocol, setProtocol] = useState<CollaborationProtocol | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [activeAgents, setActiveAgents] = useState<AgentCapability[]>([]);
  const [availableAgents, setAvailableAgents] = useState<AgentCapability[]>([]);
  const [selectedMode, setSelectedMode] = useState<'single' | 'team'>('team');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load available AI employees from system
  // Updated: Jan 15th 2026 - Wrapped in useCallback to fix React hooks warning
  const loadAvailableEmployees = useCallback(async () => {
    try {
      const employees = await systemPromptsService.getAvailableEmployees();
      const agents: AgentCapability[] = employees.map((emp) => ({
        agentId: emp.name,
        name: emp.description || emp.name,
        avatar: emp.metadata?.avatar,
        expertise: emp.metadata?.expertise || [],
        tools: emp.tools || [],
        systemPrompt: emp.systemPrompt,
        model: emp.model || 'claude-3-5-sonnet',
        temperature: 0.7,
      }));

      setAvailableAgents(agents);

      // Auto-load initial agents
      if (initialAgents.length > 0 && protocol) {
        initialAgents.forEach((agentId) => {
          const agent = agents.find((a) => a.agentId === agentId);
          if (agent) {
            protocol.registerAgent(agent);
          }
        });
        setActiveAgents(protocol.getActiveAgents());
      }
    } catch (error) {
      console.error('Failed to load AI employees:', error);
      toast.error('Failed to load AI employees');
    }
  }, [initialAgents, protocol]);

  // Initialize collaboration protocol
  useEffect(() => {
    if (!user) return;

    const context = createCollaborationContext(user.id, sessionId);
    const collab = new CollaborationProtocol(context);
    setProtocol(collab);

    // Load available AI employees
    loadAvailableEmployees();
  }, [user, sessionId, loadAvailableEmployees]);

  // Add agent to conversation
  const addAgent = (agentId: string) => {
    if (!protocol) return;

    const agent = availableAgents.find((a) => a.agentId === agentId);
    if (!agent) return;

    protocol.registerAgent(agent);
    setActiveAgents(protocol.getActiveAgents());

    const systemMessage: AgentMessage = {
      id: `system-${Date.now()}`,
      type: 'system',
      role: 'system',
      content: `${agent.name} joined the conversation`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, systemMessage]);
    protocol.addMessage(systemMessage);

    toast.success(`${agent.name} joined the conversation`);
  };

  // Remove agent from conversation
  const removeAgent = (agentId: string) => {
    if (!protocol) return;

    const agent = activeAgents.find((a) => a.agentId === agentId);
    if (!agent) return;

    protocol.removeAgent(agentId);
    setActiveAgents(protocol.getActiveAgents());

    const systemMessage: AgentMessage = {
      id: `system-${Date.now()}`,
      type: 'system',
      role: 'system',
      content: `${agent.name} left the conversation`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, systemMessage]);
    protocol.addMessage(systemMessage);

    toast.info(`${agent.name} left the conversation`);
  };

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || !protocol || !user) return;

    setIsProcessing(true);

    // Create user message
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    protocol.addMessage(userMessage);
    onMessage?.(userMessage);
    setInput('');

    // Determine which agents should respond
    let agentsToRespond: string[];

    if (selectedMode === 'single' && selectedAgent) {
      // Single agent mode
      agentsToRespond = [selectedAgent];
    } else {
      // Team mode - route based on mentions and expertise
      agentsToRespond = protocol.routeMessage(userMessage);
    }

    if (agentsToRespond.length === 0) {
      toast.error('No agents available to respond');
      setIsProcessing(false);
      return;
    }

    // Get responses from agents
    for (const agentId of agentsToRespond) {
      await getAgentResponse(agentId, userMessage);
    }

    setIsProcessing(false);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  };

  // Get response from specific agent
  const getAgentResponse = async (
    agentId: string,
    userMessage: AgentMessage
  ) => {
    if (!protocol) return;

    const agent = activeAgents.find((a) => a.agentId === agentId);
    if (!agent) return;

    try {
      // Get agent context (last 20 messages)
      const agentContext = protocol.getAgentContext(agentId, 20);

      // Determine if this is an intermediate or final response
      const isIntermediate = protocol.shouldOptimizeResponse(userMessage);

      // Create system prompt with collaboration context
      const systemPrompt = protocol.createAgentPrompt(agentId, isIntermediate);

      // Format messages for LLM
      const llmMessages = agentContext.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      // Add system prompt
      llmMessages.unshift({
        role: 'system',
        content: systemPrompt,
      });

      // Call LLM
      const response = await unifiedLLMService.sendMessage(llmMessages, {
        provider: agent.model.includes('claude')
          ? 'anthropic'
          : agent.model.includes('gpt')
            ? 'openai'
            : 'google',
        model: agent.model,
        temperature: agent.temperature,
        sessionId,
        userId: user?.id,
      });

      // Create agent message
      const agentMessage: AgentMessage = {
        id: `agent-${Date.now()}-${agentId}`,
        type: 'agent',
        role: 'assistant',
        content: response.content,
        agentId,
        agentName: agent.name,
        agentAvatar: agent.avatar,
        timestamp: new Date(),
        isIntermediate,
        metadata: {
          model: agent.model,
          tokensUsed: response.usage?.totalTokens,
          temperature: agent.temperature,
        },
      };

      setMessages((prev) => [...prev, agentMessage]);
      protocol.addMessage(agentMessage);
      onMessage?.(agentMessage);

      // If agent used tools, show tool messages
      // (This would be enhanced with actual tool execution)
    } catch (error) {
      console.error(`Error getting response from ${agent.name}:`, error);
      toast.error(`Failed to get response from ${agent.name}`);
    }
  };

  // Handle textarea key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              Collaborative Chat
              {activeAgents.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  with {activeAgents.length} AI{' '}
                  {activeAgents.length === 1 ? 'employee' : 'employees'}
                </span>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedMode} onValueChange={setSelectedMode}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team Mode</SelectItem>
                <SelectItem value="single">Single Agent</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Active Agents */}
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Active:</span>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {activeAgents.map((agent) => (
                <motion.div
                  key={agent.agentId}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Badge
                    variant="secondary"
                    className="flex items-center space-x-1 pr-1"
                  >
                    <Avatar className="h-4 w-4">
                      {agent.avatar ? (
                        <AvatarImage src={agent.avatar} alt={agent.name} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs text-white">
                          {agent.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>{agent.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive/20"
                      onClick={() => removeAgent(agent.agentId)}
                    >
                      ×
                    </Button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
            <Select onValueChange={addAgent}>
              <SelectTrigger className="h-7 w-32">
                <Plus className="mr-1 h-3 w-3" />
                <SelectValue placeholder="Add agent" />
              </SelectTrigger>
              <SelectContent>
                {availableAgents
                  .filter(
                    (agent) =>
                      !activeAgents.find((a) => a.agentId === agent.agentId)
                  )
                  .map((agent) => (
                    <SelectItem key={agent.agentId} value={agent.agentId}>
                      {agent.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="flex flex-1 flex-col p-0">
          {/* Messages Area */}
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <AnimatePresence>
              {messages.map((message) => (
                <CollaborativeMessageDisplay
                  key={message.id}
                  message={message}
                  showAvatar
                />
              ))}
            </AnimatePresence>

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-2 p-4 text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI employees are thinking...</span>
              </motion.div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            {selectedMode === 'single' && (
              <div className="mb-3">
                <Select
                  value={selectedAgent || ''}
                  onValueChange={setSelectedAgent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent to chat with" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAgents.map((agent) => (
                      <SelectItem key={agent.agentId} value={agent.agentId}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end space-x-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  selectedMode === 'team'
                    ? 'Ask the team... (use @AgentName to mention specific agents)'
                    : selectedAgent
                      ? `Chat with ${activeAgents.find((a) => a.agentId === selectedAgent)?.name}...`
                      : 'Select an agent first...'
                }
                className="min-h-[80px] resize-none"
                disabled={
                  isProcessing || (selectedMode === 'single' && !selectedAgent)
                }
              />
              <Button
                onClick={handleSend}
                disabled={
                  !input.trim() ||
                  isProcessing ||
                  (selectedMode === 'single' && !selectedAgent)
                }
                className="shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              <span>
                Tip: Use @AgentName to mention specific agents in team mode
              </span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CollaborativeChatInterface;
