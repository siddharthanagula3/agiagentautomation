import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const AnimatedGradientText: React.FC<AnimatedGradientTextProps> = ({
  children,
  className,
  animate = true
}) => {
  return (
    <motion.span
      className={cn(
        "bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary bg-300% animate-gradient",
        className
      )}
      initial={animate ? { backgroundPosition: '0% 50%' } : undefined}
      animate={animate ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : undefined}
      transition={animate ? { duration: 5, repeat: Infinity, ease: 'linear' } : undefined}
    >
      {children}
    </motion.span>
  );
};
