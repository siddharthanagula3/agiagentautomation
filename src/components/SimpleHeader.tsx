import React from 'react';
import { Bot, Menu, Plus, Settings, User, Bell, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SimpleHeaderProps {
  onMenuToggle?: () => void;
  tokenBalance?: number;
  notifications?: number;
}

const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  onMenuToggle,
  tokenBalance = 0,
  notifications = 0
}) => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="text-gray-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-500" />
            <h1 className="text-xl font-semibold text-white">AGI Agent Automation</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Token Balance */}
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-gray-300">
              {tokenBalance?.toLocaleString()} tokens
            </span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative text-gray-400 hover:text-white">
            <Bell className="h-5 w-5" />
            {notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          {/* New Chat */}
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Plus className="h-5 w-5" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User */}
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;