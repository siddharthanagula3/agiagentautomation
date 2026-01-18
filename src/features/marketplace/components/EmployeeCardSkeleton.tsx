/**
 * Employee Card Skeleton Component
 * Displays a loading placeholder for employee cards in the marketplace
 */

import React from 'react';
import { Card, CardContent } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';
import { cn } from '@shared/lib/utils';

interface EmployeeCardSkeletonProps {
  className?: string;
  viewMode?: 'grid' | 'list';
}

export const EmployeeCardSkeleton: React.FC<EmployeeCardSkeletonProps> = ({
  className,
  viewMode = 'grid',
}) => {
  if (viewMode === 'list') {
    return (
      <Card className={cn('border-border bg-card', className)}>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Skeleton className="h-16 w-16 shrink-0 rounded-full" />

            {/* Main content */}
            <div className="flex flex-1 flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Skills and Stats */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className={cn('border-border bg-card', className)}>
      <CardContent className="p-6">
        {/* Header with avatar and badges */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>

        {/* Description */}
        <div className="mb-4 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>

        {/* Skills section */}
        <div className="space-y-3">
          <div>
            <Skeleton className="mb-2 h-4 w-12" />
            <div className="flex flex-wrap gap-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>

          {/* Examples section */}
          <div>
            <Skeleton className="mb-2 h-4 w-16" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-between">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeCardSkeleton;
