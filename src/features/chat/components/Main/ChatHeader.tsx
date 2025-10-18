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
} from 'lucide-react';
import type { ChatSession } from '../../types';

interface ChatHeaderProps {
  session: ChatSession | null;
  onRename: (title: string) => void;
  onShare: () => void;
  onExport: () => void;
  onSettings: () => void;
  onToggleSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  session,
  onRename,
  onShare,
  onExport,
  onSettings,
  onToggleSidebar,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(session?.title || '');

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
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            {isEditing ? (
              <div className="flex items-center space-x-2">
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
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="max-w-xs truncate text-lg font-semibold">
                  {session?.title || 'New Chat'}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="hidden sm:flex"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            className="hidden sm:flex"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button variant="ghost" size="sm" onClick={onSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
