import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface FloatingDockProps {
  items: {
    icon: React.ReactNode;
    title: string;
    onClick?: () => void;
    href?: string;
  }[];
  className?: string;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  items,
  className,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <TooltipProvider>
      <motion.div
        className={cn(
          'flex items-end gap-4 rounded-2xl border border-border/50 bg-background/80 px-6 py-4 shadow-2xl backdrop-blur-xl',
          className
        )}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            item={item}
            index={index}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
          />
        ))}
      </motion.div>
    </TooltipProvider>
  );
};

interface DockItemProps {
  item: FloatingDockProps['items'][0];
  index: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}

const DockItem: React.FC<DockItemProps> = ({
  item,
  index,
  hoveredIndex,
  setHoveredIndex,
}) => {
  const distance = hoveredIndex !== null ? Math.abs(hoveredIndex - index) : 3;
  const scale = useTransform(
    useMotionValue(distance),
    [0, 1, 2, 3],
    [1.4, 1.2, 1.1, 1]
  );
  const y = useTransform(
    useMotionValue(distance),
    [0, 1, 2, 3],
    [-20, -10, -5, 0]
  );

  const scaleSpring = useSpring(scale, { stiffness: 300, damping: 20 });
  const ySpring = useSpring(y, { stiffness: 300, damping: 20 });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors hover:bg-primary/20"
          style={{ scale: scaleSpring, y: ySpring }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={item.onClick}
          whileTap={{ scale: 0.95 }}
        >
          {item.icon}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{item.title}</p>
      </TooltipContent>
    </Tooltip>
  );
};
