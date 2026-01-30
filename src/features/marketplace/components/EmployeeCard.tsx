/**
 * Employee Card Component
 * Displays an AI employee card with details and hire functionality
 *
 * Performance optimizations:
 * - React.memo to prevent unnecessary re-renders when parent re-renders
 * - useCallback for event handlers passed to child components
 */

import React, { memo, useCallback } from 'react';
import { Card, CardContent } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Star, Clock, CheckCircle, Eye, TrendingUp } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { HireButton } from '@shared/components/HireButton';
import { AnimatedAvatar } from '@shared/components/AnimatedAvatar';
import { toast } from 'sonner';
import { EmployeeCardSkeleton } from './EmployeeCardSkeleton';
import type { MarketplaceEmployee } from '@shared/types';

/**
 * Extended marketplace employee type for card display
 * Extends the shared MarketplaceEmployee type with required card-specific fields
 */
export interface AIEmployee extends Omit<
  MarketplaceEmployee,
  'provider' | 'avatar'
> {
  provider: 'claude' | 'gpt4' | 'gemini';
  avatar: string;
  popular: boolean;
  isHired: boolean;
  rating: number;
  reviews: number;
  successRate: number;
  avgResponseTime: string;
  examples: string[];
}

interface EmployeeCardProps {
  employee: AIEmployee;
  viewMode?: 'grid' | 'list';
  isLoading?: boolean;
  onHired?: (employee: AIEmployee) => void;
  onViewDetails?: (employee: AIEmployee) => void;
  className?: string;
}

export const EmployeeCard = memo(function EmployeeCard({
  employee,
  viewMode = 'grid',
  isLoading = false,
  onHired,
  onViewDetails,
  className,
}: EmployeeCardProps) {
  // Memoize event handlers to prevent unnecessary re-renders of child components
  // Note: Hooks must be called unconditionally before any early returns
  const handleViewDetails = useCallback(() => {
    if (onViewDetails) {
      onViewDetails(employee);
    } else {
      toast.info(`Viewing details for ${employee.name}`);
    }
  }, [onViewDetails, employee]);

  const handleHired = useCallback(() => {
    onHired?.(employee);
  }, [onHired, employee]);

  // Show skeleton while loading (after all hooks are called)
  if (isLoading) {
    return <EmployeeCardSkeleton viewMode={viewMode} className={className} />;
  }

  // List view layout
  if (viewMode === 'list') {
    return (
      <Card
        className={cn(
          'border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg',
          className
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <AnimatedAvatar
              src={employee.avatar}
              alt={employee.name}
              size="lg"
              className="h-16 w-16 shrink-0"
            />

            {/* Main content */}
            <div className="flex flex-1 flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-card-foreground">
                    {employee.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {employee.role}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {employee.popular && (
                    <Badge variant="default" className="text-xs">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      Popular
                    </Badge>
                  )}
                  {employee.fitLevel === 'excellent' && (
                    <Badge
                      variant="outline"
                      className="border-green-600 text-xs text-green-600 dark:border-green-500 dark:text-green-500"
                    >
                      Excellent Fit
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {employee.description}
              </p>

              {/* Skills and Stats Row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1">
                  {employee.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {employee.skills.length > 4 && (
                    <Badge variant="outline" className="border-border text-xs">
                      +{employee.skills.length - 4} more
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                    <span className="text-foreground">
                      {employee.rating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({employee.reviews})
                    </span>
                  </div>
                  <span className="font-semibold text-green-500">
                    ${employee.price}/mo
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewDetails}
                  className="border-border hover:bg-accent hover:text-accent-foreground"
                  aria-label={`View detailed information about ${employee.name}, ${employee.role}`}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View Details
                </Button>
                <HireButton
                  employeeId={employee.id}
                  employeeName={employee.name}
                  initialHired={employee.isHired}
                  onHired={handleHired}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view layout (default)
  return (
    <Card
      className={cn(
        'border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <AnimatedAvatar
              src={employee.avatar}
              alt={employee.name}
              size="md"
              className="h-12 w-12"
            />
            <div>
              <h3 className="font-semibold text-card-foreground">
                {employee.name}
              </h3>
              <p className="text-sm text-muted-foreground">{employee.role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {employee.popular && (
              <Badge variant="default" className="text-xs">
                <TrendingUp className="mr-1 h-3 w-3" />
                Popular
              </Badge>
            )}
            {employee.fitLevel === 'excellent' && (
              <Badge
                variant="outline"
                className="border-green-600 text-xs text-green-600 dark:border-green-500 dark:text-green-500"
              >
                Excellent Fit
              </Badge>
            )}
          </div>
        </div>

        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          {employee.description}
        </p>

        <div className="space-y-3">
          {/* Skills */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-card-foreground">
              Skills
            </h4>
            <div className="flex flex-wrap gap-1">
              {employee.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {employee.skills.length > 3 && (
                <Badge variant="outline" className="border-border text-xs">
                  +{employee.skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
              <span className="text-foreground">
                {employee.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({employee.reviews})
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {employee.originalPrice &&
                employee.originalPrice > employee.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${employee.originalPrice}/mo
                  </span>
                )}
              <span className="font-semibold text-green-500">
                ${employee.price}/mo
              </span>
              {employee.yearlyPrice && (
                <span className="text-xs text-muted-foreground">
                  (${employee.yearlyPrice}/year)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <span className="text-foreground">{employee.successRate}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              <span className="text-foreground">
                {employee.avgResponseTime}
              </span>
            </div>
          </div>

          {/* Examples */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-card-foreground">
              Examples
            </h4>
            <div className="space-y-1">
              {employee.examples.slice(0, 2).map((example, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  - {example}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewDetails}
            className="border-border hover:bg-accent hover:text-accent-foreground"
            aria-label={`View detailed information about ${employee.name}, ${employee.role}`}
          >
            <Eye className="mr-1 h-4 w-4" />
            View Details
          </Button>

          <HireButton
            employeeId={employee.id}
            employeeName={employee.name}
            initialHired={employee.isHired}
            onHired={handleHired}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          />
        </div>
      </CardContent>
    </Card>
  );
});

export default EmployeeCard;
