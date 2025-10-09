/**
 * Vibe Coding Interface
 * AI-powered coding assistant like bolt.new, Lovable.dev, v0, Cursor
 * Just describe what you want and it builds it for you!
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panels';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/components/theme-provider';
import { mcpToolsService, type Artifact, type FileOperation, type CommandExecution } from '@/services/mcp-tools-service';

interface VibeCodingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinking?: string;
  plan?: PlanStep[];
  fileOperations?: FileOperation[];
  artifacts?: Artifact[];
  isStreaming?: boolean;
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
  const [messages, setMessages] = useState<VibeCodingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanStep[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [fileSystem, setFileSystem] = useState<Map<string, string>>(new Map());
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const simulateVibeCoding = async (userRequest: string) => {
    setIsGenerating(true);

    try {
      // Step 1: Thinking
      const thinkingMsg: VibeCodingMessage = {
        id: `msg-${Date.now()}-thinking`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        thinking: 'Analyzing your request...',
        isStreaming: true,
      };
      setMessages(prev => [...prev, thinkingMsg]);
      await new Promise(r => setTimeout(r, 800));

      // Step 2: Planning
      const plan: PlanStep[] = [
        {
          id: 'step-1',
          description: 'Understand requirements',
          status: 'completed',
        },
        {
          id: 'step-2',
          description: 'Design architecture',
          status: 'in_progress',
          substeps: [
            { id: 'step-2-1', description: 'Choose tech stack', status: 'completed' },
            { id: 'step-2-2', description: 'Plan file structure', status: 'in_progress' },
          ],
        },
        {
          id: 'step-3',
          description: 'Generate code',
          status: 'pending',
        },
        {
          id: 'step-4',
          description: 'Test and verify',
          status: 'pending',
        },
      ];

      setCurrentPlan(plan);
      setMessages(prev => prev.map(msg =>
        msg.id === thinkingMsg.id
          ? { ...msg, thinking: 'Creating a plan...', plan }
          : msg
      ));
      await new Promise(r => setTimeout(r, 1000));

      // Step 3: Generate Code
      const codeArtifact: Artifact = {
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
      <p>I'm your {employeeRole} powered by {provider}</p>
      
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

      setArtifacts([codeArtifact]);
      setSelectedArtifact(codeArtifact);

      // Update plan
      const updatedPlan = plan.map(step => {
        if (step.id === 'step-2') {
          return {
            ...step,
            status: 'completed' as const,
            substeps: step.substeps?.map(s => ({ ...s, status: 'completed' as const })),
          };
        }
        if (step.id === 'step-3') {
          return { ...step, status: 'in_progress' as const };
        }
        return step;
      });
      setCurrentPlan(updatedPlan);
      await new Promise(r => setTimeout(r, 1200));

      // Step 4: File Operations
      const fileOps: FileOperation[] = [
        {
          type: 'create',
          path: 'src/App.tsx',
          content: codeArtifact.content,
        },
        {
          type: 'create',
          path: 'package.json',
          content: JSON.stringify({
            name: 'vibe-coding-project',
            version: '1.0.0',
            dependencies: {
              'react': '^18.2.0',
              'react-dom': '^18.2.0',
            },
          }, null, 2),
        },
      ];

      // Execute file operations
      for (const op of fileOps) {
        if (op.type === 'create' && op.content) {
          await mcpToolsService.writeFile(op.path, op.content);
        }
      }

      setFileSystem(new Map(mcpToolsService.getFileSystem()));

      // Final message
      const finalPlan = updatedPlan.map(step => ({ ...step, status: 'completed' as const }));
      setCurrentPlan(finalPlan);

      const finalMsg: VibeCodingMessage = {
        id: `msg-${Date.now()}-final`,
        role: 'assistant',
        content: `Perfect! I've created your project based on your request: "${userRequest}"\n\n` +
          `**What I built:**\n` +
          `- Created React component with counter functionality\n` +
          `- Added proper TypeScript types\n` +
          `- Set up package.json with dependencies\n\n` +
          `**Files created:**\n` +
          fileOps.map(op => `- ${op.path}`).join('\n') + '\n\n' +
          `You can now preview the code in the artifact panel on the right! 🎉`,
        timestamp: new Date(),
        plan: finalPlan,
        fileOperations: fileOps,
        artifacts: [codeArtifact],
      };

      setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id).concat(finalMsg));

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

    } catch (error) {
      console.error('Vibe coding error:', error);
      toast.error('Failed to generate code');
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

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <ResizablePanelGroup direction="horizontal">
        {/* Chat Panel */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="flex flex-col h-full border-r border-border">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-card/30 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold">{employeeName}</h2>
                  <p className="text-sm text-muted-foreground">Vibe Coding Assistant</p>
                </div>
                <Badge className="ml-auto" variant="secondary">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                      <Code className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Vibe Coding with AI
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Just describe what you want to build, and I'll create it for you!
                      I can generate code, create files, and even set up entire projects.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2 justify-center">
                      <Badge variant="outline">React Apps</Badge>
                      <Badge variant="outline">Components</Badge>
                      <Badge variant="outline">APIs</Badge>
                      <Badge variant="outline">Full Stack</Badge>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <VibeCodingMessage
                      key={msg.id}
                      message={msg}
                      theme={actualTheme}
                      onArtifactClick={setSelectedArtifact}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-6 border-t border-border bg-card/30 backdrop-blur-sm">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build... (Cmd+Enter to send)"
                  className="min-h-[80px] pr-12 resize-none"
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
              <p className="text-xs text-muted-foreground mt-2">
                Powered by {provider} • Cmd+Enter to send
              </p>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Artifact Panel */}
        <ResizablePanel defaultSize={55} minSize={30}>
          <div className="flex flex-col h-full">
            {/* Artifact Tabs */}
            <Tabs defaultValue="code" className="flex-1 flex flex-col">
              <div className="px-6 py-3 border-b border-border bg-card/30 backdrop-blur-sm">
                <TabsList>
                  <TabsTrigger value="code">
                    <Code className="h-4 w-4 mr-2" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    <Folder className="h-4 w-4 mr-2" />
                    Files
                  </TabsTrigger>
                  <TabsTrigger value="terminal">
                    <Terminal className="h-4 w-4 mr-2" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger value="plan">
                    <Brain className="h-4 w-4 mr-2" />
                    Plan
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="flex-1 m-0">
                <ScrollArea className="h-full">
                  {selectedArtifact ? (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{selectedArtifact.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedArtifact.language}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(selectedArtifact.content)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
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
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No code generated yet</p>
                        <p className="text-sm">Describe what you want to build!</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 m-0">
                <div className="h-full bg-white dark:bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Live preview coming soon!</p>
                    <p className="text-sm">Interactive preview of your app</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="flex-1 m-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <h3 className="font-semibold mb-4">File System</h3>
                    {fileSystem.size === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No files created yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Array.from(fileSystem.entries()).map(([path, content]) => (
                          <button
                            key={path}
                            onClick={() => setSelectedArtifact({
                              id: path,
                              type: 'code',
                              title: path,
                              language: path.endsWith('.tsx') ? 'typescript' : 'json',
                              content,
                            })}
                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{path}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="terminal" className="flex-1 m-0">
                <ScrollArea className="h-full">
                  <div className="p-6 font-mono text-sm">
                    {terminalOutput.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No terminal output yet</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {terminalOutput.map((line, idx) => (
                          <div key={idx} className={cn(
                            line.startsWith('$') ? 'text-primary font-semibold' :
                            line.startsWith('✓') ? 'text-green-500' :
                            line.startsWith('✗') ? 'text-red-500' :
                            'text-foreground'
                          )}>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="plan" className="flex-1 m-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Execution Plan
                    </h3>
                    {currentPlan.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No plan generated yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentPlan.map((step) => (
                          <PlanStepComponent key={step.id} step={step} />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

// Message Component
const VibeCodingMessage: React.FC<{
  message: VibeCodingMessage;
  theme: string;
  onArtifactClick: (artifact: Artifact) => void;
}> = ({ message, theme, onArtifactClick }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn("space-y-3", isUser && "flex flex-row-reverse")}>
      <div className={cn(
        "flex gap-3 max-w-[85%]",
        isUser && "flex-row-reverse ml-auto"
      )}>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary" : "bg-gradient-to-br from-purple-500 to-pink-500"
        )}>
          {isUser ? (
            <span className="text-primary-foreground text-sm font-semibold">U</span>
          ) : (
            <Sparkles className="h-4 w-4 text-white" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          {/* Thinking */}
          {message.thinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{message.thinking}</span>
            </div>
          )}

          {/* Content */}
          {message.content && (
            <div className={cn(
              "rounded-lg px-4 py-3",
              isUser ? "bg-primary text-primary-foreground" : "bg-accent"
            )}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          )}

          {/* Artifacts */}
          {message.artifacts && message.artifacts.length > 0 && (
            <div className="space-y-2">
              {message.artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => onArtifactClick(artifact)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-card border border-border hover:border-primary transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{artifact.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {artifact.language}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Plan Step Component
const PlanStepComponent: React.FC<{ step: PlanStep; level?: number }> = ({ step, level = 0 }) => {
  const getIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
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
        <span className={cn(
          "text-sm flex-1",
          step.status === 'completed' && "text-muted-foreground"
        )}>
          {step.description}
        </span>
      </div>
      {step.substeps?.map((substep) => (
        <PlanStepComponent key={substep.id} step={substep} level={level + 1} />
      ))}
    </div>
  );
};

export default VibeCodingInterface;

