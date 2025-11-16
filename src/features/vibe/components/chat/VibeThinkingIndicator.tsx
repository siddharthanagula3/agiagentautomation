/**
 * VibeThinkingIndicator.tsx
 * Animated "thinking..." indicator for the VIBE interface
 */

import React from 'react';
import { motion } from 'framer-motion';

interface VibeThinkingIndicatorProps {
  agentName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const dotSizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

export const VibeThinkingIndicator: React.FC<VibeThinkingIndicatorProps> = ({
  agentName,
  size = 'md',
}) => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -8 },
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.15,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  };

  return (
    <div className="flex items-center gap-2">
      {agentName && (
        <span className="text-sm text-muted-foreground font-medium">
          {agentName} is thinking
        </span>
      )}
      <motion.div
        className="flex gap-1 items-center"
        variants={containerVariants}
        initial="initial"
        animate="animate"
        aria-label="Thinking indicator"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`${dotSizes[size]} bg-primary rounded-full`}
            variants={dotVariants}
            transition={{
              duration: 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};
