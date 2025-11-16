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
    <aside className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-card py-4">
      {/* Logo */}
      <Link
        to="/"
        className="mb-8 rounded-lg p-2 transition-colors hover:bg-muted"
      >
        <Sparkles size={24} className="text-primary" />
      </Link>

      {/* Dashboard Link */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/dashboard"
              className="rounded-lg p-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
              className="rounded-lg p-2 transition-colors hover:bg-muted"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
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
