/**
 * VibeEnhancedComposer - Modern chat composer inspired by Base44, Lovable.dev, Bolt.new
 *
 * Features:
 * - Central prominent input
 * - Quick action chips (Add styling, Improve prompt, Add feature)
 * - Build/Design mode toggle like Replit
 * - File attachment with preview
 * - Voice input button
 * - Import from Figma/GitHub placeholders
 */

import React, { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { useWorkforceStore } from '@shared/stores/employee-management-store';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@shared/ui/badge';
import { Textarea } from '@shared/ui/textarea';
import {
  Send,
  Paperclip,
  Mic,
  Loader2,
  Sparkles,
  Palette,
  Plus,
  Wand2,
  Code2,
  Layout,
  Settings2,
  ChevronDown,
  Upload,
  X,
  FileCode,
  Image as ImageIcon,
  Github,
  Figma
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@shared/ui/tooltip';

export type VibeMode = 'build' | 'design';

interface VibeEnhancedComposerProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  mode?: VibeMode;
  onModeChange?: (mode: VibeMode) => void;
  showModeToggle?: boolean;
  showQuickActions?: boolean;
  onQuickAction?: (action: string) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'add-styling',
    label: 'Add styling',
    icon: <Palette className="h-3.5 w-3.5" />,
    prompt: 'Improve the styling and visual design of the current code. Make it more modern, clean, and visually appealing with better colors, spacing, and animations.',
    description: 'Enhance visual design',
  },
  {
    id: 'improve-prompt',
    label: 'Improve code',
    icon: <Wand2 className="h-3.5 w-3.5" />,
    prompt: 'Review and improve the current code. Optimize for performance, add better error handling, improve code organization, and follow best practices.',
    description: 'Optimize & refactor',
  },
  {
    id: 'add-feature',
    label: 'Add feature',
    icon: <Plus className="h-3.5 w-3.5" />,
    prompt: 'Add a new feature to the current project. Suggest useful additions that would enhance functionality.',
    description: 'Extend functionality',
  },
  {
    id: 'make-responsive',
    label: 'Responsive',
    icon: <Layout className="h-3.5 w-3.5" />,
    prompt: 'Make the current UI fully responsive. Ensure it looks great on mobile, tablet, and desktop with proper breakpoints and adaptive layouts.',
    description: 'Mobile-friendly design',
  },
];

export function VibeEnhancedComposer({
  onSend,
  isLoading = false,
  placeholder = 'Describe what you want to build...',
  className,
  mode = 'build',
  onModeChange,
  showModeToggle = true,
  showQuickActions = true,
  onQuickAction,
}: VibeEnhancedComposerProps) {
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (!input.trim() && selectedFiles.length === 0) return;
    if (isLoading) return;

    onSend(input, selectedFiles);
    setInput('');
    setSelectedFiles([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, selectedFiles, isLoading, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    if (onQuickAction) {
      onQuickAction(action.id);
    }
    // Append to current input or set as new input
    const newInput = input.trim()
      ? `${input}\n\n${action.prompt}`
      : action.prompt;
    setInput(newInput);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    return <FileCode className="h-4 w-4" />;
  };

  return (
    <div
      className={cn(
        'border-t border-border bg-gradient-to-b from-background to-muted/30',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="mx-auto max-w-4xl px-4 py-4">
        {/* Mode Toggle & Import Options */}
        {showModeToggle && (
          <div className="mb-3 flex items-center justify-between">
            {/* Mode Toggle */}
            <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-1">
              <button
                onClick={() => onModeChange?.('build')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  mode === 'build'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Code2 className="h-4 w-4" />
                Build
              </button>
              <button
                onClick={() => onModeChange?.('design')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  mode === 'design'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Palette className="h-4 w-4" />
                Design
              </button>
            </div>

            {/* Import Options */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Import from</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled>
                    <Figma className="h-3.5 w-3.5" />
                    Figma
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled>
                    <Github className="h-3.5 w-3.5" />
                    GitHub
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Quick Action Chips */}
        {showQuickActions && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {quickActions.map((action) => (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-3 py-1.5 text-xs font-medium transition-all',
                      'hover:border-primary/50 hover:bg-primary/5 hover:text-primary',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{action.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
              >
                {getFileIcon(file)}
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)}KB)
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Input Area */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border-2 bg-background transition-all',
            isDragging
              ? 'border-primary border-dashed bg-primary/5'
              : 'border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20'
          )}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/5">
              <div className="flex items-center gap-2 text-primary">
                <Upload className="h-6 w-6" />
                <span className="font-medium">Drop files here</span>
              </div>
            </div>
          )}

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              'min-h-[100px] w-full resize-none border-0 bg-transparent px-4 py-3',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              'placeholder:text-muted-foreground/70',
              'text-base'
            )}
            rows={3}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2">
            {/* Left actions */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="h-8 w-8 rounded-full p-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".js,.jsx,.ts,.tsx,.html,.css,.json,.md,.txt,.png,.jpg,.jpeg,.gif,.svg"
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    className="h-8 w-8 rounded-full p-0"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice input (coming soon)</TooltipContent>
              </Tooltip>

              <div className="mx-2 h-4 w-px bg-border" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    className="h-8 gap-1 px-2 text-xs"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Options
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Use GPT-4o
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Use Claude 3.5
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Code2 className="mr-2 h-4 w-4" />
                    Generate tests
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileCode className="mr-2 h-4 w-4" />
                    Add documentation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {input.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {input.length} chars
                </span>
              )}

              <Button
                onClick={handleSend}
                disabled={
                  (!input.trim() && selectedFiles.length === 0) || isLoading
                }
                size="sm"
                className="gap-2 rounded-full px-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Build
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5">Enter</kbd> to send
            </span>
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5">Shift+Enter</kbd> for new line
            </span>
          </div>
          <span>@ mention agents, # reference files</span>
        </div>
      </div>
    </div>
  );
}
