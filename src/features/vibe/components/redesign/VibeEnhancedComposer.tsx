/**
 * VibeEnhancedComposer - Clean, minimal chat composer
 *
 * Redesigned with:
 * - Single clean input that expands
 * - Quick actions only on empty state (hidden when typing)
 * - Mode toggle moved to dropdown
 * - Minimal visual chrome
 */

import React, { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@shared/ui/textarea';
import {
  Send,
  Paperclip,
  Loader2,
  Sparkles,
  Palette,
  Plus,
  Wand2,
  Code2,
  Layout,
  X,
  FileCode,
  Image as ImageIcon,
  Upload,
  ArrowUp,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
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
}

const quickActions: QuickAction[] = [
  {
    id: 'add-styling',
    label: 'Add styling',
    icon: <Palette className="h-3.5 w-3.5" />,
    prompt:
      'Improve the styling and visual design. Make it modern, clean, and visually appealing.',
  },
  {
    id: 'improve-code',
    label: 'Improve code',
    icon: <Wand2 className="h-3.5 w-3.5" />,
    prompt:
      'Review and improve the code. Optimize for performance and follow best practices.',
  },
  {
    id: 'add-feature',
    label: 'Add feature',
    icon: <Plus className="h-3.5 w-3.5" />,
    prompt: 'Add a new useful feature to the project.',
  },
  {
    id: 'responsive',
    label: 'Responsive',
    icon: <Layout className="h-3.5 w-3.5" />,
    prompt: 'Make the UI fully responsive for mobile, tablet, and desktop.',
  },
];

export function VibeEnhancedComposer({
  onSend,
  isLoading = false,
  placeholder = 'Describe what you want to build...',
  className,
  mode = 'build',
  onModeChange,
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

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(
        Math.max(textareaRef.current.scrollHeight, 52),
        200
      );
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    onQuickAction?.(action.id);
    setInput(action.prompt);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = '';
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

  const canSend = (input.trim() || selectedFiles.length > 0) && !isLoading;
  const showQuickActionsUI =
    showQuickActions && !input.trim() && selectedFiles.length === 0;

  return (
    <div
      className={cn(
        'border-t border-border bg-background/95 backdrop-blur',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="mx-auto max-w-3xl px-4 py-4">
        {/* Quick Actions - Only show when empty */}
        {showQuickActionsUI && (
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                disabled={isLoading}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium transition-all',
                  'hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedFiles.map((file, fileIndex) => (
              <div
                key={`file-${file.name}-${file.size}`}
                className="group flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="max-w-[120px] truncate text-xs">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(fileIndex)}
                  className="rounded-full p-0.5 hover:bg-background"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Input */}
        <div
          className={cn(
            'relative rounded-2xl border bg-background shadow-sm transition-all',
            isDragging
              ? 'border-dashed border-primary bg-primary/5'
              : 'border-border focus-within:border-ring focus-within:ring-1 focus-within:ring-ring'
          )}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/5">
              <div className="flex items-center gap-2 text-primary">
                <Upload className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-medium">Drop files</span>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2 p-2">
            {/* Attach Button */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="h-9 w-9 flex-shrink-0 rounded-full"
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Attach file</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".js,.jsx,.ts,.tsx,.html,.css,.json,.md,.txt,.png,.jpg,.jpeg,.gif,.svg"
            />

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                'min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-3 text-base shadow-none',
                'placeholder:text-muted-foreground/60 focus-visible:ring-0'
              )}
              rows={1}
              aria-label="Message input"
            />

            {/* Mode Toggle - Subtle */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      onModeChange?.(mode === 'build' ? 'design' : 'build')
                    }
                    disabled={isLoading}
                    className={cn(
                      'h-9 w-9 flex-shrink-0 rounded-full',
                      mode === 'design' && 'bg-violet-500/10 text-violet-600'
                    )}
                    aria-label={
                      mode === 'build'
                        ? 'Switch to Design mode'
                        : 'Switch to Build mode'
                    }
                  >
                    {mode === 'build' ? (
                      <Code2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Palette className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {mode === 'build'
                    ? 'Switch to Design mode'
                    : 'Switch to Build mode'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Send Button */}
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSend}
                    disabled={!canSend}
                    size="icon"
                    className={cn(
                      'h-9 w-9 flex-shrink-0 rounded-full transition-all',
                      canSend
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground'
                    )}
                    aria-label={isLoading ? 'Building' : 'Send message'}
                    aria-busy={isLoading}
                  >
                    {isLoading ? (
                      <Loader2
                        className="h-5 w-5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ArrowUp className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isLoading ? 'Building...' : 'Send'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Minimal helper */}
        <div className="mt-2 text-center text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd> to
          send
        </div>
      </div>
    </div>
  );
}
