import React from 'react';
import { useKeyboardNavigation } from '@shared/hooks/useAccessibility';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className = '',
}) => {
  const { handleEnter } = useKeyboardNavigation();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    handleEnter(event, () => {
      const target = document.querySelector(href);
      if (target) {
        (target as HTMLElement).focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  return (
    <a
      href={href}
      className={`focus:bg-primary focus:text-primary-foreground focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-none ${className}`}
      onKeyDown={handleKeyDown}
    >
      {children}
    </a>
  );
};

export default SkipLink;
