/**
 * Marketplace Filters Skeleton Component
 * Displays loading state for the search and filter controls
 */

import React from 'react';
import { Card, CardContent } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';
import { cn } from '@shared/lib/utils';

interface MarketplaceFiltersSkeletonProps {
  className?: string;
}

export const MarketplaceFiltersSkeleton: React.FC<
  MarketplaceFiltersSkeletonProps
> = ({ className }) => {
  return (
    <Card className={cn('border-border bg-card', className)}>
      <CardContent className="p-4 md:p-6">
        <div
          className="flex flex-col gap-4 lg:flex-row"
          role="status"
          aria-label="Loading filters"
        >
          {/* Search input skeleton */}
          <div className="flex-1">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Category filter buttons skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton
                key={`category-${index}`}
                className="h-8 w-20 shrink-0"
              />
            ))}
          </div>

          {/* Sort and view mode skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="hidden h-10 w-24 md:block" />
          </div>
        </div>
        <span className="sr-only">Loading search and filter options...</span>
      </CardContent>
    </Card>
  );
};

export default MarketplaceFiltersSkeleton;
