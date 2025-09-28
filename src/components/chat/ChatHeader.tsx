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
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(status)}`} />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{employeeName}</h3>
          <p className="text-sm text-muted-foreground">{employeeRole}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onSettingsClick}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          className="p-2 hover:bg-muted rounded-md transition-colors"
          title="More options"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};