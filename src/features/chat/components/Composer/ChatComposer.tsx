import React, { useState, useRef } from 'react';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';
import { Badge } from '@shared/ui/badge';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';
import type { ChatMode, Tool } from '../../types';

interface ChatComposerProps {
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  isLoading: boolean;
  availableTools: Tool[];
  onToolToggle: (toolId: string) => void;
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isLoading,
  availableTools,
  onToolToggle,
  selectedMode,
  onModeChange,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!message.trim() && attachments.length === 0) return;

    try {
      await onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

  return (
    <div className="space-y-2">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-2 px-3 py-1"
            >
              <span className="max-w-[200px] truncate text-xs">
                {file.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message AI ${selectedMode === 'team' ? 'Team' : 'Employee'}...`}
            className="max-h-[200px] min-h-[80px] resize-none pr-12"
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
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading || (!message.trim() && attachments.length === 0)}
          className="h-[80px] px-6"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <p className="px-1 text-xs text-muted-foreground">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
};
