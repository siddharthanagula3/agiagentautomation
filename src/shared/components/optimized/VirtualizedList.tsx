/**
 * Virtualized List Component
 * Renders large lists efficiently by only rendering visible items
 */

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@shared/lib/utils';
import { useVirtualizedList } from '@shared/hooks/usePerformanceOptimization';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibleItems, totalHeight, offsetY, handleScroll } =
    useVirtualizedList(items, itemHeight, containerHeight);

  const handleScrollWithCallback = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    handleScroll(e);
    onScroll?.(newScrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScrollWithCallback}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{
                height: itemHeight,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VirtualizedList;
