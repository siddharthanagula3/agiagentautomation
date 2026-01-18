/**
 * Marketplace Header Skeleton Component
 * Displays loading state for the marketplace header stats
 */

import React from 'react';
import { Skeleton } from '@shared/ui/skeleton';
import { cn } from '@shared/lib/utils';

interface MarketplaceHeaderSkeletonProps {
  className?: string;
}

export const MarketplaceHeaderSkeleton: React.FC<
  MarketplaceHeaderSkeletonProps
> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      role="status"
      aria-label="Loading marketplace header"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 md:h-9" />
        <Skeleton className="h-4 w-80 md:h-5" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-9 w-24" />
      </div>
      <span className="sr-only">Loading marketplace information...</span>
    </div>
  );
};

export default MarketplaceHeaderSkeleton;
