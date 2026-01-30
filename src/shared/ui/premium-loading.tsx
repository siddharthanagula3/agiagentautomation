import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';
import { Sparkles, Brain } from 'lucide-react';

interface PremiumLoadingProps {
  message?: string;
  variant?: 'default' | 'minimal' | 'sparkles';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Get size class based on size prop - uses explicit conditionals to avoid object injection
 */
function getSizeClass(size: 'sm' | 'md' | 'lg'): string {
  if (size === 'sm') return 'w-6 h-6';
  if (size === 'md') return 'w-8 h-8';
  return 'w-12 h-12';
}

/**
 * Get text size class based on size prop - uses explicit conditionals to avoid object injection
 */
function getTextSizeClass(size: 'sm' | 'md' | 'lg'): string {
  if (size === 'sm') return 'text-sm';
  if (size === 'md') return 'text-base';
  return 'text-lg';
}

/**
 * Get brain icon size class based on size prop
 */
function getBrainSizeClass(size: 'sm' | 'md' | 'lg'): string {
  if (size === 'sm') return 'h-3 w-3';
  if (size === 'md') return 'h-4 w-4';
  return 'h-6 w-6';
}

const PremiumLoading: React.FC<PremiumLoadingProps> = ({
  message = 'Loading...',
  variant = 'default',
  size = 'md',
  className,
}) => {
  const sizeClass = getSizeClass(size);
  const textSizeClass = getTextSizeClass(size);

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <motion.div
          className={cn(
            'rounded-full border-2 border-primary border-t-transparent',
            sizeClass
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (variant === 'sparkles') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center space-y-4',
          className
        )}
      >
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className={cn('text-primary', sizeClass)} />
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className={cn('text-primary/50', sizeClass)} />
          </motion.div>
        </motion.div>
        <motion.p
          className={cn('font-medium text-muted-foreground', textSizeClass)}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-4',
        className
      )}
    >
      <div className="relative">
        <motion.div
          className={cn(
            'rounded-full border-4 border-primary/20 border-t-primary',
            sizeClass
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Brain className={cn('text-primary', getBrainSizeClass(size))} />
        </motion.div>
      </div>

      <motion.div
        className="flex space-x-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>

      <motion.p
        className={cn('font-medium text-muted-foreground', textSizeClass)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.p>
    </div>
  );
};

// Specialized loading components
export const DashboardLoading: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn('flex min-h-[400px] items-center justify-center', className)}
  >
    <PremiumLoading
      message="Preparing your dashboard..."
      variant="sparkles"
      size="lg"
    />
  </div>
);

export const ChatLoading: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn('flex items-center justify-center p-8', className)}>
    <PremiumLoading message="AI is thinking..." variant="default" size="md" />
  </div>
);

export const DataLoading: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn('flex items-center justify-center p-4', className)}>
    <PremiumLoading message="Loading data..." variant="minimal" size="sm" />
  </div>
);

export default PremiumLoading;
