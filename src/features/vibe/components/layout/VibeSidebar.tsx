/**
 * VibeSidebar - Minimal sidebar for VIBE interface
 * Clean, focused sidebar with only Dashboard navigation and user profile
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Sparkles, User } from 'lucide-react';
import { useAuthStore } from '@shared/stores/authentication-store';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@shared/ui/tooltip';

const VibeSidebar: React.FC = () => {
  const { user } = useAuthStore();

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email[0].toUpperCase();
  };

  return (
    <aside className="w-16 bg-card border-r border-border flex flex-col items-center py-4 shrink-0">
      {/* Logo */}
      <Link to="/" className="mb-8 p-2 rounded-lg hover:bg-muted transition-colors">
        <Sparkles size={24} className="text-primary" />
      </Link>

      {/* Dashboard Link */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/dashboard"
              className="p-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <LayoutDashboard size={20} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Back to Dashboard</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Profile (bottom) */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/settings"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </aside>
  );
};

export default VibeSidebar;
