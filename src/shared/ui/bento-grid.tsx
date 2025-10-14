import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  );
};

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2;
  gradient?: boolean;
  hover?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className,
  title,
  description,
  icon,
  colSpan = 1,
  rowSpan = 1,
  gradient = false,
  hover = true,
}) => {
  const colSpanClass = {
    1: 'col-span-1',
    2: 'md:col-span-2',
    3: 'lg:col-span-3',
  }[colSpan];

  const rowSpanClass = {
    1: 'row-span-1',
    2: 'md:row-span-2',
  }[rowSpan];

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 p-6',
        gradient
          ? 'bg-gradient-to-br from-primary/5 via-background to-accent/5'
          : 'bg-card',
        colSpanClass,
        rowSpanClass,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={
        hover ? { scale: 1.02, transition: { duration: 0.2 } } : undefined
      }
    >
      {/* Gradient mesh background */}
      {gradient && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        </div>
      )}

      <div className="relative z-10">
        {icon && (
          <motion.div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            {icon}
          </motion.div>
        )}

        {title && <h3 className="mb-2 text-xl font-semibold">{title}</h3>}

        {description && (
          <p className="mb-4 text-muted-foreground">{description}</p>
        )}

        {children}
      </div>
    </motion.div>
  );
};
