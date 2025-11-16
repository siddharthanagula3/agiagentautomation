/**
 * ViewSelector - Tab bar for switching between output views
 * Views: Chat | Editor | Planner | App Viewer | Terminal | File Tree
 */

import React from 'react';
import { useVibeViewStore, type ViewMode } from '../../stores/vibe-view-store';
import { Badge } from '@/shared/components/ui/badge';
import {
  MessageSquare,
  Code2,
  ListChecks,
  Monitor,
  Terminal,
  FolderTree,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface ViewTab {
  id: ViewMode;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const viewTabs: ViewTab[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'editor', label: 'Editor', icon: Code2 },
  { id: 'planner', label: 'Planner', icon: ListChecks },
  { id: 'app-viewer', label: 'App Viewer', icon: Monitor },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'file-tree', label: 'Files', icon: FolderTree },
];

export function ViewSelector() {
  const { activeView, setActiveView, followingAgent, toggleFollowAgent } = useVibeViewStore();

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-background">
      <div className="flex items-center justify-between px-4 py-2">
        {/* View Tabs */}
        <div className="flex items-center gap-1">
          {viewTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs">
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Follow Agent Toggle */}
        <button
          onClick={toggleFollowAgent}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            followingAgent
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          title={followingAgent ? 'Stop following agent' : 'Follow agent actions'}
        >
          {followingAgent ? (
            <>
              <Eye className="w-4 h-4" />
              <span className="text-xs">Following Agent</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="text-xs">Follow Agent</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
