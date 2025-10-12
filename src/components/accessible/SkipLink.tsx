import React from 'react';
import { useSkipLink } from '../../hooks/useAccessibility';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  targetId: string;
  label: string;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  label,
  className,
}) => {
  const { getSkipLinkProps } = useSkipLink();

  return (
    <a
      {...getSkipLinkProps(targetId, label)}
      className={cn(
        // Hide by default, show on focus
        'absolute -top-10 left-6 z-50 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200',
        'focus:top-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'translate-y-0 transform focus:translate-y-0',
        className
      )}
    />
  );
};

export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <SkipLink targetId="main-content" label="Skip to main content" />
      <SkipLink targetId="primary-navigation" label="Skip to navigation" />
      <SkipLink targetId="search" label="Skip to search" />
    </div>
  );
};

export default SkipLink;
