import React, { useState, useRef } from 'react';
import { Button } from '@shared/ui/button';
import { Textarea } from '@shared/ui/textarea';
import { Badge } from '@shared/ui/badge';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Search,
  Code,
  Image,
  FileText,
} from 'lucide-react';
import type { Tool, ChatMode } from '../../types';

interface ChatComposerProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
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
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    onSendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  const getToolIcon = (toolId: string) => {
    switch (toolId) {
      case 'search':
        return <Search className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Mode:</span>
        <div className="flex space-x-1">
          {['team', 'engineer', 'research', 'race'].map((mode) => (
            <Button
              key={mode}
              variant={selectedMode === mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange(mode as ChatMode)}
              className="capitalize"
            >
              {mode}
            </Button>
          ))}
        </div>
      </div>

      {/* Tool Toggles */}
      {availableTools.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Tools:</span>
          <div className="flex space-x-1">
            {availableTools.map((tool) => (
              <Button
                key={tool.id}
                variant="outline"
                size="sm"
                onClick={() => onToolToggle(tool.id)}
                className="flex items-center space-x-1"
              >
                {getToolIcon(tool.id)}
                <span>{tool.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center space-x-1"
            >
              <span className="text-xs">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(index)}
                className="h-4 w-4 p-0"
              >
                ×
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="max-h-[200px] min-h-[60px] resize-none"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleRecording}
              className={`h-8 w-8 p-0 ${
                isRecording ? 'bg-red-500 text-white' : ''
              }`}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="h-8 w-8 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  );
};
