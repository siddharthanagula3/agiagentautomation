import React from 'react';
import { Button } from '@/components/ui/button';
import { Bot, Wrench, Settings } from 'lucide-react';
import type { AIEmployee } from '@/types/ai-employee';

interface ChatHeaderProps {
  employee: AIEmployee;
  availableToolsCount: number;
  showTools: boolean;
  onToggleTools: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  employee,
  availableToolsCount,
  showTools,
  onToggleTools,
}) => {
  return (
    <div className="border-b bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{employee.name}</h2>
            <p className="text-sm text-muted-foreground">{employee.role}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleTools}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Tools ({availableToolsCount})
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
