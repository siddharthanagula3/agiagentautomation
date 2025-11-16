/**
 * VibeMessageInput - Message input with @ mentions for agents and # mentions for files
 * Features:
 * - @ mentions: Autocomplete for AI agents
 * - # mentions: Autocomplete for files
 * - File upload support
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 */

import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useWorkforceStore } from '@shared/stores/employee-management-store';
import { useVibeViewStore } from '../../stores/vibe-view-store';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Send, Paperclip, Mic, Loader2, User, File as FileIcon, Hash, AtSign } from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface VibeMessageInputProps {
  onSend: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

interface MentionSuggestion {
  id: string;
  name: string;
  type: 'agent' | 'file';
  role?: string;
  path?: string;
}

export function VibeMessageInput({
  onSend,
  isLoading = false,
  placeholder = 'Type a message... (@ for agents, # for files)',
  className,
}: VibeMessageInputProps) {
  const { hiredEmployees } = useWorkforceStore();
  const { fileTree } = useVibeViewStore();

  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionType, setMentionType] = useState<'agent' | 'file' | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionPopoverRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim() && selectedFiles.length === 0) return;
    if (isLoading) return;

    onSend(input, selectedFiles);
    setInput('');
    setSelectedFiles([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Extract all files from file tree recursively
  const getAllFiles = (tree: any[]): MentionSuggestion[] => {
    const files: MentionSuggestion[] = [];
    const traverse = (items: any[]) => {
      items.forEach((item) => {
        if (item.type === 'file') {
          files.push({
            id: item.id,
            name: item.name,
            type: 'file',
            path: item.path,
          });
        }
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(tree);
    return files;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention navigation
    if (showMentions && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < mentionSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : mentionSuggestions.length - 1
        );
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        if (!e.shiftKey) {
          e.preventDefault();
          insertMention(mentionSuggestions[selectedSuggestionIndex]);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    // Send on Enter (without Shift) when no mentions shown
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertMention = (suggestion: MentionSuggestion) => {
    const before = input.substring(0, mentionStartPos);
    const after = input.substring(textareaRef.current?.selectionStart || input.length);
    const mentionText = suggestion.type === 'agent'
      ? `@${suggestion.name}`
      : `#${suggestion.name}`;

    const newInput = `${before}${mentionText} ${after}`;
    setInput(newInput);
    setShowMentions(false);
    setMentionType(null);
    setMentionQuery('');

    // Move cursor after mention
    setTimeout(() => {
      if (textareaRef.current) {
        const cursorPos = before.length + mentionText.length + 1;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Detect @ and # mentions
    const cursorPos = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);

    // Check for @ mention (agents)
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      setMentionType('agent');
      setMentionQuery(query);
      setMentionStartPos(cursorPos - atMatch[0].length);

      // Filter agents
      const agentSuggestions: MentionSuggestion[] = (hiredEmployees || [])
        .filter((emp) =>
          emp.name?.toLowerCase().includes(query) ||
          emp.role?.toLowerCase().includes(query)
        )
        .map((emp) => ({
          id: emp.id,
          name: emp.name || 'Unknown',
          type: 'agent' as const,
          role: emp.role,
        }))
        .slice(0, 5); // Limit to 5 suggestions

      setMentionSuggestions(agentSuggestions);
      setShowMentions(agentSuggestions.length > 0);
      setSelectedSuggestionIndex(0);
      return;
    }

    // Check for # mention (files)
    const hashMatch = textBeforeCursor.match(/#(\S*)$/);
    if (hashMatch) {
      const query = hashMatch[1].toLowerCase();
      setMentionType('file');
      setMentionQuery(query);
      setMentionStartPos(cursorPos - hashMatch[0].length);

      // Filter files
      const allFiles = getAllFiles(fileTree);
      const fileSuggestions = allFiles
        .filter((file) =>
          file.name.toLowerCase().includes(query) ||
          file.path?.toLowerCase().includes(query)
        )
        .slice(0, 5); // Limit to 5 suggestions

      setMentionSuggestions(fileSuggestions);
      setShowMentions(fileSuggestions.length > 0);
      setSelectedSuggestionIndex(0);
      return;
    }

    // No mention detected
    if (showMentions) {
      setShowMentions(false);
      setMentionType(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className={cn(
        'border-t border-gray-200 dark:border-gray-800 bg-background',
        className
      )}
    >
      <div className="p-4">
        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="max-w-[200px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-end gap-2">
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className={cn(
                'w-full min-h-[80px] max-h-[200px] px-4 py-3 rounded-lg',
                'border border-input bg-background',
                'resize-none',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'text-sm placeholder:text-muted-foreground'
              )}
              rows={1}
            />

            {/* Character count (optional) */}
            {input.length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {input.length}
              </div>
            )}

            {/* Mention Suggestions Popover */}
            {showMentions && mentionSuggestions.length > 0 && (
              <div
                ref={mentionPopoverRef}
                className="absolute bottom-full left-0 mb-2 w-80 rounded-lg border border-border bg-popover shadow-lg z-50"
              >
                <div className="p-2 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2 text-sm">
                    {mentionType === 'agent' ? (
                      <>
                        <AtSign className="w-4 h-4 text-primary" />
                        <span className="font-medium">Mention Agent</span>
                      </>
                    ) : (
                      <>
                        <Hash className="w-4 h-4 text-primary" />
                        <span className="font-medium">Mention File</span>
                      </>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {mentionQuery ? `"${mentionQuery}"` : 'All'}
                    </span>
                  </div>
                </div>

                <ScrollArea className="max-h-[240px]">
                  <div className="p-1">
                    {mentionSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.id}
                        onClick={() => insertMention(suggestion)}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                          index === selectedSuggestionIndex
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        {suggestion.type === 'agent' ? (
                          <>
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {suggestion.name}
                              </div>
                              {suggestion.role && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {suggestion.role}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <FileIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {suggestion.name}
                              </div>
                              {suggestion.path && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {suggestion.path}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-2 border-t border-border bg-muted/30">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">↑↓</kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">Tab</kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-background rounded text-xs">Esc</kbd>
                      <span>Close</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* File Upload */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Voice Input (placeholder) */}
            <Button
              variant="ghost"
              size="icon"
              disabled={isLoading}
              className="shrink-0"
            >
              <Mic className="w-4 h-4" />
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && selectedFiles.length === 0) || isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Helper Text */}
        <p className="mt-2 text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to
          send, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd>{' '}
          for new line
        </p>
      </div>
    </div>
  );
}
