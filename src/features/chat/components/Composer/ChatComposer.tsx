import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';
import { Badge } from '@shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/ui/tooltip';
import {
  Send,
  Paperclip,
  X,
  Loader2,
  Sparkles,
  Users,
  Plus,
  ChevronDown,
  Zap,
  Image as ImageIcon,
  Video,
  FileText,
  Search,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { ChatMode, Tool } from '../../types';
import { PromptShortcuts } from '../PromptShortcuts';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { useNavigate } from 'react-router-dom';

interface AIEmployee {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  color: string;
  status?: 'idle' | 'working' | 'thinking';
}

interface Model {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
  recommended?: 'coding' | 'general' | 'creative';
}

interface ChatComposerProps {
  onSendMessage: (
    content: string,
    options?: {
      attachments?: File[];
      model?: string;
      employees?: string[];
    }
  ) => Promise<void>;
  isLoading: boolean;
  availableTools?: Tool[];
  onToolToggle?: (toolId: string) => void;
  selectedMode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
  availableEmployees?: AIEmployee[];
  availableModels?: Model[];
}

const DEFAULT_MODELS: Model[] = [
  {
    id: 'gpt-5-thinking',
    name: 'GPT-5 Thinking',
    description: 'Advanced reasoning and complex problem solving',
    provider: 'openai',
    recommended: 'general',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Best for general tasks',
    provider: 'openai',
    recommended: 'general',
  },
  {
    id: 'claude-sonnet-4-5-thinking',
    name: 'Claude Sonnet 4.5 Thinking',
    description: 'Extended reasoning for complex coding tasks',
    provider: 'anthropic',
    recommended: 'coding',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Best for coding & analysis',
    provider: 'anthropic',
    recommended: 'coding',
  },
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    description: 'Advanced multimodal AI for creative tasks',
    provider: 'google',
    recommended: 'creative',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Best for creative tasks',
    provider: 'google',
    recommended: 'creative',
  },
];

