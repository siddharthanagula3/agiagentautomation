/**
 * Enhanced Message Input Component
 * Supports file uploads, tool selection, and task division
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  Wrench, 
  X, 
  FileText, 
  Image, 
  Code,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string, attachments?: FileAttachment[], tools?: Tool[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  showTools?: boolean;
  availableTools?: Tool[];
  onToolSelect?: (tool: Tool) => void;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading = false,
  placeholder = "Type your message...",
  disabled = false,
  maxLength = 2000,
  showTools = false,
  availableTools = [],
  onToolSelect,
  className,
}) => {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() && attachments.length === 0) return;
    
    onSend(value, attachments, selectedTools);
    setAttachments([]);
    setSelectedTools([]);
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: FileAttachment[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const toggleTool = (tool: Tool) => {
    setSelectedTools(prev => {
      const isSelected = prev.some(t => t.id === tool.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tool.id);
      } else {
        return [...prev, tool];
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('text/') || type.includes('document/')) return FileText;
    if (type.includes('code/') || type.includes('application/json')) return Code;
    return FileText;
  };

  return (
    <div className={cn('border-t bg-background', className)}>
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="p-3 border-b bg-muted/50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.type);
              return (
                <div
                  key={attachment.id}
                  className="flex items-center space-x-2 bg-background rounded-lg p-2 border"
                >
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Tools */}
      {selectedTools.length > 0 && (
        <div className="p-3 border-b bg-muted/50">
          <div className="flex flex-wrap gap-2">
            {selectedTools.map((tool) => (
              <Badge key={tool.id} variant="secondary" className="flex items-center space-x-1">
                <Wrench className="h-3 w-3" />
                <span>{tool.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTool(tool)}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tools Panel */}
      {showTools && availableTools.length > 0 && (
        <div className="p-3 border-b bg-muted/50">
          <div className="mb-2">
            <h4 className="text-sm font-medium">Available Tools</h4>
            <p className="text-xs text-muted-foreground">
              Select tools to enhance your request
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availableTools.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTools.some(t => t.id === tool.id) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTool(tool)}
                className="justify-start h-auto p-2"
              >
                <Wrench className="h-3 w-3 mr-2" />
                <div className="text-left">
                  <div className="text-xs font-medium">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            {isExpanded ? (
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading || disabled}
                maxLength={maxLength}
                className="min-h-[80px] resize-none"
                autoFocus
              />
            ) : (
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={isLoading || disabled}
                maxLength={maxLength}
                onFocus={() => setIsExpanded(true)}
              />
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || disabled}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                {availableTools.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToolSelect?.(availableTools[0])}
                    disabled={isLoading || disabled}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {value.length}/{maxLength}
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSend}
            disabled={(!value.trim() && attachments.length === 0) || isLoading || disabled}
            size="sm"
            className="h-10 w-10 p-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.csv,.json,.xml"
        />
      </div>
    </div>
  );
};
