/**
 * ChatComposer - Modern, minimal chat input
 *
 * Redesigned with:
 * - Single-line input that expands
 * - Tools hidden behind + button (like Claude.ai)
 * - @mention for employee selection
 * - Clean, focused design
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';
import { Badge } from '@shared/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@shared/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@shared/ui/command';
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
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Search,
  Sparkles,
  ArrowUp,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { ChatMode, Tool } from '../../types';

interface AIEmployee {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  color: string;
  status?: 'idle' | 'working' | 'thinking';
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
  placeholder?: string;
}

const TOOLS = [
  { id: 'image', label: 'Generate Image', icon: ImageIcon, color: 'text-purple-500' },
  { id: 'video', label: 'Generate Video', icon: Video, color: 'text-pink-500' },
  { id: 'document', label: 'Create Document', icon: FileText, color: 'text-blue-500' },
  { id: 'search', label: 'Web Search', icon: Search, color: 'text-green-500' },
];

const DEFAULT_EMPLOYEES: AIEmployee[] = [
  {
    id: 'auto',
    name: 'Auto-Select',
    description: 'Let AI choose the best employee',
    color: '#6366f1',
  },
];

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isLoading,
  availableEmployees = DEFAULT_EMPLOYEES,
  placeholder = 'Message AI...',
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(['auto']);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [showTools, setShowTools] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 52), 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  // Handle @mention detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setMessage(value);

    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // If there's no space after @, show mention picker
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        return;
      }
    }
    setShowMentions(false);
  }, []);

  // Filter employees for mention
  const filteredEmployees = availableEmployees.filter(emp =>
    emp.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    emp.description.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Handle mention selection
  const handleMentionSelect = useCallback((employee: AIEmployee) => {
    if (mentionStartIndex === -1) return;

    const before = message.substring(0, mentionStartIndex);
    const cursorPos = textareaRef.current?.selectionStart || message.length;
    const after = message.substring(cursorPos);

    const newMessage = `${before}@${employee.name} ${after}`;
    setMessage(newMessage);
    setShowMentions(false);

    // Add to selected employees
    if (employee.id !== 'auto') {
      setSelectedEmployees(prev => {
        const filtered = prev.filter(id => id !== 'auto');
        if (!filtered.includes(employee.id)) {
          return [...filtered, employee.id];
        }
        return filtered;
      });
    } else {
      setSelectedEmployees(['auto']);
    }

    // Focus back on textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [message, mentionStartIndex]);

  const handleSubmit = async () => {
    if (!message.trim() && attachments.length === 0) return;

    try {
      // Build tool prefix
      const toolPrefixes: Record<string, string> = {
        image: '🖼️ [Generate Image] ',
        video: '🎥 [Generate Video] ',
        document: '📄 [Create Document] ',
        search: '🔍 [Web Search] ',
      };
      const prefix = selectedTools.map(t => toolPrefixes[t] || '').join('');

      await onSendMessage(prefix + message, {
        attachments,
        employees: selectedEmployees,
      });

      setMessage('');
      setAttachments([]);
      setSelectedTools([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSubmit();
    }
    // Close mentions on Escape
    if (e.key === 'Escape' && showMentions) {
      setShowMentions(false);
    }
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId) ? prev.filter(t => t !== toolId) : [...prev, toolId]
    );
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => {
      const filtered = prev.filter(id => id !== employeeId);
      return filtered.length === 0 ? ['auto'] : filtered;
    });
  };

  const canSend = (message.trim() || attachments.length > 0) && !isLoading;

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 pb-4">
      {/* Selected Employees (if not auto) */}
      {selectedEmployees.length > 0 && !selectedEmployees.includes('auto') && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Assigned to:</span>
          {selectedEmployees.map(empId => {
            const emp = availableEmployees.find(e => e.id === empId);
            if (!emp) return null;
            return (
              <Badge
                key={empId}
                variant="secondary"
                className="gap-1 pr-1 text-xs"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: emp.color }}
                />
                {emp.name}
                <button
                  onClick={() => removeEmployee(empId)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Selected Tools */}
      {selectedTools.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {selectedTools.map(toolId => {
            const tool = TOOLS.find(t => t.id === toolId);
            if (!tool) return null;
            const Icon = tool.icon;
            return (
              <Badge
                key={toolId}
                variant="outline"
                className="gap-1.5 border-primary/30 bg-primary/5 pr-1 text-xs"
              >
                <Icon className={cn('h-3 w-3', tool.color)} />
                {tool.label}
                <button
                  onClick={() => toggleTool(toolId)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="group relative flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5"
            >
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="max-w-[150px] truncate text-xs">{file.name}</span>
              <button
                onClick={() => removeAttachment(index)}
                className="rounded-full p-0.5 hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Container */}
      <div className="relative rounded-2xl border border-border bg-background shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-ring">
        {/* @Mention Dropdown */}
        {showMentions && filteredEmployees.length > 0 && (
          <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-lg border border-border bg-popover shadow-lg">
            <div className="p-1">
              {filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => handleMentionSelect(emp)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={emp.avatar} />
                    <AvatarFallback
                      className="text-[10px] font-semibold text-white"
                      style={{ backgroundColor: emp.color }}
                    >
                      {emp.id === 'auto' ? '✨' : emp.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{emp.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {emp.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 p-2">
          {/* Tools Button */}
          <TooltipProvider delayDuration={300}>
            <Popover open={showTools} onOpenChange={setShowTools}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-9 w-9 rounded-full',
                        selectedTools.length > 0 && 'bg-primary/10 text-primary'
                      )}
                      disabled={isLoading}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="top">Add tools</TooltipContent>
              </Tooltip>
              <PopoverContent align="start" className="w-56 p-2">
                <div className="space-y-1">
                  {TOOLS.map(tool => {
                    const Icon = tool.icon;
                    const isSelected = selectedTools.includes(tool.id);
                    return (
                      <button
                        key={tool.id}
                        onClick={() => toggleTool(tool.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <Icon className={cn('h-4 w-4', tool.color)} />
                        <span className="flex-1 text-left">{tool.label}</span>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Attach Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Attach file</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className="min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-3 text-base shadow-none focus-visible:ring-0"
            rows={1}
          />

          {/* Send Button */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSend}
                  size="icon"
                  className={cn(
                    'h-9 w-9 rounded-full transition-all',
                    canSend
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowUp className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {isLoading ? 'Sending...' : 'Send message'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setAttachments(prev => [...prev, ...files]);
            e.target.value = '';
          }}
        />
      </div>

      {/* Helper text */}
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span>
          Type <kbd className="rounded border bg-muted px-1 font-mono">@</kbd> to mention an employee
        </span>
        <span className="hidden sm:inline">
          <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd> to send
        </span>
      </div>
    </div>
  );
};
