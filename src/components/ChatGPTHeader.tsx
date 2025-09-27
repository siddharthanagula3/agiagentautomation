import React, { useState } from 'react';
import { ChevronDown, Plus, Settings, User, LogOut, Moon, Sun, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatGPTHeaderProps {
  onNewChat?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  userEmail?: string;
}

const ChatGPTHeader: React.FC<ChatGPTHeaderProps> = ({
  onNewChat,
  darkMode = true,
  onToggleDarkMode,
  userEmail = "user@example.com"
}) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Left side - Model selector and new chat */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
              <Bot className="h-4 w-4" />
              <span>AGI Agent 4.0</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem className="flex items-center gap-3 p-3">
              <Bot className="h-5 w-5 text-green-500" />
              <div className="flex flex-col">
                <span className="font-medium">AGI Agent 4.0</span>
                <span className="text-xs text-gray-500">Most capable model</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-3 p-3">
              <Bot className="h-5 w-5 text-blue-500" />
              <div className="flex flex-col">
                <span className="font-medium">AGI Agent 3.5</span>
                <span className="text-xs text-gray-500">Faster responses</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Right side - User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {userEmail.charAt(0).toUpperCase()}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-medium">Account</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>

          <DropdownMenuItem className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My profile
          </DropdownMenuItem>

          <DropdownMenuItem className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={onToggleDarkMode}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="flex items-center gap-2 text-red-600">
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default ChatGPTHeader;