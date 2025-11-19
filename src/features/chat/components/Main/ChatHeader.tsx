import React from 'react';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import {
  Menu,
  Share2,
  Download,
  Settings,
  Edit3,
  Check,
  X,
  Search,
} from 'lucide-react';
import type { ChatSession } from '../../types';
import { TokenUsageDisplay } from '../TokenUsageDisplay';
import { useSessionTokens } from '../../hooks/use-session-tokens';

interface ChatHeaderProps {
  session: ChatSession | null;
  onRename: (title: string) => void;
  onShare: () => void;
  onExport: () => void;
  onSettings: () => void;
  onToggleSidebar: () => void;
  onSearch?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  session,
  onRename,
  onShare,
  onExport,
  onSettings,
  onToggleSidebar,
  onSearch,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(session?.title || '');

  // Get session token usage
  const { totalTokens, inputTokens, outputTokens, totalCost } = useSessionTokens(session?.id);

  React.useEffect(() => {
    setEditTitle(session?.title || '');
  }, [session?.title]);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== session?.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(session?.title || '');
    setIsEditing(false);
  };

  return (
    <div className="border-b border-border bg-card/50 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="flex-shrink-0 lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center space-x-2">
            {isEditing ? (
              <div className="flex min-w-0 flex-1 items-center space-x-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  className="h-8"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRename}
                  className="h-8 w-8 flex-shrink-0 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 w-8 flex-shrink-0 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 items-center space-x-2">
                <h1 className="min-w-0 max-w-[150px] truncate text-base font-semibold sm:max-w-xs sm:text-lg">
                  {session?.title || 'New Chat'}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="hidden h-6 w-6 flex-shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100 sm:block"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2 sm:space-x-3">
          {/* Token Usage Display - only show if session has tokens */}
          {session && totalTokens > 0 && (
            <TokenUsageDisplay
              tokensUsed={totalTokens}
              inputTokens={inputTokens}
              outputTokens={outputTokens}
              cost={totalCost}
              variant="compact"
              className="hidden lg:flex"
            />
          )}

          {onSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSearch}
              className="hidden md:flex"
              title="Global search (Cmd+K)"
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline">Search</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="hidden md:flex"
          >
            <Share2 className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Share</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="hidden md:flex"
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Export</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={onSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
