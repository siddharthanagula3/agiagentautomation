import React, { useState } from 'react';
import {
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Share,
  MoreHorizontal,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ChatGPTMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  model?: string;
  tokensUsed?: number;
  cost?: number;
  isStreaming?: boolean;
}

const ChatGPTMessage: React.FC<ChatGPTMessageProps> = ({
  id,
  role,
  content,
  timestamp,
  model,
  tokensUsed,
  cost,
  isStreaming = false
}) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = (isLiked: boolean) => {
    setLiked(isLiked);
  };

  if (role === 'system') {
    return (
      <div className="flex justify-center py-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {content}
        </div>
      </div>
    );
  }

  const isAssistant = role === 'assistant';

  return (
    <div className={cn(
      "group relative px-4 py-6",
      isAssistant ? "bg-gray-50 dark:bg-gray-800/50" : ""
    )}>
      <div className="mx-auto max-w-3xl">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {isAssistant ? (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {isAssistant ? 'AGI Agent' : 'You'}
              </span>
              {model && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {model}
                </span>
              )}
            </div>

            {/* Message text */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                {content}
                {isStreaming && (
                  <span className="inline-block w-2 h-5 bg-gray-400 ml-1 animate-pulse" />
                )}
              </div>
            </div>

            {/* Metadata */}
            {(tokensUsed || cost || timestamp) && (
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                {timestamp && <span>{timestamp}</span>}
                {tokensUsed && <span>{tokensUsed} tokens</span>}
                {cost && <span>${cost.toFixed(4)}</span>}
              </div>
            )}

            {/* Action buttons for assistant messages */}
            {isAssistant && !isStreaming && (
              <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(true)}
                  className={cn(
                    "h-8 px-2",
                    liked === true && "text-green-600 dark:text-green-400"
                  )}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(false)}
                  className={cn(
                    "h-8 px-2",
                    liked === false && "text-red-600 dark:text-red-400"
                  )}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Share className="h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatGPTMessage;