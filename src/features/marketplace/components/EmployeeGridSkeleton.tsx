/**
 * Employee Grid Skeleton Component
 * Displays a grid of loading placeholders for the marketplace
 */

import React from 'react';
import { cn } from '@shared/lib/utils';
import { EmployeeCardSkeleton } from './EmployeeCardSkeleton';

interface EmployeeGridSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export const EmployeeGridSkeleton: React.FC<EmployeeGridSkeletonProps> = ({
  count = 6,
  viewMode = 'grid',
  className,
}) => {
  return (
    <div
      className={cn(
        'grid gap-6',
        viewMode === 'grid'
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1',
        className
      )}
      role="status"
      aria-label="Loading employees"
    >
      {Array.from({ length: count }).map((_, index) => (
        <EmployeeCardSkeleton key={`skeleton-${index}`} viewMode={viewMode} />
      ))}
      <span className="sr-only">Loading marketplace employees...</span>
    </div>
  );
};

export default EmployeeGridSkeleton;
