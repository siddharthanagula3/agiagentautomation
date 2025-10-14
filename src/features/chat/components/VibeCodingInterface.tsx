/**
 * Vibe Coding Interface
 * AI-powered coding assistant like bolt.new, Lovable.dev, v0, Cursor
 * Just describe what you want and it builds it for you!
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { ScrollArea } from '@shared/ui/scroll-area';
import { Textarea } from '@shared/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/ui/tooltip';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@shared/ui/resizable-panels';
import {
  Send,
  Loader2,
  Check,
  Code,
  Eye,
  Terminal,
  Folder,
  Play,
  Download,
  Copy,
  Sparkles,
  Brain,
  Zap,
  ChevronRight,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Users,
  ArrowRight,
  MessageCircle,
  Wrench,
  Palette,
  Database,
  Rocket,
  Shield,
  BarChart,
  PenTool,
  Briefcase,
  Bot,
  Cpu,
  Network,
  GitBranch,
  TestTube,
  Hammer,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscDarkPlus,
  vs,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@shared/components/theme-provider';
import {
  mcpToolsService,
  type Artifact,
  type FileOperation,
  type CommandExecution,
} from '@core/api/mcp-tools-service';
import {
  multiAgentOrchestrator,
  type AgentCommunication,
  type AgentStatus,
  type OrchestrationPlan,
} from '@core/orchestration/multi-agent-orchestrator';
import { AgentCollaborationGraph } from './AgentCollaborationGraph';
import { useAgentMetricsStore } from '@shared/stores/agent-metrics-store';

interface VibeCodingMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  agentName?: string; // Which agent sent this message
  agentRole?: string; // Agent's role
  content: string;
  timestamp: Date;
  messageType?:
    | 'chat'
    | 'status'
    | 'handoff'
    | 'collaboration'
    | 'thinking'
    | 'result';
  plan?: PlanStep[];
  fileOperations?: FileOperation[];
  artifacts?: Artifact[];
  isStreaming?: boolean;
  targetAgent?: string; // For handoff messages
  progress?: number; // For status updates
}

interface PlanStep {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  substeps?: PlanStep[];
}

interface Props {
  employeeName: string;
  employeeRole: string;
  provider: string;
  className?: string;
}

export const VibeCodingInterface: React.FC<Props> = ({
  employeeName,
  employeeRole,
  provider,
  className,
}) => {
  const { actualTheme } = useTheme();
  const metricsStore = useAgentMetricsStore();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<VibeCodingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanStep[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    null
  );
  const [fileSystem, setFileSystem] = useState<Map<string, string>>(new Map());
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [activeAgents, setActiveAgents] = useState<AgentStatus[]>([]);
  const [agentCommunications, setAgentCommunications] = useState<
    AgentCommunication[]
  >([]);
  const [typingAgent, setTypingAgent] = useState<string | null>(null);
  const [showAgentSidebar, setShowAgentSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper function to extract code blocks from LLM responses
  const extractCodeBlocks = (
    text: string
  ): Array<{ code: string; language: string; filename?: string }> => {
    const codeBlocks: Array<{
      code: string;
      language: string;
      filename?: string;
    }> = [];

    // Match markdown code blocks with language and optional filename
    const codeBlockRegex = /```(\w+)(?:\s+(.+?))?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'text';
      const filename = match[2]?.trim();
      const code = match[3].trim();

      codeBlocks.push({
        language,
        filename,
        code,
      });
    }

    return codeBlocks;
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const simulateVibeCoding = async (userRequest: string) => {
    setIsGenerating(true);
    setAgentCommunications([]);
    setActiveAgents([]);

    // Start new session in metrics store
    const sessionId = metricsStore.startSession({
      userId: 'current-user', // TODO: Get from auth store
      taskDescription: userRequest,
      agentsInvolved: [],
    });
    setCurrentSessionId(sessionId);

    try {
      // Step 1: Analyze intent and create plan
      const analysisMsg: VibeCodingMessage = {
        id: `msg-${Date.now()}-analysis`,
        role: 'system',
        content:
          '🧠 Analyzing your request and assembling the right AI team...',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, analysisMsg]);
      await new Promise(r => setTimeout(r, 800));

      const plan = await multiAgentOrchestrator.analyzeIntent(userRequest);

      // Show which agents are being assembled
      const agentListMsg: VibeCodingMessage = {
        id: `msg-${Date.now()}-agents`,
        role: 'system',
        content: `📋 **Execution Plan**: ${plan.intent}\n\n**AI Team Assembled:**\n${plan.requiredAgents.map(a => `• ${a.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n')}\n\n**Strategy**: ${plan.executionStrategy} execution\n**Tasks**: ${plan.tasks.length}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentListMsg]);
      await new Promise(r => setTimeout(r, 1000));

      // Step 2: Execute with multi-agent orchestrator
      const communications: AgentCommunication[] = [];

      const handleCommunication = (comm: AgentCommunication) => {
        communications.push(comm);
        setAgentCommunications(prev => [...prev, comm]);

        // Update metrics store
        metricsStore.addCommunication(comm);

        // Update session message count
        if (currentSessionId) {
          metricsStore.updateSession(currentSessionId, {
            messagesCount: communications.length,
          });
        }

        // Show typing indicator before adding message
        setTypingAgent(comm.from);

        // Determine message type and agent
        let messageType: VibeCodingMessage['messageType'] = 'chat';
        if (comm.type === 'handoff') messageType = 'handoff';
        else if (comm.type === 'collaboration') messageType = 'collaboration';
        else if (comm.type === 'status') messageType = 'status';
        else if (comm.type === 'response') messageType = 'result';

        // Delay to show typing indicator
        setTimeout(() => {
          // Add communication as a message with agent info
          const commMsg: VibeCodingMessage = {
            id: `comm-${comm.id}`,
            role: comm.from === 'System' ? 'system' : 'assistant',
            agentName: comm.from,
            content: comm.message,
            timestamp: comm.timestamp,
            messageType,
            targetAgent: comm.to !== 'user' ? comm.to : undefined,
          };
          setMessages(prev => [...prev, commMsg]);
          setTypingAgent(null);
        }, 800);
      };

      const handleStatusUpdate = (status: AgentStatus) => {
        setActiveAgents(prev => {
          const updated = prev.filter(a => a.agentName !== status.agentName);
          return [...updated, status];
        });

        // Update metrics store
        metricsStore.updateAgentStatus(status.agentName, status);

        // Add status update as a message when progress changes significantly
        if (
          status.progress === 30 ||
          status.progress === 60 ||
          status.progress === 90
        ) {
          const statusMsg: VibeCodingMessage = {
            id: `status-${Date.now()}-${status.agentName}`,
            role: 'assistant',
            agentName: status.agentName,
            content: `${status.currentTask || 'Working'}... ${status.progress}% complete`,
            timestamp: new Date(),
            messageType: 'status',
            progress: status.progress,
          };
          setMessages(prev => [...prev, statusMsg]);
        }
      };

      // Execute the orchestration plan
      const results = await multiAgentOrchestrator.executePlan(
        plan,
        handleCommunication,
        handleStatusUpdate
      );

      // Convert orchestration plan tasks to PlanSteps for UI
      const planSteps: PlanStep[] = plan.tasks.map(task => ({
        id: task.id,
        description: task.description,
        status: task.status,
      }));
      setCurrentPlan(planSteps);

      // Step 3: Extract Code Artifacts from orchestrator results
      const generatedArtifacts: Artifact[] = [];

      // Parse results for code blocks and extract plans/reasoning
      for (const [taskId, result] of results.entries()) {
        if (result.success && result.output) {
          // Extract plan/thinking section
          const planMatch = result.output.match(
            /## Plan\n([\s\S]*?)(?=\n##|```|$)/i
          );
          if (planMatch) {
            const thinkingMsg: VibeCodingMessage = {
              id: `thinking-${taskId}`,
              role: 'assistant',
              agentName:
                plan.tasks.find(t => t.id === taskId)?.assignedTo ||
                employeeName,
              content: `💭 **Thinking & Planning**\n\n${planMatch[1].trim()}`,
              timestamp: new Date(),
              messageType: 'thinking',
            };
            setMessages(prev => [...prev, thinkingMsg]);
          }

          // Extract code blocks
          const codeBlocks = extractCodeBlocks(result.output);

          codeBlocks.forEach((block, index) => {
            generatedArtifacts.push({
              id: `artifact-${taskId}-${index}`,
              type: 'code',
              title:
                block.filename || `Generated-${index + 1}.${block.language}`,
              language: block.language,
              content: block.code,
              metadata: {
                createdBy: employeeName,
                provider,
                taskId,
              },
            });
          });
        }
      }

      // If no code artifacts were generated, create a default one
      if (generatedArtifacts.length === 0) {
        const defaultArtifact: Artifact = {
          id: `artifact-${Date.now()}`,
          type: 'code',
          title: 'App.tsx',
          language: 'typescript',
          content: `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Hello from ${employeeName}!</h1>
      <p>I'm your ${employeeRole} powered by ${provider}</p>

      <div className="counter">
        <button onClick={() => setCount(count - 1)}>-</button>
        <span>{count}</span>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  );
}

export default App;`,
          metadata: {
            createdBy: employeeName,
            provider,
          },
        };
        generatedArtifacts.push(defaultArtifact);
      }

      setArtifacts(generatedArtifacts);
      setSelectedArtifact(generatedArtifacts[0]);

      // Update plan
      const updatedPlan = plan.map(step => {
        if (step.id === 'step-2') {
          return {
            ...step,
            status: 'completed' as const,
            substeps: step.substeps?.map(s => ({
              ...s,
              status: 'completed' as const,
            })),
          };
        }
        if (step.id === 'step-3') {
          return { ...step, status: 'in_progress' as const };
        }
        return step;
      });
      setCurrentPlan(updatedPlan);
      await new Promise(r => setTimeout(r, 1200));

      // Step 4: File Operations - Create files from generated artifacts
      const fileOps: FileOperation[] = generatedArtifacts.map(artifact => ({
        type: 'create' as const,
        path: `src/${artifact.title}`,
        content: artifact.content,
      }));

      // Add package.json if not already present
      if (!fileOps.some(op => op.path.includes('package.json'))) {
        fileOps.push({
          type: 'create',
          path: 'package.json',
          content: JSON.stringify(
            {
              name: 'vibe-coding-project',
              version: '1.0.0',
              dependencies: {
                react: '^18.2.0',
                'react-dom': '^18.2.0',
              },
            },
            null,
            2
          ),
        });
      }

      // Execute file operations
      for (const op of fileOps) {
        if (op.type === 'create' && op.content) {
          await mcpToolsService.writeFile(op.path, op.content);
        }
      }

      setFileSystem(new Map(mcpToolsService.getFileSystem()));

      // Final message
      const finalPlan = updatedPlan.map(step => ({
        ...step,
        status: 'completed' as const,
      }));
      setCurrentPlan(finalPlan);

      const finalMsg: VibeCodingMessage = {
        id: `msg-${Date.now()}-final`,
        role: 'assistant',
        agentName: employeeName,
        content:
          `✅ Perfect! I've completed your request: "${userRequest}"\n\n` +
          `**Generated Artifacts:**\n` +
          generatedArtifacts
            .map(a => `- ${a.title} (${a.language})`)
            .join('\n') +
          '\n\n' +
          `**Files Created:**\n` +
          fileOps.map(op => `- ${op.path}`).join('\n') +
          '\n\n' +
          `**Next Steps:**\n` +
          `- View the code in the Code tab →\n` +
          `- Check the Files tab to see all generated files\n` +
          `- Run \`npm install\` and \`npm run dev\` to start your app\n\n` +
          `You can now preview everything in the artifact panel on the right! 🎉`,
        timestamp: new Date(),
        plan: finalPlan,
        fileOperations: fileOps,
        artifacts: generatedArtifacts,
      };

      setMessages(prev => [...prev, finalMsg]);

      // Simulate terminal output
      setTerminalOutput(prev => [
        ...prev,
        '$ npm install',
        'Installing dependencies...',
        '✓ Dependencies installed successfully!',
        '',
        '$ npm run dev',
        '> Starting development server...',
        '✓ Server running on http://localhost:5173',
      ]);

      // Mark session as completed
      if (currentSessionId) {
        metricsStore.endSession(
          currentSessionId,
          'completed',
          'Task completed successfully'
        );
      }
    } catch (error) {
      console.error('Vibe coding error:', error);
      toast.error('Failed to generate code');

      // Mark session as failed
      if (currentSessionId) {
        metricsStore.endSession(
          currentSessionId,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: VibeCodingMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    await simulateVibeCoding(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  // Group consecutive messages from the same agent
  const groupMessages = (
    messages: VibeCodingMessage[]
  ): VibeCodingMessage[][] => {
    const groups: VibeCodingMessage[][] = [];
    let currentGroup: VibeCodingMessage[] = [];

    messages.forEach((msg, idx) => {
      if (
        idx === 0 ||
        msg.agentName !== messages[idx - 1].agentName ||
        msg.role !== messages[idx - 1].role
      ) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      <ResizablePanelGroup direction="horizontal">
        {/* Chat Panel */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="flex h-full flex-col border-r border-border">
            {/* Header */}
            <div className="border-b border-border bg-card/30 px-6 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold">{employeeName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Vibe Coding Assistant
                  </p>
                </div>
                <Badge className="ml-auto" variant="secondary">
                  <Zap className="mr-1 h-3 w-3" />
                  AI Powered
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="space-y-6 p-6">
                {messages.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                      <Code className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">
                      Vibe Coding with AI
                    </h3>
                    <p className="mx-auto max-w-md text-muted-foreground">
                      Just describe what you want to build, and I'll create it
                      for you! I can generate code, create files, and even set
                      up entire projects.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      <Badge variant="outline">React Apps</Badge>
                      <Badge variant="outline">Components</Badge>
                      <Badge variant="outline">APIs</Badge>
                      <Badge variant="outline">Full Stack</Badge>
                    </div>
                  </div>
                ) : (
                  <>
                    {groupMessages(messages).map((group, groupIdx) => (
                      <div key={`group-${groupIdx}`} className="space-y-2">
                        {group.map((msg, msgIdx) => (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            theme={actualTheme}
                            onArtifactClick={setSelectedArtifact}
                            showTimestamp={msgIdx === 0}
                            isGrouped={group.length > 1}
                          />
                        ))}
                      </div>
                    ))}
                    {/* Typing Indicator */}
                    <AnimatePresence>
                      {typingAgent && (
                        <AgentTypingIndicator agentName={typingAgent} />
                      )}
                    </AnimatePresence>
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border bg-card/30 p-6 backdrop-blur-sm">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build... (Cmd+Enter to send)"
                  className="min-h-[80px] resize-none pr-12"
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleSend}
                  disabled={isGenerating || !input.trim()}
                  size="icon"
                  className="absolute bottom-3 right-3"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Powered by {provider} • Cmd+Enter to send
              </p>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Artifact Panel */}
        <ResizablePanel defaultSize={55} minSize={30}>
          <div className="flex h-full flex-col">
            {/* Artifact Tabs */}
            <Tabs defaultValue="code" className="flex flex-1 flex-col">
              <div className="border-b border-border bg-card/30 px-6 py-3 backdrop-blur-sm">
                <TabsList>
                  <TabsTrigger value="code">
                    <Code className="mr-2 h-4 w-4" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    <Folder className="mr-2 h-4 w-4" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger value="terminal">
                    <Terminal className="mr-2 h-4 w-4" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger value="agents">
                    <Users className="mr-2 h-4 w-4" />
                    Agents
                  </TabsTrigger>
                  <TabsTrigger value="plan">
                    <Brain className="mr-2 h-4 w-4" />
                    Plan
                  </TabsTrigger>
                  <TabsTrigger value="graph">
                    <Network className="mr-2 h-4 w-4" />
                    Graph
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="m-0 flex-1">
                <ScrollArea className="h-full">
                  {selectedArtifact ? (
                    <div className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {selectedArtifact.title}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedArtifact.language}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(selectedArtifact.content)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                      <SyntaxHighlighter
                        language={selectedArtifact.language || 'typescript'}
                        style={actualTheme === 'dark' ? vscDarkPlus : vs}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                        }}
                      >
                        {selectedArtifact.content}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Code className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No code generated yet</p>
                        <p className="text-sm">
                          Describe what you want to build!
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preview" className="m-0 flex-1">
                <div className="flex h-full items-center justify-center bg-white dark:bg-gray-900">
                  <div className="text-center text-muted-foreground">
                    <Eye className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>Live preview coming soon!</p>
                    <p className="text-sm">Interactive preview of your app</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="m-0 flex-1">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <h3 className="mb-4 font-semibold">File System</h3>
                    {fileSystem.size === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <Folder className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No files created yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Array.from(fileSystem.entries()).map(
                          ([path, content]) => (
                            <button
                              key={path}
                              onClick={() =>
                                setSelectedArtifact({
                                  id: path,
                                  type: 'code',
                                  title: path,
                                  language: path.endsWith('.tsx')
                                    ? 'typescript'
                                    : 'json',
                                  content,
                                })
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left transition-colors hover:bg-accent"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{path}</span>
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="terminal" className="m-0 flex-1">
                <ScrollArea className="h-full">
                  <div className="p-6 font-mono text-sm">
                    {terminalOutput.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <Terminal className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No terminal output yet</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {terminalOutput.map((line, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              line.startsWith('$')
                                ? 'font-semibold text-primary'
                                : line.startsWith('✓')
                                  ? 'text-green-500'
                                  : line.startsWith('✗')
                                    ? 'text-red-500'
                                    : 'text-foreground'
                            )}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="agents" className="m-0 flex-1">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <Users className="h-5 w-5 text-primary" />
                      AI Employees Working
                    </h3>
                    {activeAgents.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No agents deployed yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeAgents.map(agent => (
                          <AgentStatusCard
                            key={agent.agentName}
                            agent={agent}
                          />
                        ))}

                        {agentCommunications.length > 0 && (
                          <div className="mt-6 border-t border-border pt-6">
                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                              <MessageCircle className="h-4 w-4" />
                              Agent Communications
                            </h4>
                            <div className="space-y-2">
                              {agentCommunications.slice(-5).map(comm => (
                                <div
                                  key={comm.id}
                                  className="rounded-lg bg-accent/30 p-3 text-sm"
                                >
                                  <div className="mb-1 flex items-center gap-2">
                                    <span className="text-xs font-medium">
                                      {comm.from}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-medium">
                                      {comm.to}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {comm.message}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="plan" className="m-0 flex-1">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold">
                      <Brain className="h-5 w-5 text-primary" />
                      Execution Plan
                    </h3>
                    {currentPlan.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <Brain className="mx-auto mb-4 h-12 w-12 opacity-50" />
                        <p>No plan generated yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentPlan.map(step => (
                          <PlanStepComponent key={step.id} step={step} />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="graph" className="m-0 flex-1">
                <AgentCollaborationGraph
                  agents={activeAgents}
                  communications={agentCommunications}
                  onAgentClick={agentName => {
                    // Scroll to agent's messages in chat
                    const agentMessages = messages.filter(
                      m => m.agentName === agentName
                    );
                    if (agentMessages.length > 0) {
                      scrollToBottom();
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        {/* Agent Status Sidebar */}
        {showAgentSidebar && activeAgents.length > 0 && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <div className="flex h-full flex-col border-l border-border bg-card/20 backdrop-blur-sm">
                {/* Header */}
                <div className="border-b border-border bg-card/30 px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Users className="h-4 w-4 text-primary" />
                      Active Agents
                      <Badge variant="secondary" className="text-xs">
                        {activeAgents.length}
                      </Badge>
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAgentSidebar(false)}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Agent Cards */}
                <ScrollArea className="flex-1">
                  <div className="space-y-3 p-4">
                    {activeAgents.map(agent => (
                      <motion.div
                        key={agent.agentName}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-2"
                      >
                        <EnhancedAgentStatusCard agent={agent} />
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </>
        )}

        {/* Show sidebar button when hidden */}
        {!showAgentSidebar && activeAgents.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAgentSidebar(true)}
            className="absolute right-4 top-4 z-10"
          >
            <Users className="mr-2 h-4 w-4" />
            Show Agents ({activeAgents.length})
          </Button>
        )}
      </ResizablePanelGroup>
    </div>
  );
};

// Agent Typing Indicator Component
const AgentTypingIndicator: React.FC<{ agentName: string }> = ({
  agentName,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3"
    >
      <AgentAvatar agentName={agentName} role="assistant" />
      <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-accent/80 px-4 py-2 dark:bg-accent/40">
        <span className="text-sm text-muted-foreground">
          {agentName} is typing
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Code Artifact Preview Component
const CodeArtifactPreview: React.FC<{
  artifact: Artifact;
  theme: string;
  onCopy: (code: string) => void;
}> = ({ artifact, theme, onCopy }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const lineCount = artifact.content.split('\n').length;
  const previewLines = artifact.content.split('\n').slice(0, 5).join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-2 overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm dark:bg-card/40"
    >
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
            <FileText className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-medium">{artifact.title}</span>
          <Badge variant="secondary" className="text-xs">
            {artifact.language}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {lineCount} lines
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(artifact.content)}
            className="h-7 px-2"
          >
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 px-2"
          >
            <Eye className="mr-1 h-3.5 w-3.5" />
            {isExpanded ? 'Collapse' : 'View Full'}
          </Button>
        </div>
      </div>
      <div className="max-h-[300px] overflow-auto">
        <SyntaxHighlighter
          language={artifact.language || 'typescript'}
          style={theme === 'dark' ? vscDarkPlus : vs}
          customStyle={{
            margin: 0,
            fontSize: '0.813rem',
            background: 'transparent',
          }}
          showLineNumbers
        >
          {isExpanded ? artifact.content : previewLines}
        </SyntaxHighlighter>
        {!isExpanded && lineCount > 5 && (
          <div className="border-t border-border/30 bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground">
            Click "View Full" to see all {lineCount} lines
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Multi-Stage Progress Indicator Component
const MultiStageProgress: React.FC<{
  progress: number;
  stages?: { label: string; value: number }[];
}> = ({ progress, stages }) => {
  const defaultStages = [
    { label: 'Start', value: 0 },
    { label: 'Planning', value: 25 },
    { label: 'Building', value: 50 },
    { label: 'Testing', value: 75 },
    { label: 'Complete', value: 100 },
  ];

  const milestones = stages || defaultStages;

  return (
    <div className="space-y-2">
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex items-center justify-between">
        {milestones.map((milestone, idx) => {
          const isActive = progress >= milestone.value;
          const isCurrent =
            progress >= milestone.value &&
            (idx === milestones.length - 1 ||
              progress < milestones[idx + 1].value);

          return (
            <div
              key={milestone.label}
              className="flex flex-col items-center gap-1"
            >
              <motion.div
                className={cn(
                  'h-2 w-2 rounded-full border-2 transition-colors',
                  isActive
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30 bg-background'
                )}
                animate={isCurrent ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {milestone.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Agent Avatar Component with Icons and Status
interface AgentAvatarProps {
  agentName?: string;
  role?: 'user' | 'assistant' | 'system';
  status?:
    | 'idle'
    | 'analyzing'
    | 'working'
    | 'waiting'
    | 'completed'
    | 'blocked'
    | 'error';
  showTooltip?: boolean;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agentName,
  role,
  status,
  showTooltip = true,
}) => {
  // User avatar
  if (role === 'user') {
    return (
      <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
        <Users className="h-4 w-4 text-white" />
      </div>
    );
  }

  // Get agent style based on name/role
  const getAgentConfig = (
    name?: string
  ): {
    bg: string;
    icon: LucideIcon;
    category: string;
    description: string;
  } => {
    const nameLower = name?.toLowerCase() || '';

    // Architecture & Design
    if (nameLower.includes('architect')) {
      return {
        bg: 'from-blue-500 to-indigo-600',
        icon: Hammer,
        category: 'Architecture',
        description: 'System architecture and design',
      };
    }

    // Frontend Development
    if (
      nameLower.includes('frontend') ||
      nameLower.includes('ui') ||
      nameLower.includes('design')
    ) {
      return {
        bg: 'from-green-500 to-emerald-600',
        icon: Palette,
        category: 'Frontend',
        description: 'UI/UX and frontend development',
      };
    }

    // Backend Development
    if (nameLower.includes('backend') || nameLower.includes('api')) {
      return {
        bg: 'from-orange-500 to-red-600',
        icon: Database,
        category: 'Backend',
        description: 'Backend services and APIs',
      };
    }

    // DevOps & Infrastructure
    if (
      nameLower.includes('devops') ||
      nameLower.includes('infrastructure') ||
      nameLower.includes('deploy')
    ) {
      return {
        bg: 'from-purple-500 to-violet-600',
        icon: Rocket,
        category: 'DevOps',
        description: 'Infrastructure and deployment',
      };
    }

    // QA & Testing
    if (
      nameLower.includes('qa') ||
      nameLower.includes('test') ||
      nameLower.includes('quality')
    ) {
      return {
        bg: 'from-yellow-500 to-amber-600',
        icon: TestTube,
        category: 'QA',
        description: 'Quality assurance and testing',
      };
    }

    // Security
    if (nameLower.includes('security') || nameLower.includes('sec')) {
      return {
        bg: 'from-red-600 to-pink-600',
        icon: Shield,
        category: 'Security',
        description: 'Security and compliance',
      };
    }

    // Data & Analytics
    if (
      nameLower.includes('data') ||
      nameLower.includes('analytics') ||
      nameLower.includes('analyst')
    ) {
      return {
        bg: 'from-cyan-500 to-blue-600',
        icon: BarChart,
        category: 'Data',
        description: 'Data analysis and insights',
      };
    }

    // Content & Writing
    if (
      nameLower.includes('content') ||
      nameLower.includes('writer') ||
      nameLower.includes('copy')
    ) {
      return {
        bg: 'from-pink-500 to-rose-600',
        icon: PenTool,
        category: 'Content',
        description: 'Content creation and writing',
      };
    }

    // Business & Management
    if (
      nameLower.includes('manager') ||
      nameLower.includes('business') ||
      nameLower.includes('ceo') ||
      nameLower.includes('cto')
    ) {
      return {
        bg: 'from-indigo-600 to-purple-700',
        icon: Briefcase,
        category: 'Management',
        description: 'Business and management',
      };
    }

    // AI/ML & Intelligence
    if (
      nameLower.includes('ai') ||
      nameLower.includes('ml') ||
      nameLower.includes('intelligence')
    ) {
      return {
        bg: 'from-violet-500 to-fuchsia-600',
        icon: Brain,
        category: 'AI/ML',
        description: 'Artificial intelligence and ML',
      };
    }

    // Code & Development
    if (
      nameLower.includes('developer') ||
      nameLower.includes('engineer') ||
      nameLower.includes('code')
    ) {
      return {
        bg: 'from-emerald-500 to-teal-600',
        icon: Code,
        category: 'Development',
        description: 'Software development',
      };
    }

    // Network & Integration
    if (nameLower.includes('network') || nameLower.includes('integration')) {
      return {
        bg: 'from-sky-500 to-blue-600',
        icon: Network,
        category: 'Network',
        description: 'Network and integrations',
      };
    }

    // Version Control & Git
    if (nameLower.includes('git') || nameLower.includes('version')) {
      return {
        bg: 'from-orange-600 to-red-700',
        icon: GitBranch,
        category: 'Version Control',
        description: 'Version control and Git',
      };
    }

    // System/General
    if (nameLower.includes('system')) {
      return {
        bg: 'from-gray-600 to-gray-700',
        icon: Cpu,
        category: 'System',
        description: 'System operations',
      };
    }

    // Default
    return {
      bg: 'from-purple-500 to-pink-500',
      icon: Bot,
      category: 'AI Agent',
      description: 'AI assistant',
    };
  };

  const config = getAgentConfig(agentName);
  const Icon = config.icon;

  // Get status indicator color
  const getStatusColor = () => {
    switch (status) {
      case 'working':
      case 'analyzing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
      case 'blocked':
        return 'bg-red-500';
      case 'waiting':
        return 'bg-orange-500';
      case 'idle':
      default:
        return 'bg-gray-400';
    }
  };

  const avatar = (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-md transition-all',
          'bg-gradient-to-br',
          config.bg
        )}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>

      {/* Status Indicator Dot */}
      {status && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
        >
          <div className={cn('h-full w-full rounded-full', getStatusColor())}>
            {(status === 'working' || status === 'analyzing') && (
              <motion.div
                className="h-full w-full rounded-full bg-current"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  // Wrap with tooltip if enabled and has agent name
  if (showTooltip && agentName) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{avatar}</TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="text-sm font-semibold">{agentName}</p>
              <p className="text-xs text-muted-foreground">{config.category}</p>
              <p className="text-xs">{config.description}</p>
              {status && (
                <div className="flex items-center gap-1.5 pt-1">
                  <div
                    className={cn('h-2 w-2 rounded-full', getStatusColor())}
                  />
                  <span className="text-xs capitalize">{status}</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatar;
};

// Message Component
const MessageBubble: React.FC<{
  message: VibeCodingMessage;
  theme: string;
  onArtifactClick: (artifact: Artifact) => void;
  showTimestamp?: boolean;
  isGrouped?: boolean;
  agentStatus?: AgentStatus['status'];
}> = ({
  message,
  theme,
  onArtifactClick,
  showTimestamp = true,
  isGrouped = false,
  agentStatus,
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isHandoff = message.messageType === 'handoff';
  const isStatus = message.messageType === 'status';
  const isThinking = message.messageType === 'thinking';

  // Determine status from message type if not explicitly provided
  const derivedStatus =
    agentStatus ||
    (message.messageType === 'status'
      ? 'working'
      : message.messageType === 'result'
        ? 'completed'
        : message.messageType === 'handoff'
          ? 'analyzing'
          : message.messageType === 'thinking'
            ? 'analyzing'
            : undefined);

  return (
    <div className="space-y-2 duration-300 animate-in fade-in slide-in-from-bottom-4">
      <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
        {/* Show avatar only for first message in group */}
        {!isGrouped || showTimestamp ? (
          <AgentAvatar
            agentName={message.agentName}
            role={message.role}
            status={derivedStatus}
          />
        ) : (
          <div className="w-8" /> /* Spacer for alignment */
        )}

        <div className="max-w-[85%] flex-1 space-y-2">
          {/* Agent Name & Metadata - only for first message in group */}
          {!isUser && message.agentName && showTimestamp && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {message.agentName}
              </span>
              {message.messageType && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    message.messageType === 'handoff' &&
                      'border-blue-500 text-blue-600 dark:text-blue-400',
                    message.messageType === 'status' &&
                      'border-orange-500 text-orange-600 dark:text-orange-400',
                    message.messageType === 'result' &&
                      'border-green-500 text-green-600 dark:text-green-400',
                    message.messageType === 'thinking' &&
                      'border-purple-500 text-purple-600 dark:text-purple-400'
                  )}
                >
                  {message.messageType === 'handoff'
                    ? '📞 calling'
                    : message.messageType === 'status'
                      ? '⚡ working'
                      : message.messageType === 'result'
                        ? '✅ completed'
                        : message.messageType === 'thinking'
                          ? '💭 thinking'
                          : message.messageType}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {/* Enhanced Handoff Message with Animation */}
          {isHandoff && message.targetAgent && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 dark:border-blue-800/50 dark:from-blue-950/30 dark:to-indigo-950/30"
            >
              {/* Animated background effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />

              <div className="relative flex items-center gap-3">
                {/* From Agent */}
                <div className="flex items-center gap-2">
                  <AgentAvatar
                    agentName={message.agentName}
                    role="assistant"
                    status="completed"
                  />
                  <span className="text-sm font-semibold">
                    {message.agentName}
                  </span>
                </div>

                {/* Animated Arrow */}
                <motion.div
                  animate={{ x: [0, 8, 0] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </motion.div>

                {/* To Agent */}
                <div className="flex items-center gap-2">
                  <AgentAvatar
                    agentName={message.targetAgent}
                    role="assistant"
                    status="analyzing"
                  />
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {message.targetAgent}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Thinking/Planning Display */}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 dark:border-purple-800/50 dark:from-purple-950/20 dark:to-indigo-950/20"
            >
              <div className="mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  Agent Reasoning
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {message.content}
              </p>
            </motion.div>
          )}

          {/* Status Message with Multi-Stage Progress */}
          {isStatus && message.progress !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 dark:border-orange-800/50 dark:from-orange-950/20 dark:to-amber-950/20"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {message.content}
                </span>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {message.progress}%
                </Badge>
              </div>
              <MultiStageProgress progress={message.progress} />
            </motion.div>
          )}

          {/* Regular Content */}
          {!isHandoff && !isStatus && !isThinking && message.content && (
            <div
              className={cn(
                'rounded-xl px-4 py-3 shadow-sm',
                isUser
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : isSystem
                    ? 'border border-border/50 bg-muted/50 backdrop-blur-sm'
                    : 'border border-border/30 bg-accent/80 dark:bg-accent/40'
              )}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
            </div>
          )}

          {/* Artifacts with Preview */}
          {message.artifacts && message.artifacts.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.artifacts.map(artifact => (
                <CodeArtifactPreview
                  key={artifact.id}
                  artifact={artifact}
                  theme={theme}
                  onCopy={code => {
                    navigator.clipboard.writeText(code);
                    toast.success('Code copied to clipboard!');
                    onArtifactClick(artifact);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Agent Status Card for Sidebar
const EnhancedAgentStatusCard: React.FC<{ agent: AgentStatus }> = ({
  agent,
}) => {
  const getStatusColor = () => {
    switch (agent.status) {
      case 'working':
        return 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20';
      case 'completed':
        return 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20';
      case 'analyzing':
        return 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20';
      case 'waiting':
        return 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20';
      case 'idle':
        return 'border-gray-500/50 bg-gray-50/50 dark:bg-gray-950/20';
      default:
        return 'border-gray-500/50 bg-gray-50/50 dark:bg-gray-950/20';
    }
  };

  const getStatusIcon = () => {
    switch (agent.status) {
      case 'working':
      case 'analyzing':
        return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'waiting':
        return <Circle className="h-3.5 w-3.5" />;
      default:
        return <Circle className="h-3.5 w-3.5" />;
    }
  };

  return (
    <motion.div
      layout
      className={cn('rounded-lg border p-3 transition-all', getStatusColor())}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AgentAvatar
            agentName={agent.agentName}
            role="assistant"
            status={agent.status}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {getStatusIcon()}
              <span className="truncate text-xs font-semibold">
                {agent.agentName}
              </span>
            </div>
            <Badge variant="outline" className="mt-0.5 h-4 text-[10px]">
              {agent.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Current Task */}
      {agent.currentTask && (
        <p className="mb-2 line-clamp-2 text-[11px] text-muted-foreground">
          {agent.currentTask}
        </p>
      )}

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{agent.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-background">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${agent.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Tools Using */}
      {agent.toolsUsing && agent.toolsUsing.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {agent.toolsUsing.slice(0, 3).map((tool, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="h-4 px-1.5 text-[10px]"
            >
              {tool}
            </Badge>
          ))}
          {agent.toolsUsing.length > 3 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              +{agent.toolsUsing.length - 3}
            </Badge>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Agent Status Card Component (for Agents tab)
const AgentStatusCard: React.FC<{ agent: AgentStatus }> = ({ agent }) => {
  const getStatusColor = () => {
    switch (agent.status) {
      case 'working':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';
      case 'completed':
        return 'text-green-500 bg-green-50 dark:bg-green-950/30';
      case 'analyzing':
        return 'text-purple-500 bg-purple-50 dark:bg-purple-950/30';
      case 'waiting':
        return 'text-orange-500 bg-orange-50 dark:bg-orange-950/30';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-950/30';
    }
  };

  const getStatusIcon = () => {
    switch (agent.status) {
      case 'working':
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'waiting':
        return <Circle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={cn('rounded-lg border p-4 transition-all', getStatusColor())}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-semibold">{agent.agentName}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {agent.status.replace('_', ' ')}
        </Badge>
      </div>

      {agent.currentTask && (
        <p className="mb-3 text-sm text-muted-foreground">
          {agent.currentTask}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold">{agent.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-background">
          <div
            className="h-full bg-current transition-all duration-500"
            style={{ width: `${agent.progress}%` }}
          />
        </div>
      </div>

      {agent.toolsUsing && agent.toolsUsing.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {agent.toolsUsing.map((tool, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tool}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// Plan Step Component
const PlanStepComponent: React.FC<{ step: PlanStep; level?: number }> = ({
  step,
  level = 0,
}) => {
  const getIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-2" style={{ marginLeft: `${level * 1.5}rem` }}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <span
          className={cn(
            'flex-1 text-sm',
            step.status === 'completed' && 'text-muted-foreground'
          )}
        >
          {step.description}
        </span>
      </div>
      {step.substeps?.map(substep => (
        <PlanStepComponent key={substep.id} step={substep} level={level + 1} />
      ))}
    </div>
  );
};

export default VibeCodingInterface;
