import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Settings,
  HelpCircle,
  Edit3,
  Check,
  X,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatTopBarProps {
  sessionTitle: string;
  onNavigateToDashboard: () => void;
  onRestoreCheckpoint: () => void;
  onUpdateTitle: (newTitle: string) => void;
  hasCheckpoints?: boolean;
  checkpointCount?: number;
}

export function ChatTopBar({
  sessionTitle,
  onNavigateToDashboard,
  onRestoreCheckpoint,
  onUpdateTitle,
  hasCheckpoints = false,
  checkpointCount = 0,
}: ChatTopBarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(sessionTitle);

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
    setEditTitle(sessionTitle);
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== sessionTitle) {
      onUpdateTitle(editTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(sessionTitle);
    setIsEditingTitle(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Back Button */}
        {hasCheckpoints && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestoreCheckpoint}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        )}

        {/* Session Title */}
        <div className="flex items-center space-x-2">
          {isEditingTitle ? (
            <div className="flex items-center space-x-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                onBlur={handleTitleSave}
                className="h-8 text-sm font-medium"
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTitleSave}
                className="h-8 w-8 p-0"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTitleCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h1 className="max-w-xs truncate text-lg font-semibold text-gray-900 dark:text-white">
                {sessionTitle}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTitleEdit}
                className="h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Checkpoint Badge */}
        {checkpointCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {checkpointCount} checkpoint{checkpointCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Help Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open('https://docs.mgx.dev/', '_blank')}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <HelpCircle className="mr-1 h-4 w-4" />
          Docs
        </Button>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* Dashboard Button */}
        <Button
          onClick={onNavigateToDashboard}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </div>
    </div>
  );
}
