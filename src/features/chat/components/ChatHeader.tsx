import React from 'react';
import { User, Settings, MoreVertical } from 'lucide-react';

interface ChatHeaderProps {
  employeeName: string;
  employeeRole: string;
  status: 'online' | 'busy' | 'offline';
  onSettingsClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  employeeName,
  employeeRole,
  status,
  onSettingsClick,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-border bg-card p-4">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div
            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${getStatusColor(status)}`}
          />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{employeeName}</h3>
          <p className="text-sm text-muted-foreground">{employeeRole}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onSettingsClick}
          className="rounded-md p-2 transition-colors hover:bg-muted"
          title="Settings"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          className="rounded-md p-2 transition-colors hover:bg-muted"
          title="More options"
        >
          <MoreVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};
