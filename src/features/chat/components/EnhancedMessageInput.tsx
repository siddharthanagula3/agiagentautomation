/**
 * EnhancedMessageInput - Rich text input with advanced features
 *
 * Features:
 * - Rich text editing with markdown support
 * - File attachment support
 * - @mention autocomplete for agents
 * - Markdown preview
 * - Voice input support (placeholder)
 * - Auto-resize textarea
 * - Keyboard shortcuts
 * - Character counter
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Separator } from '@shared/components/ui/separator';
import { ScrollArea } from '@shared/components/ui/scroll-area';
import {
  Send,
  Paperclip,
  Mic,
  Bold,
  Italic,
  Code,
  List,
  Image as ImageIcon,
  X,
  Eye,
  EyeOff,
  Smile,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Agent } from './MultiAgentChatInterface';

interface EnhancedMessageInputProps {
  /** Array of agents for mention autocomplete */
  agents: Agent[];
  /** Callback when sending a message */
  onSend: (content: string, attachments?: File[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character count */
  maxLength?: number;
  /** Whether voice input is enabled */
  enableVoice?: boolean;
  /** Whether markdown preview is enabled */
  enablePreview?: boolean;
  /** Custom className */
  className?: string;
}

interface Attachment {
  file: File;
  id: string;
  preview?: string;
}

export function EnhancedMessageInput({
  agents,
  onSend,
  placeholder = 'Type a message...',
  maxLength = 10000,
  enableVoice = true,
  enablePreview = true,
  className,
}: EnhancedMessageInputProps) {
  // State
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionStartPos = useRef(0);

  // Filtered agents for mention autocomplete
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [content]);

  // Handle content change
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    if (newContent.length <= maxLength) {
      setContent(newContent);

      // Check for @ mention
      const cursorPos = e.target.selectionStart;
      const textBeforeCursor = newContent.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (!textAfterAt.includes(' ')) {
          setShowMentions(true);
          setMentionQuery(textAfterAt);
          mentionStartPos.current = lastAtIndex;
          setMentionPosition(cursorPos);
          setSelectedMentionIndex(0);
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    }
  }, [maxLength]);

  // Handle mention selection
  const handleMentionSelect = useCallback((agent: Agent) => {
    const before = content.substring(0, mentionStartPos.current);
    const after = content.substring(mentionPosition);
    const newContent = `${before}@${agent.name} ${after}`;
    setContent(newContent);
    setShowMentions(false);

    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = mentionStartPos.current + agent.name.length + 2;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content, mentionPosition]);

  // Handle file attachment
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: Attachment[] = files.map(file => {
      const attachment: Attachment = {
        file,
        id: Math.random().toString(36).substring(7),
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setAttachments(prev =>
            prev.map(a => a.id === attachment.id ? { ...a, preview: result } : a)
          );
        };
        reader.readAsDataURL(file);
      }

      return attachment;
    });

    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Remove attachment
  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  // Insert markdown formatting
  const insertMarkdown = useCallback((prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end);

    setContent(newContent);

    // Restore cursor position
    setTimeout(() => {
      const newCursorPos = start + prefix.length + selectedText.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [content]);

  // Handle send
  const handleSend = useCallback(() => {
    if (content.trim() || attachments.length > 0) {
      onSend(content, attachments.map(a => a.file));
      setContent('');
      setAttachments([]);
      setShowPreview(false);
    }
  }, [content, attachments, onSend]);

  // Handle voice recording (placeholder)
  const handleVoiceToggle = useCallback(() => {
    setIsRecording(prev => !prev);
    // TODO: Implement actual voice recording
    console.log('Voice recording:', !isRecording);
  }, [isRecording]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
        e.preventDefault();
        handleSend();
      }

      // Navigate mentions with arrow keys
      if (showMentions) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedMentionIndex(prev =>
            Math.min(prev + 1, filteredAgents.length - 1)
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedMentionIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          if (filteredAgents[selectedMentionIndex]) {
            handleMentionSelect(filteredAgents[selectedMentionIndex]);
          }
        } else if (e.key === 'Escape') {
          setShowMentions(false);
        }
      }

      // Markdown shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            insertMarkdown('**');
            break;
          case 'i':
            e.preventDefault();
            insertMarkdown('*');
            break;
          case 'k':
            e.preventDefault();
            insertMarkdown('`');
            break;
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('keydown', handleKeyDown);
      return () => textarea.removeEventListener('keydown', handleKeyDown);
    }
  }, [showMentions, filteredAgents, selectedMentionIndex, handleSend, handleMentionSelect, insertMarkdown]);

  const charCount = content.length;
  const isNearLimit = charCount > maxLength * 0.9;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-card"
            >
              {attachment.preview ? (
                <img
                  src={attachment.preview}
                  alt={attachment.file.name}
                  className="h-20 w-20 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 p-2">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                  <span className="truncate text-xs text-muted-foreground">
                    {attachment.file.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => handleRemoveAttachment(attachment.id)}
                className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
                aria-label="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Markdown Preview */}
      {showPreview && content && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Preview</span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="relative flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => insertMarkdown('**')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => insertMarkdown('*')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => insertMarkdown('`')}
            title="Code (Ctrl+K)"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => insertMarkdown('```\n', '\n```')}
            title="Code block"
          >
            <Code className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {enablePreview && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {isNearLimit && (
              <span className={cn(
                'text-xs',
                charCount >= maxLength ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {charCount} / {maxLength}
              </span>
            )}
          </div>
        </div>

        <Separator />

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            className="max-h-[200px] min-h-[60px] w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            rows={1}
          />

          {/* Mention Autocomplete */}
          {showMentions && filteredAgents.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-border bg-card shadow-lg">
              <ScrollArea className="max-h-48">
                {filteredAgents.map((agent, index) => (
                  <button
                    key={agent.id}
                    onClick={() => handleMentionSelect(agent)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors',
                      index === selectedMentionIndex
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: agent.color }}
                    >
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
                        {agent.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="truncate text-sm font-medium">{agent.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{agent.role}</div>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {enableVoice && (
              <Button
                variant={isRecording ? 'destructive' : 'ghost'}
                size="sm"
                className="h-8 gap-2"
                onClick={handleVoiceToggle}
              >
                <Mic className="h-4 w-4" />
                {isRecording && <span className="text-xs">Recording...</span>}
              </Button>
            )}
          </div>

          <Button
            onClick={handleSend}
            disabled={!content.trim() && attachments.length === 0}
            size="sm"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json"
      />
    </div>
  );
}