const DEFAULT_EMPLOYEES: AIEmployee[] = [
  {
    id: 'auto',
    name: 'Auto-Select',
    description: 'Let AI choose the best employees',
    color: '#6366f1',
  },
];

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isLoading,
  selectedMode = 'team',
  availableEmployees = DEFAULT_EMPLOYEES,
  availableModels = DEFAULT_MODELS,
}) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  // Model selection removed - AI employees use their own configured models
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([
    'auto',
  ]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [textareaHeight, setTextareaHeight] = useState(80);
  const [showPromptShortcuts, setShowPromptShortcuts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '80px';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 80), 200);
      textareaRef.current.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
    }
  }, [message]);

  const handleSubmit = async () => {
    if (!message.trim() && attachments.length === 0) return;

    try {
      // Prefix message with tool indicators
      const toolPrefix = getToolPromptPrefix();
      const finalMessage = toolPrefix + message;

      await onSendMessage(finalMessage, {
        attachments,
        // Model selection removed - AI employees use their own configured models
        employees: selectedEmployees,
      });
      setMessage('');
      setAttachments([]);
      setSelectedTools([]); // Clear selected tools after sending
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleEmployee = (employeeId: string) => {
    if (employeeId === 'auto') {
      setSelectedEmployees(['auto']);
    } else {
      setSelectedEmployees((prev) => {
        const filtered = prev.filter((id) => id !== 'auto');
        if (filtered.includes(employeeId)) {
          return filtered.filter((id) => id !== employeeId);
        } else {
          return [...filtered, employeeId];
        }
      });
    }
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((id) => id !== toolId);
      } else {
        return [...prev, toolId];
      }
    });
  };

  const getToolPromptPrefix = () => {
    if (selectedTools.length === 0) return '';

    const toolPrefixes: Record<string, string> = {
      image: '🖼️ [Generate Image] ',
      video: '🎥 [Generate Video] ',
      document: '📄 [Create Document] ',
      search: '🔍 [Web Search] ',
    };

    return selectedTools.map((tool) => toolPrefixes[tool] || '').join('');
  };

  const handleSelectPrompt = (prompt: string) => {
    setMessage(prompt + ' ');
    setShowPromptShortcuts(false);
    // Focus on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4 shadow-sm">
      {/* Top Bar: Employee Selection */}
      <div className="flex items-center gap-2">
        {/* Prompt Shortcuts Button */}
        <Popover
          open={showPromptShortcuts}
          onOpenChange={setShowPromptShortcuts}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-xs"
              disabled={isLoading}
              title="Quick prompt shortcuts"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Prompts</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[400px] p-0">
            <PromptShortcuts onSelectPrompt={handleSelectPrompt} />
          </PopoverContent>
        </Popover>

        {/* Employee Selector - Avatar Chips */}
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          <TooltipProvider delayDuration={200}>
            {availableEmployees.map((employee) => {
              const isSelected = selectedEmployees.includes(employee.id);
              return (
                <Tooltip key={employee.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleEmployee(employee.id)}
                      className={cn(
                        'group relative flex-shrink-0 transition-all duration-200',
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'opacity-60 hover:opacity-100'
                      )}
                      disabled={isLoading}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback
                          className="text-xs font-semibold text-white"
                          style={{ backgroundColor: employee.color }}
                        >
                          {employee.id === 'auto'
                            ? '✨'
                            : employee.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                        </AvatarFallback>
                      </Avatar>
                      {employee.status && employee.status !== 'idle' && (
                        <div
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
                            employee.status === 'working' && 'bg-green-500',
                            employee.status === 'thinking' &&
                              'animate-pulse bg-yellow-500'
                          )}
                        />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {employee.description}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Add Employee Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    navigate('/marketplace');
                  }}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary hover:bg-muted"
                  disabled={isLoading}
                >
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div>Hire more AI employees</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Team Mode Indicator */}
        {selectedEmployees.length > 1 &&
          !selectedEmployees.includes('auto') && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 text-xs"
            >
              <Users className="h-3 w-3" />
              Team
            </Badge>
          )}
      </div>

      {/* Tool Selection Strip */}
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-2 sm:px-3">
        <span className="hidden text-xs font-medium text-muted-foreground sm:inline">Tools:</span>
        <TooltipProvider delayDuration={200}>
          {/* Image Generation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTools.includes('image') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => toggleTool('image')}
                className={cn(
                  'h-7 w-7 p-0 transition-all sm:h-8 sm:w-8',
                  selectedTools.includes('image') && 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2'
                )}
                disabled={isLoading}
              >
                <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <div className="font-medium">Image Generation</div>
                <div className="text-xs text-muted-foreground">
                  Generate images with DALL-E
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Video Generation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTools.includes('video') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => toggleTool('video')}
                className={cn(
                  'h-7 w-7 p-0 transition-all sm:h-8 sm:w-8',
                  selectedTools.includes('video') && 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2'
                )}
                disabled={isLoading}
              >
                <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <div className="font-medium">Video Generation</div>
                <div className="text-xs text-muted-foreground">
                  Generate videos from text
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Document Generation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTools.includes('document') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => toggleTool('document')}
                className={cn(
                  'h-7 w-7 p-0 transition-all sm:h-8 sm:w-8',
                  selectedTools.includes('document') && 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2'
                )}
                disabled={isLoading}
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <div className="font-medium">Document Generation</div>
                <div className="text-xs text-muted-foreground">
                  Create documents with Claude AI
                </div>
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Web Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={selectedTools.includes('search') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => toggleTool('search')}
                className={cn(
                  'h-7 w-7 p-0 transition-all sm:h-8 sm:w-8',
                  selectedTools.includes('search') && 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2'
                )}
                disabled={isLoading}
              >
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <div className="font-medium">Web Search</div>
                <div className="text-xs text-muted-foreground">
                  Search the web for real-time information
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Active Tools Indicator */}
        {selectedTools.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {selectedTools.length} selected
          </Badge>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-md border border-border bg-muted/30 p-2">
          {attachments.map((file, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1.5"
            >
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[200px] truncate text-xs">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedEmployees.includes('auto') ? 'AI Team' : selectedEmployees.length > 1 ? `${selectedEmployees.length} employees` : 'AI'}...`}
            className="scrollbar-thin min-h-[80px] resize-none pr-12"
            style={{ height: `${textareaHeight}px` }}
            disabled={isLoading}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-2 right-2 h-8 w-8 p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading || (!message.trim() && attachments.length === 0)}
          className="h-[80px] px-6"
          style={{ height: `${textareaHeight}px` }}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span className="hidden sm:inline">
          Press{' '}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            Enter
          </kbd>{' '}
          to send,{' '}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            Shift+Enter
          </kbd>{' '}
          for new line
        </span>
        {message.length > 0 && (
          <span className="text-muted-foreground/70">
            {message.length} char{message.length !== 1 && 's'}
          </span>
        )}
      </div>
    </div>
  );
};
