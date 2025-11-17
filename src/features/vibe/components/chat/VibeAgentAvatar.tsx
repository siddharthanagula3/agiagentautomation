/**
 * VibeAgentAvatar.tsx
 * Employee avatar with status indicator for the VIBE interface
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@shared/components/ui/avatar';
import type { AIEmployee } from '@core/types/ai-employee';
import type { AgentStatus } from '../../types/vibe-agent';

interface VibeAgentAvatarProps {
  employee: AIEmployee;
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const statusIndicatorClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export const VibeAgentAvatar: React.FC<VibeAgentAvatarProps> = ({
  employee,
  status,
  size = 'md',
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'working':
        return 'bg-green-500';
      case 'thinking':
        return 'bg-yellow-500';
      case 'idle':
        return 'bg-gray-400';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusAnimation = () => {
    switch (status) {
      case 'working':
        return {
          scale: [1, 1.2, 1],
          transition: { duration: 1.5, repeat: Infinity },
        };
      case 'thinking':
        return {
          rotate: 360,
          transition: { duration: 2, repeat: Infinity, ease: 'linear' },
        };
      default:
        return {};
    }
  };

  // Generate avatar fallback from employee name
  const getInitials = (name: string) => {
    const parts = name.split('-').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <Avatar className={sizeClasses[size]}>
        <AvatarImage
          src={`/employees/${employee.name}.png`}
          alt={employee.name}
        />
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {getInitials(employee.name)}
        </AvatarFallback>
      </Avatar>

      {/* Status Indicator */}
      <motion.div
        className={`absolute -bottom-0.5 -right-0.5 ${statusIndicatorClasses[size]} ${getStatusColor()} rounded-full border-2 border-background`}
        animate={getStatusAnimation()}
        aria-label={`Agent status: ${status}`}
      />
    </div>
  );
};
