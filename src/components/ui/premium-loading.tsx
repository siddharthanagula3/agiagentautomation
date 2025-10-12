import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Zap, Brain } from 'lucide-react';

interface PremiumLoadingProps {
  message?: string;
  variant?: 'default' | 'minimal' | 'sparkles';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PremiumLoading: React.FC<PremiumLoadingProps> = ({
  message = 'Loading...',
  variant = 'default',
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <motion.div
          className={cn('border-2 border-primary border-t-transparent rounded-full', sizeClasses[size])}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (variant === 'sparkles') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className={cn('text-primary', sizeClasses[size])} />
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className={cn('text-primary/50', sizeClasses[size])} />
          </motion.div>
        </motion.div>
        <motion.p
          className={cn('text-muted-foreground font-medium', textSizeClasses[size])}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <div className="relative">
        <motion.div
          className={cn('border-4 border-primary/20 border-t-primary rounded-full', sizeClasses[size])}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Brain className={cn('text-primary', size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-6 h-6')} />
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
            className="w-2 h-2 bg-primary rounded-full"
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
        className={cn('text-muted-foreground font-medium', textSizeClasses[size])}
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
export const DashboardLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center justify-center min-h-[400px]', className)}>
    <PremiumLoading
      message="Preparing your dashboard..."
      variant="sparkles"
      size="lg"
    />
  </div>
);

export const ChatLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center justify-center p-8', className)}>
    <PremiumLoading
      message="AI is thinking..."
      variant="default"
      size="md"
    />
  </div>
);

export const DataLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('flex items-center justify-center p-4', className)}>
    <PremiumLoading
      message="Loading data..."
      variant="minimal"
      size="sm"
    />
  </div>
);

export default PremiumLoading;
