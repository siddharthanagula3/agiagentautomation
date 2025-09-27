import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatGPTInputProps {
  onSendMessage: (content: string, options: unknown) => void;
  placeholder?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  onStopStream?: () => void;
}

const ChatGPTInput: React.FC<ChatGPTInputProps> = ({
  onSendMessage,
  placeholder = "Message AGI Agent...",
  disabled = false,
  isStreaming = false,
  onStopStream
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isStreaming) return;

    onSendMessage(message.trim(), {
      model: 'AGI Agent 4.0',
      timestamp: new Date().toISOString()
    });
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl p-3">
            {/* Attachment button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={disabled || isStreaming}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Text input */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isStreaming}
                className={cn(
                  "min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent px-0 py-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                  "scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
                )}
                rows={1}
              />
            </div>

            {/* Voice recording button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleVoiceRecord}
              className={cn(
                "flex-shrink-0 h-8 w-8 p-0",
                isRecording
                  ? "text-red-500 hover:text-red-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
              disabled={disabled}
            >
              <Mic className="h-4 w-4" />
            </Button>

            {/* Send/Stop button */}
            {isStreaming ? (
              <Button
                type="button"
                onClick={onStopStream}
                size="sm"
                className="flex-shrink-0 h-8 w-8 p-0 bg-gray-700 hover:bg-gray-600 text-white"
              >
                <Square className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={!message.trim() || disabled}
                className={cn(
                  "flex-shrink-0 h-8 w-8 p-0 transition-colors",
                  message.trim() && !disabled
                    ? "bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-gray-900"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Footer text */}
          <div className="flex items-center justify-center mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              AGI Agent can make mistakes. Consider checking important information.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatGPTInput;