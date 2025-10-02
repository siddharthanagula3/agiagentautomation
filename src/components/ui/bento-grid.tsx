import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr",
      className
    )}>
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
  hover = true
}) => {
  const colSpanClass = {
    1: 'col-span-1',
    2: 'md:col-span-2',
    3: 'lg:col-span-3'
  }[colSpan];

  const rowSpanClass = {
    1: 'row-span-1',
    2: 'md:row-span-2'
  }[rowSpan];

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border border-border/50",
        gradient ? "bg-gradient-to-br from-primary/5 via-background to-accent/5" : "bg-card",
        colSpanClass,
        rowSpanClass,
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={hover ? { scale: 1.02, transition: { duration: 0.2 } } : undefined}
    >
      {/* Gradient mesh background */}
      {gradient && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
        </div>
      )}

      <div className="relative z-10">
        {icon && (
          <motion.div
            className="mb-4 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            {icon}
          </motion.div>
        )}

        {title && (
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
        )}

        {description && (
          <p className="text-muted-foreground mb-4">{description}</p>
        )}

        {children}
      </div>
    </motion.div>
  );
};
